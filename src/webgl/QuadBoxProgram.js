/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A Base for shaders that provides a vertexShader and vertices
// for a rectangle that fills the entire screen
function QuadBoxProgram(gl, options) {
    options = _.defaults(options, {
        vertexShader: [
            "attribute vec2 a_position;",
            "void main() {",
            "   setPosition(a_position);",
            "}"
        ]
    });
    QuadBoxProgram.super.constructor.call(this, gl, options);
}
Webvs.QuadBoxProgram = Webvs.defineClass(QuadBoxProgram, Webvs.ShaderProgram, {
    init: function() {
        this.setVertexAttribData(
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
    },

    // Sets the vertices for the quad box
    draw: function() {
        this.enableVertexAttrib("a_position");
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
});

})(Webvs);
