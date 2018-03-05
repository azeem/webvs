import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import { BlendModes, parseColorNorm, WebGLVarType } from "../utils";
import RenderingContext from "../webgl/RenderingContext";
import ShaderProgram from "../webgl/ShaderProgram";

export interface UniqueToneOpts {
    color: string;
    invert: boolean;
    blendMode: string;
}

// A Component that applies a unique color tone
export default class UniqueTone extends Component {
    public static componentName = "UniqueTone";
    public static componentTag = "trans";
    protected static defaultOptions: UniqueToneOpts = {
        color: "#ffffff",
        invert: false,
        blendMode: "REPLACE",
    };
    protected static optUpdateHandlers = {
        color: "updateColor",
        blendMode: "updateProgram",
    };

    protected opts: UniqueToneOpts;
    private program: ShaderProgram;
    private tone: [number, number, number];

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.updateColor();
        this.updateProgram();
    }

    public draw() {
        this.program.run(this.parent.fm, {
            tone: this.tone,
            invert: this.opts.invert ? 1 : 0,
        });
    }

    public destroy() {
        super.destroy();
        this.program.destroy();
    }

    private updateColor() {
        this.tone = parseColorNorm(this.opts.color);
    }

    private updateProgram() {
        const blendMode: BlendModes = BlendModes[this.opts.blendMode];
        const program = new ShaderProgram(this.main.rctx, {
            blendMode,
            swapFrame: true,
            bindings: {
                uniforms: {
                    tone: { name: "u_tone", valueType: WebGLVarType._3FV },
                    invert: { name: "u_invert", valueType: WebGLVarType._1F },
                },
            },
            fragmentShader: `
                uniform vec3 u_tone;
                uniform bool u_invert;
                void main() {
                   vec4 srcColor = getSrcColor();
                   float depth = max(srcColor.r, max(srcColor.g, srcColor.b));
                   if(u_invert) {
                       depth = 1.0-depth;
                   }
                   setFragColor(vec4(depth*u_tone, 1));
                }
            `,
        });
        if (this.program) {
            this.program.destroy();
        }
        this.program = program;
    }
}
