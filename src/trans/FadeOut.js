/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function FadeOut(options) {
    options = _.defaults(options, {
        speed: 1,
        color: "#FFFFFF"
    });
    this.color = parseColorNorm(options.color);

    this.frameCount = 0;
    this.maxFrameCount = Math.floor(1/this.speed);

    var fragmentSrc = [
        "uniform vec3 u_color;",
        "void main() {",
        "   setFragColor(vec4(u_color, 1));",
        "}"
    ].join("\n");

    FadeOut.super.constructor.call(this, fragmentSrc);
}
Webvs.FadeOut = Webvs.defineClass(FadeOut, Webvs.QuadBoxComponent, {
    componentName: "FadeOut",
    outputBlendMode: Webvs.AVERAGE,

    init: function() {
        var gl = this.gl;
        this.colorLocation = gl.getUniformLocation(this.program, "u_color");
        FadeOut.super.init.apply(this, arguments);
    },

    update: function() {
        var gl = this.gl;
        this.frameCount++;
        if(this.frameCount == this.maxFrameCount) {
            this.frameCount = 0;
            FadeOut.super.update.apply(this, arguments);
        }
    },
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
