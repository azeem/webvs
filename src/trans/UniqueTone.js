/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A Component that applies a unique color tone
 * @param {object} options - options object
 * @param {string} [options.color="#FFFFFF"] - the color tone
 * @param {boolean} [options.invert=false] - if set then tone is inverted
 * @param {string} [options.blendMode="REPLACE"] - blending mode for this component
 * @augments Webvs.Component
 * @memberof Webvs
 * @constructor
 */
function UniqueTone(gl, main, parent, opts) {
    UniqueTone.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.UniqueTone = Webvs.defineClass(UniqueTone, Webvs.Component, {
    defaultOptions: {
        color: "#ffffff",
        invert: false,
        blendMode: "REPLACE"
    },

    onChange: {
        color: "updateColor",
        blendMode: "updateProgram"
    },

    init: function() {
        this.updateColor();
        this.updateProgram();
    },

    draw: function() {
        this.program.run(this.parent.fm, null, this.tone, this.opts.invert);
    },

    destroy: function() {
        this.program.cleanup();
    },

    updateColor: function() {
        this.tone = Webvs.parseColorNorm(this.opts.color);
    },

    updateProgram: function() {
        var program = new UniqueToneProgram(Webvs.getBlendMode(this.opts.blendMode));
        program.init(this.gl);
        if(this.program) {
            this.program.cleanup();
        }
        this.program = program;
    }
});

function UniqueToneProgram(blendMode) {
    UniqueToneProgram.super.constructor.call(this, {
        outputBlendMode: blendMode,
        swapFrame: true,
        fragmentShader: [
            "uniform vec3 u_tone;",
            "uniform bool u_invert;",
            "void main() {",
            "   vec4 srcColor = getSrcColor();",
            "   float depth = max(srcColor.r, max(srcColor.g, srcColor.b));",
            "   if(u_invert) {",
            "       depth = 1.0-depth;",
            "   }",
            "   setFragColor(vec4(depth*u_tone, 1));",
            "}"
        ]
    });
}
Webvs.UniqueToneProgram = Webvs.defineClass(UniqueToneProgram, Webvs.QuadBoxProgram, {
    draw: function(tone, invert) {
        this.setUniform.apply(this, ["u_tone", "3f"].concat(tone));
        this.setUniform("u_invert", "1f", invert?1:0);
        UniqueToneProgram.super.draw.call(this);
    }
});

})(Webvs);
