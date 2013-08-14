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
     * this determines whether current render target should be swapped out
     * before updating this component. if set to true then the updateComponent
     * call will receive swapped out texture. Used when current rendering
     * depends on what has been rendered so far
     */
    swapFrame: false,

    /**
     * Initialize component. Called once before animation starts
     * @param gl
     * @param resolution
     * @param analyser
     */
    initComponent: function(gl, resolution, analyser, registerBank, bootTime) {
        this.gl = gl;
        this.resolution = resolution;
        this.analyser = analyser;
        this.registerBank = registerBank;
        this.bootTime = bootTime;
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
