import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import QuadBoxProgram from "../webgl/QuadBoxProgram";
import RenderingContext from "../webgl/RenderingContext";
import { BlendModes, WebGLVarType, parseColorNorm } from "../utils";

interface UniqueToneOpts {
    color: string,
    invert: boolean,
    blendMode: string 
}

// A Component that applies a unique color tone
export default class UniqueTone extends Component {
    static componentName = "UniqueTone";
    static componentTag = "trans";
    protected static defaultOptions: UniqueToneOpts = {
        color: "#ffffff",
        invert: false,
        blendMode: "REPLACE"
    }
    protected static optUpdateHandlers = {
        color: "updateColor",
        blendMode: "updateProgram"
    }

    protected opts: UniqueToneOpts;
    private program: UniqueToneProgram;
    private tone: [number, number, number];

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.updateColor();
        this.updateProgram();
    }

    draw() {
        this.program.run(this.parent.fm, null, this.tone, this.opts.invert);
    }

    destroy() {
        super.destroy();
        this.program.destroy();
    }

    private updateColor() {
        this.tone = parseColorNorm(this.opts.color);
    }

    private updateProgram() {
        const blendMode: BlendModes = BlendModes[this.opts.blendMode];
        const program = new UniqueToneProgram(this.main.rctx, blendMode);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    }
}

class UniqueToneProgram extends QuadBoxProgram {
    constructor(rctx: RenderingContext, blendMode: BlendModes) {
        super(rctx, {
            blendMode: blendMode,
            swapFrame: true,
            fragmentShader: [
                "uniform vec3 u_tone;",
                "uniform bool u_invert;",
                "void main() {",
                "   vec4 srcColor = getSrcColor();",
                "   float depth = max(srcColor.r, max(srcColor.g, srcColor.b));",
                "   if(u_invert) {",
                "       depth = 1.0-depth;",
                "   }",
                "   setFragColor(vec4(depth*u_tone, 1));",
                "}"
            ]
        });
    }

    draw(tone: [number, number, number], invert: boolean) {
        this.setUniform("u_tone", WebGLVarType._3FV, tone);
        this.setUniform("u_invert", WebGLVarType._1F, invert?1:0);
        super.draw();
    }
}