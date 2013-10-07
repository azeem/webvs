/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * Components base class.
 * @constructor
 */
function Component() {}
Webvs.Component = Webvs.defineClass(Component, Object, {
    /**
     * Initialize component. Called once before animation starts
     * @param gl
     * @param resolution
     * @param analyser
     */
    initComponent: function(gl, main, parent) {
        this.gl = gl;
        this.main = main;
        this.parent = parent;
    },

    /**
     * Render a frame. Called once for every frame
     */
    updateComponent: function() {},

    /**
     * Release any Webgl resources. Called during
     * reinitialization
     */
    destroyComponent: function() {},

    getIdString: function() {
        if(!_.isUndefined(this.parent) && !_.isUndefined(this.id)) {
            return this.parent.getIdString() + "/" + this.componentName + "#" + this.id;
        } else {
            return this.componentName + "#Main";
        }
    }
});

})(Webvs);
