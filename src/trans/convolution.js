/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/11/13
 * Time: 2:02 AM
 * To change this template use File | Settings | File Templates.
 */

/**
 * Applies a 3x3 convolution kernel
 * @param kernel
 * @constructor
 */
function Convolution(kernelName) {
    var fragmentSrc = [
        "precision mediump float;",
        "uniform vec2 u_resolution;",
        "uniform sampler2D u_curRender;",
        "varying vec2 v_texCoord;",

        "uniform float u_kernel[9];",
        "uniform float u_kernelWeight;",
        "void main() {",
        "   vec2 onePixel = vec2(1.0, 1.0)/u_resolution;",
        "   vec4 colorSum = texture2D(u_curRender, v_texCoord + onePixel * vec2(-1, 1)) * u_kernel[0] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(0, -1)) * u_kernel[1] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(1, -1)) * u_kernel[2] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(-1, 0)) * u_kernel[3] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(0, 0))  * u_kernel[4] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(1, 0))  * u_kernel[5] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(-1, 1)) * u_kernel[6] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(0, 1))  * u_kernel[7] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(1, 1))  * u_kernel[8];",
        "   gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1.0);",
        "}"
    ].join("\n");

    if(kernelName in Convolution.kernels) {
        this.kernel = Convolution.kernels[kernelName];
    } else if(isArray(kernelName) && kernelName.length == 9) {
        this.kernel = kernelName;
    } else {
        throw new Error("Invalid convolution kernel");
    }


    var kernelWeight = 0;
    for(var i = 0;i < this.kernel.length;i++) {
        kernelWeight += this.kernel[i];
    }
    this.kernelWeight = kernelWeight;
    Convolution.super.constructor.call(this, fragmentSrc);
}
Convolution.kernels = {
    normal: [
        0, 0, 0,
        0, 1, 0,
        0, 0, 0
    ],
    gaussianBlur: [
        0.045, 0.122, 0.045,
        0.122, 0.332, 0.122,
        0.045, 0.122, 0.045
    ],
    unsharpen: [
        -1, -1, -1,
        -1,  9, -1,
        -1, -1, -1
    ],
    emboss: [
        -2, -1,  0,
        -1,  1,  1,
        0,  1,  2
    ],
    blur: [
        1, 1, 1,
        1, 1, 1,
        1, 1, 1
    ]
};
extend(Convolution, Trans, {
    init: function() {
        var gl = this.gl;

        this.kernelLocation = gl.getUniformLocation(this.program, "u_kernel[0]");
        this.kernelWeightLocation = gl.getUniformLocation(this.program, "u_kernelWeight");
        Convolution.super.init.call(this);
    },

    update: function(texture) {
        var gl = this.gl;

        gl.uniform1fv(this.kernelLocation, this.kernel);
        gl.uniform1f(this.kernelWeightLocation, this.kernelWeight);
        Convolution.super.update.call(this, texture);
    }

});

window.Webvs.Convolution = Convolution;