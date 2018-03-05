import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import { BlendModes, WebGLVarType } from "../utils";
import RenderingContext from "../webgl/RenderingContext";
import ShaderProgram from "../webgl/ShaderProgram";

export interface MosaicOpts {
    blendMode: string;
    squareSize: number;
    onBeatSizeChange: boolean;
    onBeatSquareSize: number;
    onBeatSizeDuration: number;
}

export default class Mosaic extends Component {
    public static componentName = "Mosaic";
    public static componentTag = "trans";
    protected static defaultOptions: MosaicOpts = {
        blendMode: "REPLACE",
        squareSize: 0.5,
        onBeatSizeChange: false,
        onBeatSquareSize: 1,
        onBeatSizeDuration: 10,
    };
    protected static optUpdateHandlers = {
        blendMode: "updateProgram",
    };

    protected opts: MosaicOpts;
    private frameCount: number;
    private size: number;
    private program: ShaderProgram;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.frameCount = 0;
        this.size = this.opts.squareSize;
        this.updateProgram();
    }

    public draw() {
        const gl = this.main.rctx.gl;
        if (this.opts.onBeatSizeChange && this.main.analyser.beat) {
            this.size = this.opts.onBeatSquareSize;
            this.frameCount = this.opts.onBeatSizeDuration;
        }

        if (this.size !== 0) {
            const sizeX = 1 / Math.floor(this.size * (gl.drawingBufferWidth - 1) + 1);
            const sizeY = 1 / Math.floor(this.size * (gl.drawingBufferHeight - 1) + 1);
            this.program.run(this.parent.fm, { size: [sizeX, sizeY] });
        }

        if (this.frameCount > 0) {
            this.frameCount--;
            if (this.frameCount === 0) {
                this.size = this.opts.squareSize;
            } else {
                const incr = Math.abs(this.opts.squareSize - this.opts.onBeatSquareSize) /
                           this.opts.onBeatSizeDuration;
                this.size += incr * (this.opts.onBeatSquareSize > this.opts.squareSize ? -1 : 1);
            }
        }
    }

    public destroy() {
        super.destroy();
        this.program.destroy();
    }

    private updateProgram() {
        const blendMode: BlendModes = BlendModes[this.opts.blendMode];
        const program = new ShaderProgram(this.main.rctx, {
            swapFrame: true,
            blendMode,
            bindings: {
                uniforms: {
                    size: { name: "u_size", valueType: WebGLVarType._2FV },
                },
            },
            fragmentShader: `
                uniform vec2 u_size;
                void main() {
                    vec2 samplePos = u_size * ( floor(v_position/u_size) + vec2(0.5,0.5) );
                    setFragColor(getSrcColorAtPos(samplePos));
                }
            `,
        });
        if (this.program) {
            this.program.destroy();
        }
        this.program = program;
    }
}
