/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * AVS Source Ref: r_contrast.cpp
 */
function ColorClip(options) {
    Webvs.checkRequiredOptions(options, ["mode", "color", "outColor"]);
    options = _.defaults(options, {
        mode: "BELOW",
        color: "#202020",
        outColor: "#202020",
        level: 0
    });

    this.mode = _.indexOf(this.modes, options.mode);
    if(this.mode == -1) {
        throw new Error("ColorClip: invalid mode");
    }
    this.color = Webvs.parseColorNorm(options.color);
    this.outColor = Webvs.parseColorNorm(options.outColor);
    this.level = options.level;

    this.program = new Webvs.ColorClipProgram();
}
Webvs.ColorClip = Webvs.defineClass(ColorClip, Webvs.Component, {
    modes: ["BELOW", "ABOVE", "NEAR"],

    init: function(gl, main, parent) {
        ColorClip.super.init.call(this, gl, main, parent);

        this.program.init(gl);
    },

    update: function() {
        this.program.run(this.parent.fm, null, this.mode, this.color, this.outColor, this.level);
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
