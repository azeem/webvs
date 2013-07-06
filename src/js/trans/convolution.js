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
    options = _.defaults(options, {
        edgeMode: "EXTEND"
    });

    var kernel;
    if(options.kernel in Convolution.kernels) {
        kernel = Convolution.kernels[options.kernel];
    } else if(isArray(options.kernel) && options.kernel.length%2 === 1) {
        kernel = options.kernel;
    } else {
        throw new Error("Invalid convolution kernel");
    }

    var kernelSize = Math.floor(Math.sqrt(kernel.length));
    if(kernelSize*kernelSize != kernel.length) {
        throw new Error("Invalid convolution kernel");
    }

    // generate edge correction function
    var edgeFunc = "";
    switch(options.edgeMode) {
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
            colorSumEq.push("pos = v_position + onePixel * vec2("+(i-mid)+","+(j-mid)+");");
            colorSumEq.push(edgeFunc);
            colorSumEq.push("colorSum += texture2D(u_srcTexture, pos) * "+glslFloatRepr(kernel[(i*kernelSize+j)])+";");
        }
    }

    // compute kernel weight
    var kernelWeight = 0;
    for(i = 0;i < kernel.length;i++) {
        kernelWeight += kernel[i];
    }

    var fragmentSrc = [
        "void main() {",
        "   vec2 onePixel = vec2(1.0, 1.0)/u_resolution;",
        "   vec2 pos;",
        "   vec4 colorSum = vec4(0,0,0,0);",
        colorSumEq.join("\n"),
        "   setFragColor(vec4((colorSum / "+glslFloatRepr(kernelWeight)+").rgb, 1.0));",
        "}"
    ].join("\n");

    Convolution.super.constructor.call(this, fragmentSrc);
}
extend(Convolution, QuadBoxComponent, {
    componentName: "Convolution",
    swapFrame: true
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
