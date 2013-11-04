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
function UniqueTone(options) {
    options = _.defaults(options, {
        color: "#ffffff",
        invert: false,
        blendMode: "REPLACE"
    });

    this.tone = Webvs.parseColorNorm(options.color);
    this.invert = options.invert;
    this.program = new UniqueToneProgram(Webvs.getBlendMode(options.blendMode));
}
Webvs.UniqueTone = Webvs.defineClass(UniqueTone, Webvs.Component, {
    /**
     * initializes the UniqueTone component
     * @memberof Webvs.UniqueTone#
     */
    init: function(gl, main, parent) {
        UniqueTone.super.init.call(this, gl, main, parent);
        this.program.init(gl);
    },

    /**
     * applies unique tone
     * @memberof Webvs.UniqueTone#
     */
    update: function() {
        this.program.run(this.parent.fm, null, this.tone, this.invert);
    },

    /**
     * releases resources
     * @memberof Webvs.UniqueTone#
     */
    destroy: function() {
        UniqueTone.super.destroy.call(this);
        this.program.cleanup();
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
