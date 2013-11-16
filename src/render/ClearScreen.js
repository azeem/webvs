/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that clears the screen
 *
 * @param {object} options - options object
 * @param {number} [options.n=0] - beat counter, screen will be cleared for every n beats.
 *      use 0 to clear all frames.
 * @param {string} [options.color="#000000"] - color to which screen is to be cleared
 * @param {string} [options.blendMode="REPLACE"] - blend clearing onto previous buffer
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
function ClearScreen(gl, main, parent, opts) {
    ClearScreen.super.constructor.call(this, main, parent, opts);
}
Webvs.ClearScreen = Webvs.defineClass(ClearScreen, Webvs.Component, {
    defaultOptions: {
        n: 0,
        color: "#000000",
        blendMode: "REPLACE"
    },

    onChange: {
        color: "updateColor",
        blendMode: "updateProgram"
    },

    init: function() {
        this.prevBeat = false;
        this.beatCount = 0;

        this.updateColor();
        this.updateProgram();
    },

    draw: function() {
        var clear = false;
        if(this.opts.n === 0) {
            clear = true;
        } else {
            if(this.main.analyser.beat && !this.prevBeat) {
                this.beatCount++;
                if(this.beatCount >= this.opts.n) {
                    clear = true;
                    this.beatCount = 0;
                }
            }
            this.prevBeat = this.main.analyser.beat;
        }

        if(clear) {
            this.program.run(this.parent.fm, null, this.color);
        }
    },

    destroy: function() {
        this.program.cleanup();
    },

    updateColor: function() {
        this.color = Webvs.parseColorNorm(this.opts.color);
    },

    updateProgram: function() {
        var program = new Webvs.ClearScreenProgram(Webvs.getBlendMode(this.opts.blendMode));
        program.init(this.gl);
        if(this.program) {
            this.program.cleanup();
        }
        this.program = program;
    }
});

})(Webvs);
