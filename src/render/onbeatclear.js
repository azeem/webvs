/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/11/13
 * Time: 4:03 PM
 * To change this template use File | Settings | File Templates.
 */

function OnBeatClear(options) {
    options = options?options:{};
    this.n = options.n?options.n:1;
    this.color = options.color?options.color:[0,0,0];

    if(this.color.length != 3) {
        throw new Error("Invalid clear color, must be an array of 3");
    }
    for(var i = 0;i < this.color.length;i++) {
        this.color[i] = this.color[i]/255;
    }

    if(options.blend) {
        this.color[3] = 0.5;
    }
    this.prevBeat = false;
    this.beatCount = 0;

    var vertexSrc = [
        "attribute vec2 a_position;",
        "void main() {",
        "   gl_Position = vec4(a_position, 0, 1);",
        "}"
    ].join("\n");

    var fragmentSrc = [
        "precision mediump float;",
        "uniform vec4 u_color;",
        "void main() {",
        "   gl_FragColor = u_color;",
        "}"
    ].join("\n");


    OnBeatClear.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(OnBeatClear, ShaderComponent, {
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

        this.positionLocation = gl.getAttribLocation(this.program, "a_position");
        this.colorLocation = gl.getUniformLocation(this.program, "u_color");
    },

    update: function() {
        var gl = this.gl;

        var clear = false;
        if(this.analyser.beat && !this.prevBeat) {
            this.beatCount++;
            if(this.beatCount == this.n) {
                clear = true;
                this.beatCount = 0;
            }
        }
        this.prevBeat = this.analyser.beat;

        if(clear) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.SRC_ALPHA);
            gl.uniform4fv(this.colorLocation, this.color);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.enableVertexAttribArray(this.vertexPositionLocation);
            gl.vertexAttribPointer(this.vertexPositionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disable(gl.BLEND);
        }
    }
});

window.Webvs.OnBeatClear = OnBeatClear;