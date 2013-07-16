/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

function FadeOut(options) {
    options = _.defaults(options, {
        speed: 1,
        color: "#FFFFFF"
    });
    this.speed = options.speed;
    this.color = parseColorNorm(options.color);

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

    FadeOut.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(FadeOut, ShaderComponent, {
    componentName: "FadeOut",
    outputBlendMode: blendModes.AVERAGE,

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
FadeOut.ui = {
    type: "FadeOut",
    disp: "Fade Out",
    schema: {
        speed: {
            type: "number",
            title: "Speed",
            maximum: 0,
            minimum: 1,
            default: 1
        },
        color: {
            type: "string",
            title: "Fadeout color",
            format: "color",
            default: "#FFFFFF"
        }
    },
    form: [
        {key: "speed", type: "range", step: "0.05"},
        "color"
    ]
};

window.Webvs.FadeOut = FadeOut;
