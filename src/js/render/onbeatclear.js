/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

/**
 * OnBeatClear - clears the screen on beat
 * @param options
 * @constructor
 */
function OnBeatClear(options) {
    options = _.defaults(options, {
        n: 1,
        color: "#FFFFFF"
    });
    this.n = options.n;
    this.color = parseColorNorm(options.color);

    if(options.blend) {
        this.outputBlendMode = blendModes.AVERAGE;
    }

    this.prevBeat = false;
    this.beatCount = 0;

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

    OnBeatClear.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(OnBeatClear, ShaderComponent, {
    componentName: "OnBeatClear",

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
            gl.uniform3fv(this.colorLocation, this.color);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.enableVertexAttribArray(this.positionLocation);
            gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    },

    destroyComponent: function() {
        OnBeatClear.super.destroyComponent.call(this);
        this.gl.deleteBuffer(this.vertexBuffer);
    }
});
OnBeatClear.ui = {
    type: "OnBeatClear",
    disp: "On Beat Clear",
    schema: {
        n: {
            type: "number",
            title: "Beat Count",
            default: 1
        },
        color: {
            type: "string",
            title: "Clear color",
            format: "color",
            default: "#FFFFFF"
        }
    }
};

window.Webvs.OnBeatClear = OnBeatClear;
