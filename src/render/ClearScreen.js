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
    ClearScreen.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(ClearScreen, {
    name: "ClearScreen",
    menu: "Render"
});

Webvs.defineClass(ClearScreen, Webvs.Component, {
    defaultOptions: {
        beatCount: 0,
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
        if(this.opts.beatCount === 0) {
            clear = true;
        } else {
            if(this.main.analyser.beat && !this.prevBeat) {
                this.beatCount++;
                if(this.beatCount >= this.opts.beatCount) {
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
        this.program.destroy();
    },

    updateColor: function() {
        this.color = Webvs.parseColorNorm(this.opts.color);
    },

    updateProgram: function() {
        var blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
        var program = new Webvs.ClearScreenProgram(this.gl, blendMode);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    }
});

})(Webvs);
