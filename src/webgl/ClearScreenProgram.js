/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A Shader that clears the screen to a given color
 * @param {number} blendMode - blending mode for this shader
 * @augments Webvs.QuadBoxProgram
 * @memberof Webvs
 * @constructor
 */
function ClearScreenProgram(blendMode) {
    ClearScreenProgram.super.constructor.call(this, {
        fragmentShader: [
            "uniform vec3 u_color;",
            "void main() {",
            "   setFragColor(vec4(u_color, 1));",
            "}"
        ],
        outputBlendMode: blendMode
    });
}
Webvs.ClearScreenProgram = Webvs.defineClass(ClearScreenProgram, Webvs.QuadBoxProgram, {
    /**
     * Renders this shader
     * @param {Array.<number>} color - color to which the screen will be cleared
     * @memberof Webvs.ClearScreenProgram#
     */
    draw: function(color) {
        this.setUniform.apply(this, ["u_color", "3f"].concat(color));
        ClearScreenProgram.super.draw.call(this);
    }
});

})(Webvs);
