/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A base class that all Webvs effects extend from.
 * @memberof Webvs
 * @constructor
 * @param {object} options - options object
 * @param {object} [options.id] - id for this component. Default is a random string.
 */
function Component(options) {
    if(options.id) {
        this.id = options.id;
    } else {
        this.id = Webvs.randString(5);
    }
}
Webvs.Component = Webvs.defineClass(Component, Object, {
    /**
     * String name of the component class. Used to generate
     * id strings.
     * @memberof Webgl.Component
     */
    componentName: "Component",

    /**
     * Initialize component. Called once before animation starts.
     * Override and implement initialization code
     * @abstract
     * @param {webglcontext} gl - webgl context
     * @param {Webvs.Main} main - container main object for this component
     * @param {Webvs.Component} - parent component
     * @memberof Webvs.Component
     */
    init: function(gl, main, parent) {
        this.gl = gl;
        this.main = main;
        this.parent = parent;
    },

    /**
     * Returns the sub components in this component. Default
     * implementation returns empty list. Override and implement
     * if component has sub components.
     * @returns {Array.<Webvs.Component>} sub components in this component
     */
    getChildren: function() {
        return [];
    },

    /**
     * Render a frame. Called once for every frame,
     * Override and implement rendering code
     * @abstract
     * @memberof Webvs.Component
     */
    update: function() {},

    /**
     * Release any Webgl resources. Called during
     * reinitialization. Override and implement cleanup code
     * @abstract
     * @memberof Webvs.Component
     */
    destroy: function() {},

    /**
     * Generates a printable id for this component
     * @returns {string} printable name generated from the parent hierarchy
     * @memberof Webvs.Component
     */
    getIdString: function() {
        if(!_.isUndefined(this.parent) && !_.isUndefined(this.id)) {
            return this.parent.getIdString() + "/" + this.componentName + "#" + this.id;
        } else {
            return this.componentName + "#Main";
        }
    }
});

})(Webvs);
