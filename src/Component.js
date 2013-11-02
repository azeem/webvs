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
    this.id = options.id;
    this.enabled = _.isUndefined(options.enabled)?true:options.enabled;
    this.componentInited = false;
    this.options = options;
}
Webvs.Component = Webvs.defineClass(Component, Object, {
    /**
     * String name of the component class. Used to generate
     * id strings.
     * @memberof Webvs.Component
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
        this.componentInited = true;
    },

    adoptOrInit: function(gl, main, parent) {
        if(this.componentInited) {
            return this.adopt(parent);
        } else {
            return this.init(gl, main, parent);
        }
    },

    /**
     * Called when the component is moved to a different
     * parent. Default implementation simply resets the parent reference.
     * Override and implement additional logic if required
     * @param {Webvs.Component} newParent - the new parent of this component
     * @memberof Webvs.Component
     */
    adopt: function(newParent) {
        this.parent = newParent;
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

    getOptions: function() {
        return this.getOptions;
    },

    /**
     * Generates a printable path of this component
     * @returns {string} printable path generated from the parent hierarchy
     * @memberof Webvs.Component
     */
    getPath: function() {
        if(!_.isUndefined(this.parent) && !_.isUndefined(this.id)) {
            return this.parent.getIdString() + "/" + this.componentName + "#" + this.id;
        } else {
            return this.componentName + "#Main";
        }
    }
});

})(Webvs);
