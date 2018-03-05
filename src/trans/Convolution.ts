import * as _ from "lodash";
import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import { glslFloatRepr, WebGLVarType } from "../utils";
import RenderingContext from "../webgl/RenderingContext";
import ShaderProgram from "../webgl/ShaderProgram";

enum EdgeModes {
    EXTEND = 0,
    WRAP,
}

export interface ConvolutionOpts {
    edgeMode: string;
    autoScale: boolean;
    scale: number;
    kernel: number[];
    bias: number;
}

// A component that applies a convolution kernel
export default class Convolution extends Component {
    public static componentName: string = "Convolution";
    public static componentTag: string = "trans";
    protected static optUpdateHandlers = {
        edgeMode: "updateProgram",
        kernel: ["updateProgram", "updateScale"],
        scale: "updateScale",
    };
    protected static defaultOptions: ConvolutionOpts = {
        edgeMode: "EXTEND",
        autoScale: true,
        scale: 0,
        kernel: [
            0, 0, 0,
            0, 1, 0,
            0, 0, 0,
        ],
        bias: 0,
    };

    protected opts: ConvolutionOpts;
    private program: ShaderProgram;
    private scale: number;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.updateProgram();
        this.updateScale();
    }

    public draw() {
        this.program.run(this.parent.fm, { scale: this.scale, bias: this.opts.bias });
    }

    public destroy() {
        super.destroy();
        this.program.destroy();
    }

    private updateScale() {
        const opts = this.opts;
        if (opts.autoScale) {
            this.scale = _.reduce(opts.kernel, function(memo, num) { return memo + num; }, 0);
        } else {
            this.scale = opts.scale;
        }
    }

    private updateProgram() {
        const opts = this.opts;
        if (!_.isArray(opts.kernel) || opts.kernel.length % 2 !== 1) {
            throw new Error("Invalid convolution kernel");
        }
        const kernelSize = Math.floor(Math.sqrt(opts.kernel.length));
        if (kernelSize * kernelSize != opts.kernel.length) {
            throw new Error("Invalid convolution kernel");
        }

        const edgeMode: EdgeModes = EdgeModes[this.opts.edgeMode];

        // generate edge correction function
        let edgeFunc = "";
        switch (edgeMode) {
            case EdgeModes.WRAP:
                edgeFunc = "pos = vec2(pos.x<0?pos.x+1.0:pos.x%1, pos.y<0?pos.y+1.0:pos.y%1);";
                break;
            case EdgeModes.EXTEND:
                edgeFunc = "pos = clamp(pos, vec2(0,0), vec2(1,1));";
                break;
        }

        // generate kernel multiplication code
        const colorSumEq = [];
        const mid = Math.floor(kernelSize / 2);
        for (let i = 0; i < kernelSize; i++) {
            for (let j = 0; j < kernelSize; j++) {
                const value = opts.kernel[(i * kernelSize + j)];
                if (value === 0) {
                    continue;
                }
                colorSumEq.push("pos = v_position + texel * vec2(" + (j - mid) + "," + (mid - i) + ");");
                colorSumEq.push(edgeFunc);
                colorSumEq.push("colorSum += texture2D(u_srcTexture, pos) * " + glslFloatRepr(value) + ";");
            }
        }

        const program = new ShaderProgram(this.main.rctx, {
            swapFrame: true,
            bindings: {
                uniforms: {
                    scale: { name: "u_scale", valueType: WebGLVarType._1F },
                    bias: { name: "u_bias", valueType: WebGLVarType._1F },
                },
            },
            fragmentShader: `
                uniform float u_scale;
                uniform float u_bias;
                void main() {
                   vec2 texel = 1.0/(u_resolution-vec2(1,1));
                   vec2 pos;
                   vec4 colorSum = vec4(0,0,0,0);
                   ${ colorSumEq.join("\n") }
                   setFragColor(vec4(((colorSum+u_bias)/u_scale).rgb, 1.0));
                }
            `,
        });

        if (this.program) {
            this.program.destroy();
        }
        this.program = program;
    }
}
