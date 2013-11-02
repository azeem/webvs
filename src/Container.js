/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function doClones(component, callback, context) {
    callback.call(context, component);
    if(component.__clones) {
        for(var i = 0;i < component.__clones.length;i++) {
            callback.call(context, component.__clones[i]);
        }
    }
}

function ComponentFactory(options, pool) {
    this.options = options;
    this.pool = pool || [];
}
Webvs.ComponentFactory = Webvs.defineClass(ComponentFactory, Object, {
    get: function(subFactories) {
        if(this.pool.length > 1) {
            return pool.pop();
        } else {
            return ComponentFactory.makeComponent(this.options, subFactories);
        }
    },

    destroyPool: function() {
        _.each(this.pool, function(component) {
            doClones(component, function(clone) {
                clone.destroy();
            });
        });
    }
});
ComponentFactory.makeComponent = function(options, subFactories) {
    var componentClass = Webvs[options.type];
    if(!componentClass) {
        throw new Error("Unknown Component class " + options.type);
    }

    var component = new componentClass(options, subFactories);

    var count = _.isNumber(options.clone)?options.clone:1;
    count--;
    if(count) {
        var clones = [];
        _.repeat(count, function() {
            clones.push(new componentClass(options, subFactories));
        });
        component.__clones = clones;
    }
    
    return component;
}
ComponentFactory.merge = function(factories) {
    var pool = [];
    _.each(factories, function(factory) {
        pool.concat(factory.pool);
    });
    return new ComponentFactory(factories[0].options, pool);
}

/**
 * @class
 * A base class for all components that can have sub components
 * @memberof Webvs
 * @constructor
 * @param {object} options - options object
 * @param {Array.<object>} components - options array for all the subcomponents
 */
function Container(options, subFactories) {
    /**
     * the list of child components
     * @memberof Webvs.Container
     */
    this.components = [];
    this._containerInited = false;

    // add all the sub components
    _.each(subFactories || options.components || [], function(factory) {
        this.addComponent(factory);
    }, this);

    Container.super.constructor.call(this, options);
}
Webvs.Container = Webvs.defineClass(Container, Webvs.Component, {
    /**
     * initializes all the subcomponents
     * @memberof Webvs.Container
     */
    init: function(gl, main, parent) {
        Container.super.init.call(this, gl, main, parent);
        this._containerInited = true;

        // initialize all the sub components
        var components = this.components;
        var initPromises = [];
        for(var i = 0;i < components.length;i++) {
            doClones(components[i], function(clone) {
                var res = clone.adoptOrInit(gl, main, this);
                if(res) {
                    initPromises.push(res);
                }
            }, this);
        }

        return Webvs.joinPromises(initPromises);
    },

    /**
     * destroys all subcomponents
     * @memberof Webvs.Container
     */
    destroy: function() {
        Container.super.destroy.call(this);
        _.each(this.components, function(component) {
            component.destroy();
        });
    },
    
    iterChildren: function(callback, noClones) {
        for(var i = 0;i < this.components.length;i++) {
            doClones(this.components[i], callback, this);
        }
    },

    addComponent: function(parentId, factory, pos) {
        if(!(factory instanceof ComponentFactory)) {
            // if its an options object, then make a factory
            // out of it
            factory.id = factory.id || Webvs.randString(5);
            factory = new ComponentFactory(factory);
        }

        // we are at the correct parent
        if(parentId == this.id) {
            var component = factory.get();
            var promises = [];
            if(this.componentInited) {
                doClones(component, function(clone) {
                    var res = clone.adoptOrInit(this.gl, this.main, this);
                    if(res) {
                        promises.push(res);
                    }
                }, this);
            }
            promises = Webvs.joinPromises(promises);

            if(_.isNumber(pos)) {
                this.components.splice(pos, 0, component);
            } else {
                this.components.push(component);
            }
            return [component.id, promises];
        } else {
            // try any of the subcontainers and repeat
            // on all clones if required
            for(var i = 0;i < this.components.length;i++) {
                var component = this.components[i];
                if(component instanceof Container) {
                    var res = component.addComponent(parentId, factory, pos);
                    if(res) {
                        var id = res[0];
                        var promises = [res[1]];
                        if(component.__clones) {
                            _.each(component.__clones, function(clone) {
                                var res = clone.addComponent(parentId, factory, pos);
                                promises.push(res[1]);
                            });
                        }
                        promises = Webvs.joinPromises(promises);
                        return [id, promises];
                    }
                }
            }
        }
    },

    updateComponent: function(id, options) {
        // find the component in this container
        for(var i = 0;i < this.components.length;i++) {
            var component = this.components[i];
            if(component.id != id) {
                continue;
            }

            options = _.defaults(options, component.options); // use undefined properties from existing
            options.id = id;
            // create updated component. detach and move subcomponents if required
            var subFactories = component instanceof Container?component.detachAllComponents():undefined;
            var newComponent = ComponentFactory.makeComponent(options, subFactories);
            if(subFactories) {
                // cleanup the detached factories. in case they have more elements
                _.each(subFactories, function(factory) {
                    factory.destroyPool();
                });
            }

            // replace and init/move the components
            var promises = [];
            if(this.componentInited) {
                doClones(newComponent, function(clone) {
                    promises.push(clone.adoptOrInit(this.gl, this.main, this));
                }, this);
            }
            promises = Webvs.joinPromises(promises);

            // replace the components
            this.components[i] = newComponent;

            // destroy the old component
            doClones(component, function(clone) {
                clone.destroy();
            });

            return promises;
        }

        // if component not in this container
        // then try any of the subcomponents
        for(var i = 0;i < this.component.length;i++) {
            var component = this.components[i];
            if(component instanceof Container) {
                var promise = component.updateComponent(id, options);
                if(promise) {
                    var promise = [promise];
                    _.each(component.__clones, function(clone) {
                        promise.push(clone.updateComponent(id, options));
                    });
                    return Webvs.joinPromises(promise);
                }
            }
        }
    },

    detachAllComponents: function() {
        var detached = _.map(this.components, function(component) {
            return new ComponentFactory(component.options, [component]);
        });
        this.components = [];
        return detached;
    },

    detachComponent: function(id) {
        // search for the component in this container
        for(var i = 0;i < this.component.length;i++) {
            var component = this.components[i];
            if(component.id == id) {
                return new ComponentFactory(component.options, [component]);
            }
        }

        // try detaching from any of the subcontainers
        // aggregating results, in case they are cloned.
        for(var i = 0;i < this.components.length;i++) {
            var component = this.components[i];
            if(component instanceof Container) {
                var factory = component.detachComponent(id);
                if(factory) {
                    if(component.__clones) {
                        factory = [factory];
                        _.each(component.__clones, function(clone) {
                            detached.push(clone.detachComponent(id));
                        });
                        factory = ComponentFactory.merge(factory);
                    }
                    return factory;
                }
            }
        }
    },

    getOptions: function() {
        var options = this.options;
        options.components = [];
        for(var i = 0;i < this.components.length;i++) {
            var component = this.components[i];
            if(component instanceof Container) {
                options.components.push(component.getOptionTree());
            } else {
                options.components.push(component.options);
            }
        }
        return options;
    }

});

})(Webvs);
