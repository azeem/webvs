/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

/**
 * Applies a 3x3 convolution kernel
 * @param kernel
 * @constructor
 */
function Convolution(options) {
    checkRequiredOptions(options, ["kernel"]);
    var fragmentSrc = [
        "uniform float u_kernel[9];",
        "uniform float u_kernelWeight;",
        "void main() {",
        "   vec2 onePixel = vec2(1.0, 1.0)/u_resolution;",
        "   vec4 colorSum = getSrcColorAtPos(v_position + onePixel * vec2(-1, 1)) * u_kernel[0] + ",
        "                   getSrcColorAtPos(v_position + onePixel * vec2(0, -1)) * u_kernel[1] + ",
        "                   getSrcColorAtPos(v_position + onePixel * vec2(1, -1)) * u_kernel[2] + ",
        "                   getSrcColorAtPos(v_position + onePixel * vec2(-1, 0)) * u_kernel[3] + ",
        "                   getSrcColorAtPos(v_position + onePixel * vec2(0, 0))  * u_kernel[4] + ",
        "                   getSrcColorAtPos(v_position + onePixel * vec2(1, 0))  * u_kernel[5] + ",
        "                   getSrcColorAtPos(v_position + onePixel * vec2(-1, 1)) * u_kernel[6] + ",
        "                   getSrcColorAtPos(v_position + onePixel * vec2(0, 1))  * u_kernel[7] + ",
        "                   getSrcColorAtPos(v_position + onePixel * vec2(1, 1))  * u_kernel[8];",
        "   setFragColor(vec4((colorSum / u_kernelWeight).rgb, 1.0));",
        "}"
    ].join("\n");

    if(options.kernel in Convolution.kernels) {
        this.kernel = Convolution.kernels[options.kernel];
    } else if(isArray(options.kernel) && options.kernel.length == 9) {
        this.kernel = options.kernel;
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
extend(Convolution, Trans, {
    componentName: "Convolution",

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

window.Webvs.Convolution = Convolution;
