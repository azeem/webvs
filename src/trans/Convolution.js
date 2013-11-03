/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that applies a convolution kernel
 *
 * @param {object} options - options object
 * @param {Array.<Array.<number>>} options.kernel - an NxN array of numbers
 * @param {number} [options.bias=0] - bias value to be added
 * @param {number} [options.scale] - scale for the kernel. default is sum of kernel values
 * @param {object} [options.edgeMode="EXTEND"] - how the frame edge cases should be handled viz. `WRAP`, `EXTEND`
 *
 * @constructor
 * @augments Webvs.Component
 * @memberof Webvs
 */
function Convolution(options) {
    Webvs.checkRequiredOptions(options, ["kernel"]);
    options = _.defaults(options, {
        edgeMode: "EXTEND",
        bias: 0
    });

    var kernel;
    if(options.kernel in Convolution.kernels) {
        kernel = Convolution.kernels[options.kernel];
    } else if(_.isArray(options.kernel) && options.kernel.length%2 === 1) {
        kernel = options.kernel;
    } else {
        throw new Error("Invalid convolution kernel");
    }

    var kernelSize = Math.floor(Math.sqrt(kernel.length));
    if(kernelSize*kernelSize != kernel.length) {
        throw new Error("Invalid convolution kernel");
    }

    this.program = new Webvs.ConvolutionProgram(kernel, kernelSize, 
                                                options.edgeMode, options.scale,
                                                options.bias);

    Convolution.super.constructor.apply(this, arguments);
}
Webvs.Convolution = Webvs.defineClass(Convolution, Webvs.Component, {
    componentName: "Convolution",

    /**
     * initializes the Convolution component
     * @method
     * @memberof Webvs.Convolution
     */
    init: function(gl, main, parent) {
        Convolution.super.init.call(this, gl, main, parent);
        this.program.init(gl);
    },

    /**
     * applies the Convolution matrix
     * @method
     * @memberof Webvs.Convolution
     */
    update: function() {
        this.program.run(this.parent.fm, null);
    },

    /**
     * releases resources
     * @memberof Webvs.Convolution
     */
    destroy: function() {
        Convolution.super.destroy.call(this);
        this.program.cleanup();
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

function ConvolutionProgram(kernel, kernelSize, edgeMode, scale, bias) {
    // generate edge correction function
    var edgeFunc = "";
    switch(edgeMode) {
        case "WRAP":
            edgeFunc = "pos = vec2(pos.x<0?pos.x+1.0:pos.x%1, pos.y<0?pos.y+1.0:pos.y%1);";
            break;
        case "EXTEND":
            edgeFunc = "pos = clamp(pos, vec2(0,0), vec2(1,1));";
            break;
        default:
            throw new Error("Invalid edge mode");
    }

    var i,j;

    // generate kernel multiplication code
    var colorSumEq = [];
    var mid = Math.floor(kernelSize/2);
    for(i = 0;i < kernelSize;i++) {
        for(j = 0;j < kernelSize;j++) {
            var value = kernel[(i*kernelSize+j)];
            if(value === 0) {
                continue;
            }
            colorSumEq.push("pos = corn + texel * vec2("+(i-mid)+","+(j-mid)+");");
            colorSumEq.push(edgeFunc);
            colorSumEq.push("colorSum += texture2D(u_srcTexture, pos) * "+Webvs.glslFloatRepr(value)+";");
        }
    }

    // compute kernel scaling factor
    if(_.isUndefined(scale)) {
        scale = _.reduce(kernel, function(memo, num){ return memo + num; }, 0);
    }

    ConvolutionProgram.super.constructor.call(this, {
        swapFrame: true,
        fragmentShader: [
            "void main() {",
            "   vec2 texel = 1.0/(u_resolution-vec2(1,1));",
            "   vec2 corn = floor(v_position/texel)*texel;",
            "   vec2 pos;",
            "   vec4 colorSum = vec4(0,0,0,0);",
            colorSumEq.join("\n"),
            "   setFragColor(vec4(((colorSum+"+Webvs.glslFloatRepr(bias)+") / "+Webvs.glslFloatRepr(scale)+").rgb, 1.0));",
            "}"
        ]
    });
}
Webvs.ConvolutionProgram = Webvs.defineClass(ConvolutionProgram, Webvs.QuadBoxProgram);

})(Webvs);
