/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A base class for all components that can have sub components
 * @memberof Webvs
 * @constructor
 * @param {object} options - options object
 * @param {Array.<object>} components - options array for all the subcomponents
 */
function Container(options) {
    Webvs.checkRequiredOptions(options, ["components"]);

    /**
     * the list of child components
     * @memberof Webvs.Container
     */
    this.components = [];
    this._containerInited = false;

    // add all the sub components
    _.each(options.components, function(options) {
        this.addComponent(options);
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
            var res = components[i].init(gl, main, this);
            if(res) {
                initPromises.push(res);
            }
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


    _findComponent: function(id) {
        for(var i = 0;i < this.components.length;i++) {
            var component = this.components[i];
            if(component.id == id) {
                return [component, i];
            }
        }
    },

    _makeComponent: function(options) {
        var componentClass = Webvs[options.type];
        if(!componentClass) {
            throw new Error("Unknown Component class " + options.type);
        }
        var component = new componentClass(options);
        if(this._containerInited) {
            component.init(this.gl, this.main, this);
        }
        return component;
    },

    /**
     * Adds a new component to this container
     * @memberof Webvs.Container
     * @param {object} compObj - if this is an instance of Webvs.Component then its added as such,
     *                           otherwise its treated as an options object, a new component is
     *                           initialized from class name given in compObj.type property
     * @param {number} [pos] - the new component is added this position, by default components
     *                         are added at the end
     */
    addComponent: function(compObj, pos) {
        var newComponents = [];
        if(compObj instanceof Webvs.Component) {
            newComponents.push(compObj);
        } else {
            // TODO: fix the cloning concept
            var cloneCount = typeof compObj.clone === "undefined"?1:compObj.clone;
            _.times(cloneCount, function(cloneId) {
                var component = this._makeComponent(compObj);
                component.cloneId = cloneId;
                newComponents.push(component);
            }, this);
        }

        if(_.isUndefined(pos)) {
            this.components = this.components.concat(newComponents);
        } else {
            this.components.splice.apply(this.components, [pos, 0].concat(newComponents));
        }
    },

    /**
     * Updates an existing component by replacing it with a new instance
     * Does not update the subcomponents
     * @memberof Webvs.Container
     * @param {string} id - id of the component to be updated
     * @param {object} options - the updated options for the component.
     */
    updateComponent: function(id, options) {
        options = _.clone(options); // work with a clone since we'd be modifying it
        options.id = id; // use the old id itself
        options.components = undefined; // dont pass the children

        // find the component to be updated
        var find = this._findComponent(id);
        if(!find) {
            return;
        }
        var index = find[1];
        var oldComponent = find[0];
        
        // instantiate new component
        var updatedComponent = this._makeComponent(options);

        // set the updated component
        this.components[index] = updatedComponent;

        if(oldComponent instanceof Container) {
            // detach and move the children
            _.each(oldComponent.detachAllComponents(), function(component) {
                updatedComponent.addComponent(component);
                component.move(updatedComponent);
            });
        }

        oldComponent.destroy();
    },

    /**
     * Detached all the components and returns it
     * @memberof Webvs.Container
     * @returns Array.<Webvs.Component> detached components
     */
    detachAllComponents: function() {
        var components = this.components;
        this.components = [];
        return components;
    },

    /**
     * Detaches a component with the given id
     * @memberof Webvs.Container
     * @return Webvs.Component detached component
     */
    detachComponent: function(id) {
        var component = this._findComponent(id);
        if(component) {
            this.components.splice(component[1], 1);
            return component[0];
        }
    }

});

})(Webvs);
