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
function Container(options, subComponents) {
    Container.super.constructor.call(this, options);

    this.components = [];

    // add all the sub components
    _.each(subComponents || options.components || [], function(component) {
        this.addComponent(this.id, component);
    }, this);

}
Webvs.Container = Webvs.defineClass(Container, Webvs.Component, {
    /**
     * initializes all the subcomponents
     * @memberof Webvs.Container#
     */
    init: function(gl, main, parent) {
        Container.super.init.call(this, gl, main, parent);

        for(var i = 0;i < this.components.length;i++) {
            this.components[i].adoptOrInit(gl, main, this);
        }
    },

    /**
     * destroys all subcomponents
     * @memberof Webvs.Container#
     */
    destroy: function() {
        Container.super.destroy.call(this);
        for(var i = 0;i < this.components.length;i++) {
            this.components[i].destroy();
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
     * @returns {string} - id of the new component
     * @memberof Webvs.Container#
     */
    addComponent: function(parentId, options, pos) {
        if(!(options instanceof Webvs.Component)) {
            options.id = options.id || Webvs.randString(5);
        }

        var component;
        if(parentId == this.id) {
            if(options instanceof Webvs.Component) {
                component = options;
            } else {
                component = new (Webvs.getComponentClass(options.type))(options);
            }
            if(this.componentInited) {
                component.adoptOrInit(this.gl, this.main, this);
            }

            if(_.isNumber(pos)) {
                this.components.splice(pos, 0, component);
            } else {
                this.components.push(component);
            }
            return component.id;
        } else {
            for(var i = 0;i < this.components.length;i++) {
                component = this.components[i];
                if(component instanceof Container) {
                    var id = component.addComponent(parentId, options, pos);
                    if(id) {
                        return id;
                    }
                }
            }
        }
    },

    /**
     * Updates a component under this container's subtree
     * @param {string} id - id of the component
     * @param {object} options - options to be updated.
     * @returns {boolean} - true if update succeeded else false
     * @memberof Webvs.Container#
     */
    updateComponent: function(id, options) {
        var component, i;
        // find the component in this container
        for(i = 0;i < this.components.length;i++) {
            component = this.components[i];
            if(component.id != id) {
                continue;
            }

            options = _.defaults(options, component.options);
            options.id = id;
            var subComponents = component instanceof Container?component.detachAllComponents():undefined;
            var newComponent = new (Webvs.getComponentClass(options.type))(options, subComponents);

            if(this.componentInited) {
                newComponent.adoptOrInit(this.gl, this.main, this);
            }

            this.components[i] = newComponent;
            component.destroy();
            return true;
        }

        for(i = 0;i < this.components.length;i++) {
            component = this.components[i];
            if(component instanceof Container) {
                if(component.updateComponent(id, options)) {
                    return true;
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
        var components = this.components;
        this.components = [];
        return components;
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
                return component;
            }
        }

        // try detaching from any of the subcontainers
        // aggregating results, in case they are cloned.
        for(i = 0;i < this.components.length;i++) {
            component = this.components[i];
            if(component instanceof Container) {
                var detached = component.detachComponent(id);
                if(detached) {
                    return detached;
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
        for(var i = 0;i < this.components.length;i++) {
            var component = this.components[i];
            if(component instanceof Container) {
                component.traverse(callback);
            } else {
                var parentId = component.parent?component.parent.id:undefined;
                var id = component.id;
                var options = component.options;
                callback.call(component, id, parentId, options);
            }
        }
    }

    /**
     * This function is called once for each component in the tree
     * @callback Webvs.Container~traverseCallback
     * @param {string} id - id of the component
     * @param {string} parentId - id of the parent. Undefined for root
     * @param {object} options - the options for this component.
     */
});

})(Webvs);
