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
function Container(gl, main, parent, opts) {
    Container.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.Container = Webvs.defineClass(Container, Webvs.Component, {
    defaultOptions: {
        components: []
    },

    /**
     * initializes all the subcomponents
     * @memberof Webvs.Container#
     */
    init: function(gl, main, parent) {
        var components = [];
        for(var i = 0;i < this.opts.components.length;i++) {
            var opts = this.opts.components[i];
            var component = new (Webvs.getComponentClass(opts.type))(this.gl, this.main, this, opts);
            components.push(component);
        }
        this.components = components;
    },

    /**
     * destroys all subcomponents
     * @memberof Webvs.Container#
     */
    destroy: function() {
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
    addComponent: function(parentId, opts, pos) {
        var component;
        if(parentId == this.id) {
            if(opts instanceof Webvs.Component) {
                component = opts;
                component.adopt(this);
            } else {
                component = new (Webvs.getComponentClass(opts.type))(this.gl, this.main, this, opts);
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
                    var id = component.addComponent(parentId, opts, pos);
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
     * @param {object|string} name - if string then its treated as the
     *      name of the option to be updated. Else its treated as an object
     *      containing the options to be updated.
     * @param {object} value - updated value.
     * @returns {boolean} - true if update succeeded else false
     * @memberof Webvs.Container#
     */
    updateComponent: function(id, name, value) {
        var component, i;
        for(i = 0;i < this.components.length;i++) {
            if(this.components[i].id == id) {
                component = this.components[i];
                break;
            }
        }

        if(component) {
            if(_.isString(name)) {
                component.setOption(name, value);
            } else {
                var opts = name;
                _.each(opts, function(value, name) {
                    component.setOption(name, value);
                });
            }
            return true;
        } else {
            for(i = 0;i < this.components.length;i++) {
                component = this.components[i];
                if(component instanceof Container) {
                    if(component.updateComponent(id, name, value)) {
                        return true;
                    }
                }
            }
        }
        return false;
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
        var opts = this.opts;
        opts.components = [];
        for(var i = 0;i < this.components.length;i++) {
            opts.components.push(this.components[i].getOptions());
        }
        return opts;
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
