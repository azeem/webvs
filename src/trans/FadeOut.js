/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that slowly fades the screen to a specified color
function FadeOut(gl, main, parent, opts) {
    FadeOut.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(FadeOut, {
    name: "FadeOut",
    menu: "Trans"
});

Webvs.defineClass(FadeOut, Webvs.Component, {
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
        FadeOut.super.destroy.call(this);
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
