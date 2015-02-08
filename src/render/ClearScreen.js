/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that clears the screen
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
        ClearScreen.super.destroy.call(this);
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
