/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that clips colors to a different color depending
// on whether the source colors are above or below a reference color.
function ColorClip(gl, main, parent, opts) {
    ColorClip.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(ColorClip, {
    name: "ColorClip",
    menu: "Trans"
});

var ClipModes = {
    "BELOW": 0,
    "ABOVE": 1,
    "NEAR": 2
};
ColorClip.ClipModes = ClipModes;

Webvs.defineClass(ColorClip, Webvs.Component,  {
    defaultOptions: {
        mode: "BELOW",
        color: "#202020",
        outColor: "#202020",
        level: 0
    },

    onChange: {
        mode: "updateMode",
        color: "updateColor",
        outColor: "updateColor"
    },

    init: function() {
        this.program = new ColorClipProgram(this.gl);
        this.updateColor();
        this.updateMode();
    },

    draw: function() {
        this.program.run(this.parent.fm, null, this.mode, this.color, this.outColor, this.opts.level);
    },

    destroy: function() {
        ColorClip.super.destroy.call(this);
        this.program.destroy();
    },

    updateMode: function() {
        this.mode = Webvs.getEnumValue(this.opts.mode, ClipModes);
    },

    updateColor: function() {
        this.color = Webvs.parseColorNorm(this.opts.color);
        this.outColor = Webvs.parseColorNorm(this.opts.outColor);
    }
});

function ColorClipProgram(gl) {
    ColorClipProgram.super.constructor.call(this, gl, {
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
