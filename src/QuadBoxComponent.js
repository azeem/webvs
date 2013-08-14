/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {
/**
 * QuadBoxComponent component base class. This component has a
 * fixed vertex shader that draws a frame sized quad.
 *
 * @param fragmentSrc
 * @constructor
 */
function QuadBoxComponent(fragmentSrc) {
    var vertexSrc = [
        "attribute vec2 a_position;",
        "void main() {",
        "   setPosition(a_position);",
        "}"
    ].join("\n");
    QuadBoxComponent.super.constructor.call(this, vertexSrc, fragmentSrc);
}
Webvs.QuadBoxComponent = Webvs.defineClass(QuadBoxComponent, Webvs.ShaderComponent, {
    varyingPos: true,

    destroyComponent: function() {
        QuadBoxComponent.super.destroyComponent.call(this);
        var gl = this.gl;

        gl.deleteBuffer(this.texCoordBuffer);
    },

    init: function() {
        var gl = this.gl;
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1,  -1,
                1,  -1,
                -1,  1,
                -1,  1,
                1,  -1,
                1,  1
            ]),
            gl.STATIC_DRAW
        );

        this.vertexPositionLocation = gl.getAttribLocation(this.program, "a_position");
    },

    update: function(texture) {
        var gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.vertexPositionLocation);
        gl.vertexAttribPointer(this.vertexPositionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
});

})(Webvs);
