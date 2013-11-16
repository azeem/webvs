/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that clips colors to a different color depending
 * on whether the source colors are above or below a reference color.
 * 
 * @see r_contrast.cpp
 * @param {object} options - options object
 * @param {string} [options.mode="BELOW"] - comparison mode viz. `BELOW`, `ABOVE`, `NEAR`
 * @param {string} [options.color="#202020"] - reference color against which the
 *     the screen colors are compared
 * @param {string} [options.outColor="#202020"] - output color for clipped pixels
 * @param {number} [options.level=0] - when mode is `NEAR`, this value decides the distance
 *     between source and reference colors below which pixels would be clipped. 0-1 normalized
 *
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
function ColorClip(gl, main, parent, opts) {
    ColorClip.super.constructor.call(this, gl, main, parent, opts);
}
ColorClip.modes = ["BELOW", "ABOVE", "NEAR"];
Webvs.ColorClip = Webvs.defineClass(ColorClip, Webvs.Component,  {
    componentName: "ColorClip",

    defaultOptions: {
        mode: "BELOW",
        color: "#202020",
        outColor: "#202020",
        level: 0
    },

    onChange: {
        mode: "updateMode"
        color: "updateColor",
        outColor: "updateColor"
    },

    init: function() {
        this.program = new ColorClipProgram();
        this.program.init(this.gl);
        this.updateColor();
        this.updateMode();
    },

    draw: function() {
        this.program.run(this.parent.fm, null, this.mode, this.color, this.outColor, this.opts.level);
    },

    destroy: function() {
        this.program.cleanup();
    },

    updateMode: function() {
        var index = ColorClip.modes.indexOf(this.opts.mode);
        if(index == -1) {
            throw new Error("Unkown mode " + this.opts.mode);
        }
        this.mode = index;
    },

    updateColor: function() {
        this.color = Webvs.parseColorNorm(this.opts.color);
        this.outColor = Webvs.parseColorNorm(this.opts.color);
    }
});

function ColorClipProgram() {
    ColorClipProgram.super.constructor({
        swapFrame: true,
        fragmentShader: [
            "uniform int u_mode;",
            "uniform vec3 u_color;",
            "uniform vec3 u_outColor;",
            "uniform float u_level;",

            "void main() {",
            "   vec4 inColor4 = getSrcColor();",
            "   vec3 inColor = inColor4.rgb;",
            "   bool clip = false;",
            "   if(u_mode == 0) {",
            "           clip = all(lessThanEqual(inColor, u_color));",
            "   }",
            "   if(u_mode == 1) {",
            "           clip = all(greaterThanEqual(inColor, u_color));",
            "   }",
            "   if(u_mode == 2) {",
            "           clip = (distance(inColor, u_color) <= u_level*0.5);",
            "   }",
            "   if(clip) {",
            "       setFragColor(vec4(u_outColor, inColor4.a));",
            "   } else {",
            "       setFragColor(inColor4);",
            "   }",
            "}",
        ]
    });
}
Webvs.ColorClipProgram = Webvs.defineClass(ColorClipProgram, Webvs.QuadBoxProgram, {
    draw: function(mode, color, outColor, level) {
        this.setUniform("u_mode", "1i", mode);
        this.setUniform.apply(this, ["u_color", "3f"].concat(color));
        this.setUniform.apply(this, ["u_outColor", "3f"].concat(outColor));
        this.setUniform("u_level", "1f", level);
        ColorClipProgram.super.draw.call(this);
    }
});

})(Webvs);
