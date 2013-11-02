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
        _.times(count, function(index) {
            var clone = new componentClass(options, subFactories);
            clone.cloneId = index + 1;
            clones.push(clone);
        });
        component.cloneId = 0;
        component.__clones = clones;
    }
    
    return component;
};
ComponentFactory.merge = function(factories) {
    var pool = [];
    _.each(factories, function(factory) {
        pool.concat(factory.pool);
    });
    return new ComponentFactory(factories[0].options, pool);
};

/**
 * @class
 * A base class for all components that can have sub components
 * @memberof Webvs
 * @constructor
 * @param {object} options - options object
 * @param {Array.<object>} components - options array for all the subcomponents
 */
function Container(options, subFactories) {
    Container.super.constructor.call(this, options);

    /**
     * the list of child components
     * @memberof Webvs.Container
     */
    this.components = [];
    this._containerInited = false;

    // add all the sub components
    _.each(subFactories || options.components || [], function(factory) {
        this.addComponent(this.id, factory);
    }, this);

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
        var initPromises = [];
        _.each(this.components, function(component) {
            doClones(component, function(clone) {
                var res = clone.adoptOrInit(gl, main, this);
                if(res) {
                    initPromises.push(res);
                }
            }, this);
        }, this);

        return Webvs.joinPromises(initPromises);
    },

    /**
     * destroys all subcomponents
     * @memberof Webvs.Container
     */
    destroy: function() {
        Container.super.destroy.call(this);
        _.each(this.components, function(component) {
            doClones(component, function(clone) {
                clone.destroy();
            });
        });
    },
    
    iterChildren: function(callback) {
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

        var component, promises;
        // we are at the correct parent
        if(parentId == this.id) {
            component = factory.get();
            promises = [];
            if(this.componentInited) {
                doClones(component, function(clone) {
                    var promise = clone.adoptOrInit(this.gl, this.main, this);
                    if(promise) {
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
                component = this.components[i];
                if(component instanceof Container) {
                    var res = component.addComponent(parentId, factory, pos);
                    if(res) {
                        var id = res[0];
                        promises = [res[1]];
                        if(component.__clones) {
                            for(var j = 0;j < component.__clones;j++) {
                                res = component.__clones[j].addComponent(parentId, factory, pos);
                                promises.push(res[1]);
                            }
                        }
                        promises = Webvs.joinPromises(promises);
                        return [id, promises];
                    }
                }
            }
        }
    },

    updateComponent: function(id, options) {
        var component, componentIndex, promise, i, j;
        // find the component in this container
        for(i = 0;i < this.components.length;i++) {
            if(this.components[i].id == id) {
                component = this.components[i];
                componentIndex = i;
            }
        }
        if(component) {
            options = _.defaults(options, component.options); // use undefined properties from existing
            options.id = id;
            // create updated component. detach and move subcomponents if required
            var subFactories = component instanceof Container?component.detachAllComponents():undefined;
            var newComponent = ComponentFactory.makeComponent(options, subFactories);
            if(subFactories) {
                // cleanup the detached factories. in case they have more elements
                for(j = 0;j < subFactories.length;j++) {
                    subFactories[j].destroyPool();
                }
            }

            // replace and init the components
            var promises = [];
            if(this.componentInited) {
                doClones(newComponent, function(clone) {
                    promises.push(clone.adoptOrInit(this.gl, this.main, this));
                }, this);
            }
            promises = Webvs.joinPromises(promises);

            // replace the component
            this.components[componentIndex] = newComponent;

            // destroy the old component
            doClones(component, function(clone) {
                clone.destroy();
            });

            return promises;
        }

        // if component not in this container
        // then try any of the subcomponents
        for(i = 0;i < this.component.length;i++) {
            component = this.components[i];
            if(component instanceof Container) {
                promise = component.updateComponent(id, options);
                if(promise) {
                    promise = [promise];
                    for(j = 0;j < component.__clones.length;j++) {
                        promise.push(component.__clones[j].updateComponent(id, options));
                    }
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
        var component, i;
        // search for the component in this container
        for(i = 0;i < this.components.length;i++) {
            component = this.components[i];
            if(component.id == id) {
                this.components.splice(i, 1);
                return new ComponentFactory(component.options, [component]);
            }
        }

        // try detaching from any of the subcontainers
        // aggregating results, in case they are cloned.
        for(i = 0;i < this.components.length;i++) {
            component = this.components[i];
            if(component instanceof Container) {
                var factory = component.detachComponent(id);
                if(factory) {
                    if(component.__clones) {
                        factory = [factory];
                        for(var j = 0;j < component.__clones.length;j++) {
                            detached.push(component.__clones[j].detachComponent(id));
                        }
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
