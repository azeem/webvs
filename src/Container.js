/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {


/**
 * @class
 * A base class for all components that can have sub components.
 * Manages, cloning and component tree operations
 * @memberof Webvs
 * @constructor
 * @param {object} options - options object
 * @param {Array.<object>} options.components - options array for all the subcomponents
 * @param {Array.<Webvs.ComponentFactory>} subFactories - factories for subcomponents. If
 *     provided then subcomponents are added from this factory and options.components is ignored.
 *     useful when moving existing subcomponent instances into new container.
 */
function Container(options, subFactories) {
    Container.super.constructor.call(this, options);

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
     * @memberof Webvs.Container#
     */
    init: function(gl, main, parent) {
        Container.super.init.call(this, gl, main, parent);
        this._containerInited = true;

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
     * @memberof Webvs.Container#
     */
    destroy: function() {
        Container.super.destroy.call(this);
        _.each(this.components, function(component) {
            doClones(component, function(clone) {
                clone.destroy();
            });
        });
    },
    
    /**
     * Allows iterating over all the subcomponents, flattening
     * out cloned components.
     * @param {function} callback - callback
     * @memberof Webvs.Container#
     */
    iterChildren: function(callback) {
        for(var i = 0;i < this.components.length;i++) {
            doClones(this.components[i], callback, this);
        }
    },

    /**
     * Adds a component as child of the given parent that
     * resides under this containers subtree
     * @param {string} parentId - id of the parent under which the component is
     *     to be added
     * @param {Webvs.ComponentFactory} factory - factory from which component should be
     *      created. If an options object is passed then a Webvs.ComponentFactory
     *      is implicitly created from it
     * @param {number} [pos] - position at which the component will be inserted.
     *     default is the end of the list
     * @returns {Array} - a pair containing 1) id of the new component 2) promise
     *     for the new component initialization
     * @memberof Webvs.Container#
     */
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
                    promises.push(clone.adoptOrInit(this.gl, this.main, this));
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
                        var promise = res[1];
                        if(component.__clones) {
                            promise = [promise];
                            for(var j = 0;j < component.__clones.length;j++) {
                                res = component.__clones[j].addComponent(parentId, factory, pos);
                                promise.push(res[1]);
                            }
                            promise = Webvs.joinPromises(promise);
                        }
                        return [id, promise];
                    }
                }
            }
        }
    },

    /**
     * Updates a component under this container's subtree
     * @param {string} id - id of the component
     * @param {object} options - options to be updated.
     * @returns {Webvs.Promise} - promise for the component reinitialiaztion
     * @memberof Webvs.Container#
     */
    updateComponent: function(id, options) {
        var component, componentIndex, promise, i, j;
        // find the component in this container
        for(i = 0;i < this.components.length;i++) {
            if(this.components[i].id == id) {
                component = this.components[i];
                componentIndex = i;
                break;
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
        for(i = 0;i < this.components.length;i++) {
            component = this.components[i];
            if(component instanceof Container) {
                promise = component.updateComponent(id, options);
                if(promise) {
                    if(component.__clones) {
                        promise = [promise];
                        for(j = 0;j < component.__clones.length;j++) {
                            promise.push(component.__clones[j].updateComponent(id, options));
                        }
                        promise = Webvs.joinPromises(promise);
                    }
                    return promise;
                }
            }
        }
    },

    /**
     * Detaches all components in this container
     * @returns {Array.<Webvs.ComponentFactory>} factories for each subcomponent
     * @memberof Webvs.Container#
     */
    detachAllComponents: function() {
        var detached = _.map(this.components, function(component) {
            return new ComponentFactory(component.options, [component]);
        });
        this.components = [];
        return detached;
    },

    /**
     * Detaches a given component under this container's subtree
     * @param {string} id - id of the component to be detached
     * @returns {Webvs.ComponentFactory} - factory containing the detached component
     * @memberof Webvs.Container#
     */
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
                            factory.push(component.__clones[j].detachComponent(id));
                        }
                        factory = ComponentFactory.merge(factory);
                    }
                    return factory;
                }
            }
        }
    },

    /**
     * Constructs complete options object for this container and its
     * subtree
     * @returns {object} - the options object
     * @memberof Webvs.Container#
     */
    getOptions: function() {
        var options = this.options;
        options.components = [];
        for(var i = 0;i < this.components.length;i++) {
            options.components.push(this.components[i].getOptions());
        }
        return options;
    },

    /**
     * Traverses a callback over this subtree, starting with this container
     * @param {Webvs.Container~traverseCallback} callback - callback.
     * @memberof Webvs.Container#
     */
    traverse: function(callback) {
        callback.call(this, this.id, (this.parent?this.parent.id:undefined), this.options);
        _.each(this.components, function(component) {
            if(component instanceof Container) {
                component.traverse(callback);
            } else {
                var parentId = component.parent?component.parent.id:undefined;
                var id = component.id;
                var options = component.options;
                callback.call(component, id, parentId, options);
            }
        });
    }

    /**
     * This function is called once for each component in the tree
     * @callback Webvs.Container~traverseCallback
     * @param {string} id - id of the component
     * @param {string} parentId - id of the parent. Undefined for root
     * @param {object} options - the options for this component.
     */
});

/**
 * @class
 * A Helper class for creating/reusing component instances
 * consistently. Basically this provides a facility for
 * giving out component instances from a pool. New instances
 * are created for requests that come after the pool is exhausted.
 * @constructor
 * @memberof Webvs
 * @param {object} options - options for the component. this will be used when creating
 *                           new instances
 * @param {Array.<Webvs.Component>} pool - pool of used components
 */
function ComponentFactory(options, pool) {
    this.options = options;
    this.pool = pool || [];
}
Webvs.ComponentFactory = Webvs.defineClass(ComponentFactory, Object, {
    /**
     * Gives out a component instance from the pool. Creates one
     * if pool is empty
     * @param {Array.<ComponentFactory>} [subFactories] - factories for sub-components when
     *                                                  creating containers.
     * @memberof Webvs.ComponentFactory#
     */
    get: function(subFactories) {
        if(this.pool.length > 0) {
            return this.pool.pop();
        } else {
            return ComponentFactory.makeComponent(this.options, subFactories);
        }
    },

    /**
     * Destroys all components in the pool and empties it
     * @memberof Webvs.ComponentFactory#
     */
    destroyPool: function() {
        _.each(this.pool, function(component) {
            doClones(component, function(clone) {
                clone.destroy();
            });
        });
        this.pool = [];
    }
});
/**
 * Creates a new component instance, and its clones, if required. Clones
 * are conveniently tucked away inside one component, so that a component
 * can be moved around as if it is a single component.
 * @param {object} options - options for the component
 * @param {Array.<ComponentFactory>} subFactories - factories for sub-components when
 *                                                  creating containers.
 * @memberof Webvs.ComponentFactory
 */
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
/**
 * Merges several Webvs.ComponentFactory into one with a merged pool
 * @param {Array.<ComponentFactory>} factories - factories to be merged
 * @memberof Webvs.ComponentFactory
 */
ComponentFactory.merge = function(factories) {
    var pool = [];
    _.each(factories, function(factory) {
        pool = pool.concat(factory.pool);
    });
    return new ComponentFactory(factories[0].options, pool);
};

// this function lets us iterate over a component and its clones
function doClones(component, callback, context) {
    callback.call(context, component);
    if(component.__clones) {
        for(var i = 0;i < component.__clones.length;i++) {
            callback.call(context, component.__clones[i]);
        }
    }
}

})(Webvs);
