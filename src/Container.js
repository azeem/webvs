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
    delete this.opts.components;
}
Webvs.Container = Webvs.defineClass(Container, Webvs.Component, {
    /**
     * initializes all the subcomponents
     * @memberof Webvs.Container#
     */
    init: function(gl, main, parent) {
        var components = [];
        if(this.opts.components) {
            for(var i = 0;i < this.opts.components.length;i++) {
                var opts = this.opts.components[i];
                var component = new (Webvs.getComponentClass(opts.type))(this.gl, this.main, this, opts);
                components.push(component);
            }
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
    
    createComponent: function(opts) {
        return (new (Webvs.getComponentClass(opts.type))(this.gl, this.main, this, opts));
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
    addComponent: function(componentOpts, pos, options) {
        var component;
        if(componentOpts instanceof Webvs.Component) {
            component = componentOpts;
            component.setParent(this);
        } else {
            component = this.createComponent(componentOpts);
        }
        if(!_.isNumber(pos)) {
            pos = this.components.length;
        }
        this.components.splice(pos, 0, component);

        options = _.defaults({pos: pos}, options);
        this.trigger("addComponent", component, this, options);
        return component;
    },

    detachComponent: function(pos, options) {
        if(_.isString(pos)) {
            var id = pos;
            var i;
            for(i = 0;i < this.components.length;i++) {
                if(this.components[i].id == id) {
                    pos = i;
                    break;
                }
            }
            if(i == this.components.length) {
                return;
            }
        }
        var component = this.components[pos];
        this.components.splice(pos, 1);

        options = _.defaults({pos: pos}, options);
        this.trigger("detachComponent", component, this, options);
        return component;
    },

    findComponent: function(id) {
        var i;
        for(i = 0;i < this.components.length;i++) {
            var component = this.components[i];
            if(component.id == id) {
                return component;
            }
        }

        // search in any subcontainers
        for(i = 0;i < this.components.length;i++) {
            var container = this.components[i];
            if(!(container instanceof Container)) {
                continue;
            }
            var subComponent = container.findComponent(id);
            if(subComponent) {
                return subComponent;
            }
        }
    },

    /**
     * Constructs complete options object for this container and its
     * subtree
     * @returns {object} - the options object
     * @memberof Webvs.Container#
     */
    toJSON: function() {
        var opts = Container.super.toJSON.call(this);

        opts.components = [];
        for(var i = 0;i < this.components.length;i++) {
            opts.components.push(this.components[i].toJSON());
        }
        return opts;
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
