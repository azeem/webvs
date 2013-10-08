/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function FadeOut(options) {
    options = _.defaults(options, {
        speed: 1,
        color: "#000000"
    });
    this.color = Webvs.parseColorNorm(options.color);

    this.frameCount = 0;
    this.maxFrameCount = Math.floor(1/options.speed);
    this.program = new Webvs.ClearScreenProgram(Webvs.AVERAGE);

    FadeOut.super.constructor.call(this);
}
Webvs.FadeOut = Webvs.defineClass(FadeOut, Webvs.Component, {
    componentName: "FadeOut",

    init: function(gl, main, parent) {
        FadeOut.super.init.call(this, gl, main, parent);
        this.program.init(gl);
    },

    update: function() {
        var gl = this.gl;
        this.frameCount++;
        if(this.frameCount == this.maxFrameCount) {
            this.frameCount = 0;
            this.program.run(this.parent.fm, null, this.color);
        }
    }
});
FadeOut.ui = {
    type: "FadeOut",
    disp: "Fade Out",
    schema: {
        speed: {
            type: "number",
            title: "Speed",
            maximum: 0,
            minimum: 1,
            default: 1
        },
        color: {
            type: "string",
            title: "Fadeout color",
            format: "color",
            default: "#FFFFFF"
        }
    },
    form: [
        {key: "speed", type: "range", step: "0.05"},
        "color"
    ]
};

})(Webvs);
