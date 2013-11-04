/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A Base for shaders that provides a vertexShader and vertices
 * for a rectangle that fills the entire screen
 * @param {object} options - the options object. passed along to {@link Webvs.ShaderProgram}
 * @augments Webvs.QuadBoxProgram
 * @memberof Webvs
 * @constructor
 */
function QuadBoxProgram(options) {
    options = _.defaults(options, {
        vertexShader: [
            "attribute vec2 a_position;",
            "void main() {",
            "   setPosition(a_position);",
            "}"
        ],
        varyingPos: true
    });
    QuadBoxProgram.super.constructor.call(this, options);
}
Webvs.QuadBoxProgram = Webvs.defineClass(QuadBoxProgram, Webvs.ShaderProgram, {
    /**
     * Sets the vertices for the quad box
     * @memberof Webvs.QuadBoxProgram#
     */
    draw: function() {
        this.setVertexAttribArray(
            "a_position", 
            new Float32Array([
                -1,  -1,
                1,  -1,
                -1,  1,
                -1,  1,
                1,  -1,
                1,  1
            ])
        );
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
});

})(Webvs);
