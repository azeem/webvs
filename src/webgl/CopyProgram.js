/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A Shader that copies given texture onto current buffer
 * @param {object} options - the options object. passed along to {@link Webvs.ShaderProgram}
 * @augments Webvs.QuadBoxProgram
 * @memberof Webvs
 * @constructor
 */
function CopyProgram(gl, options) {
    options = _.defaults(options||{}, {
        fragmentShader: [
            "uniform sampler2D u_copySource;",
            "void main() {",
            "   setFragColor(texture2D(u_copySource, v_position));",
            "}"
        ]
    });
    CopyProgram.super.constructor.call(this, gl, options);
}
Webvs.CopyProgram = Webvs.defineClass(CopyProgram, Webvs.QuadBoxProgram, {
    /**
     * Renders this shader
     * @param {WebGLTexture} srcTexture - the texture to be copied to the screen
     * @memberof Webvs.CopyProgram#
     */
    draw: function(srcTexture) {
        this.setUniform("u_copySource", "texture2D", srcTexture);
        CopyProgram.super.draw.call(this);
    }
});

})(Webvs);
