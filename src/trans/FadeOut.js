/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that slowly fades the screen to a specified color
 *
 * @param {object} options - options object
 * @param {number} [speed=1] - speed at which the screen is faded 0 (never) - 1 (fastest)
 * @param {string} [color="#000000"] - fade color
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 * @constructor
 */
function FadeOut(gl, main, parent, opts) {
    FadeOut.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.FadeOut = Webvs.defineClass(FadeOut, Webvs.Component, {
    defaultOptions: {
        speed: 1,
        color: "#000000"
    },

    onChange: {
        speed: "updateSpeed",
        color: "updateColor"
    },

    init: function() {
        this.program = new Webvs.ClearScreenProgram(this.gl, Webvs.AVERAGE);
        this.updateSpeed();
        this.updateColor();
    },

    draw: function() {
        this.frameCount++;
        if(this.frameCount == this.maxFrameCount) {
            this.frameCount = 0;
            this.program.run(this.parent.fm, null, this.color);
        }
    },

    destroy: function() {
        this.program.destroy();
    },

    updateSpeed: function() {
        this.frameCount = 0;
        this.maxFrameCount = Math.floor(1/this.opts.speed);
    },

    updateColor: function() {
        this.color = Webvs.parseColorNorm(this.opts.color);
    }
});

})(Webvs);
