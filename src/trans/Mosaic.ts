import Component, { IContainer } from '../Component';
import IMain from '../IMain';
import QuadBoxProgram from '../webgl/QuadBoxProgram';
import RenderingContext from '../webgl/RenderingContext';
import { BlendModes, WebGLVarType } from '../utils';

interface MosaicOpts {
    blendMode: string,
    squareSize: number,
    onBeatSizeChange: boolean,
    onBeatSquareSize: number,
    onBeatSizeDuration: number
}

export default class Mosaic extends Component {
    static componentName = "Mosaic";
    static componentTag = "trans";
    protected static defaultOptions: MosaicOpts = {
        blendMode: "REPLACE",
        squareSize: 0.5,
        onBeatSizeChange: false,
        onBeatSquareSize: 1,
        onBeatSizeDuration: 10
    }
    protected static optUpdateHandlers = {
        blendMode: "updateProgram"
    }

    protected opts: MosaicOpts;
    private frameCount: number;
    private size: number;
    private program: MosaicProgram;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.frameCount = 0;
        this.size = this.opts.squareSize;
        this.updateProgram();
    }

    draw() {
        const gl = this.main.rctx.gl;
        if(this.opts.onBeatSizeChange && this.main.analyser.beat) {
            this.size = this.opts.onBeatSquareSize;
            this.frameCount = this.opts.onBeatSizeDuration;
        }

        if(this.size !== 0) {
            const sizeX = 1/Math.floor(this.size*(gl.drawingBufferWidth-1)+1);
            const sizeY = 1/Math.floor(this.size*(gl.drawingBufferHeight-1)+1);
            this.program.run(this.parent.fm, null, sizeX, sizeY);
        }

        if(this.frameCount > 0) {
            this.frameCount--;
            if(this.frameCount === 0) {
                this.size = this.opts.squareSize;
            } else {
                const incr = Math.abs(this.opts.squareSize-this.opts.onBeatSquareSize)/
                           this.opts.onBeatSizeDuration;
                this.size += incr * (this.opts.onBeatSquareSize>this.opts.squareSize?-1:1);
            }
        }
    }

    destroy() {
        super.destroy();
        this.program.destroy();
    }

    private updateProgram() {
        const blendMode: BlendModes = BlendModes[this.opts.blendMode];
        const program = new MosaicProgram(this.main.rctx, blendMode);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    }
}

class MosaicProgram extends QuadBoxProgram {
    constructor(rctx: RenderingContext, blendMode: BlendModes) {
        super(rctx, {
            swapFrame: true,
            blendMode: blendMode,
            fragmentShader: [
                "uniform vec2 u_size;",
                "void main() {",
                "    vec2 samplePos = u_size * ( floor(v_position/u_size) + vec2(0.5,0.5) );",
                "    setFragColor(getSrcColorAtPos(samplePos));",
                "}"
            ]
        });
    }

    draw(sizeX: number, sizeY: number) {
        this.setUniform("u_size", WebGLVarType._2F, sizeX, sizeY);
        super.draw();
    }
}