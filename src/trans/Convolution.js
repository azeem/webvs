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
function Convolution(gl, main, parent, opts) {
    Convolution.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.Convolution = Webvs.defineClass(Convolution, Webvs.Component, {
    componentName: "Convolution",

    defaultOptions: {
        edgeMode: "EXTEND",
        scale: undefined,
        kernel: [
            0, 0, 0,
            0, 1, 0,
            0, 0, 0
        ],
        bias: 0
    },

    onChange: {
        "edgeMode": "updateProgram",
        "kernel": "updateProgram",
        "scale": "updateScale"
    },

    init: function() {
        this.updateProgram();
        this.updateScale();
    },

    draw: function() {
        this.program.run(this.parent.fm, null, this.scale, this.opts.bias);
    },

    destroy: function() {
        this.program.cleanup();
    },

    updateScale: function() {
        var opts = this.opts;
        if(_.isUndefined(opts.scale)) {
            this.scale = _.reduce(opts.kernel, function(memo, num){ return memo + num; }, 0);
        } else {
            this.scale = opts.scale;
        }
    },

    updateProgram: function() {
        var opts = this.opts;
        if(!_.isArray(opts.kernel) || opts.kernel.length%2 !== 1) {
            throw new Error("Invalid convolution kernel");
        }
        var kernelSize = Math.floor(Math.sqrt(opts.kernel.length));
        if(kernelSize*kernelSize != opts.kernel.length) {
            throw new Error("Invalid convolution kernel");
        }

        if(this.program) {
            this.program.cleanup();
        }
        this.program = new Webvs.ConvolutionProgram(opts.kernel, kernelSize, opts.edgeMode);
        this.program.init(this.gl);
    }
});

function ConvolutionProgram(kernel, kernelSize, edgeMode) {
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
            colorSumEq.push("pos = v_position + texel * vec2("+(j-mid)+","+(mid-i)+");");
            colorSumEq.push(edgeFunc);
            colorSumEq.push("colorSum += texture2D(u_srcTexture, pos) * "+Webvs.glslFloatRepr(value)+";");
        }
    }

    ConvolutionProgram.super.constructor.call(this, {
        swapFrame: true,
        fragmentShader: [
            "uniform float u_scale;",
            "uniform float u_bias;",
            "void main() {",
            "   vec2 texel = 1.0/(u_resolution-vec2(1,1));",
            "   vec2 pos;",
            "   vec4 colorSum = vec4(0,0,0,0);",
            colorSumEq.join("\n"),
            "   setFragColor(vec4(((colorSum+u_bias)/u_scale).rgb, 1.0));",
            "}"
        ]
    });
}
Webvs.ConvolutionProgram = Webvs.defineClass(ConvolutionProgram, Webvs.QuadBoxProgram, {
    draw: function(scale, bias) {
        this.setUniform("u_scale", "1f", scale);
        this.setUniform("u_bias", "1f", bias);
        ConvolutionProgram.super.draw.call(this);
    }
});

})(Webvs);
