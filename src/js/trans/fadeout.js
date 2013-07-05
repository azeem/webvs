/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

function FadeOut(options) {
    options = options?options:{};
    this.speed = options.speed?options.speed:1;
    this.color = options.color?options.color:[0,0,0];

    if(this.color.length != 3) {
        throw new Error("Invalid clear color, must be an array of 3");
    }
    for(var i = 0;i < this.color.length;i++) {
        this.color[i] = this.color[i]/255;
    }

    this.frameCount = 0;
    this.maxFrameCount = Math.floor(1/this.speed);

    var vertexSrc = [
        "attribute vec2 a_position;",
        "void main() {",
        "   setPosition(a_position);",
        "}"
    ].join("\n");

    var fragmentSrc = [
        "uniform vec3 u_color;",
        "void main() {",
        "   setFragColor(vec4(u_color, 1));",
        "}"
    ].join("\n");

    FadeOut.super.constructor.call(this, vertexSrc, fragmentSrc, blendModes.AVERAGE);
}
extend(FadeOut, ShaderComponent, {
    componentName: "FadeOut",

    init: function() {
        var gl = this.gl;

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
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

        this.colorLocation = gl.getUniformLocation(this.program, "u_color");
    },

    update: function() {
        var gl = this.gl;
        this.frameCount++;
        if(this.frameCount == this.maxFrameCount) {
            this.frameCount = 0;
            gl.uniform3fv(this.colorLocation, this.color);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.enableVertexAttribArray(this.positionLocation);
            gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    },

    destroyComponent: function() {
        FadeOut.super.destroyComponent.call(this);
        this.gl.deleteBuffer(this.vertexBuffer);
    }
});

window.Webvs.FadeOut = FadeOut;
