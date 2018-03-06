import Component from "./Component";
import Container from "./Container";
import CodeInstance from "./expr/CodeInstance";
import compileExpr from "./expr/compileExpr";
import IMain from "./IMain";
import { BlendModes } from "./utils";
import FrameBufferManager from "./webgl/FrameBufferManager";

export enum ELBlendModes {
    REPLACE = 1,
    MAXIMUM,
    AVERAGE,
    ADDITIVE,
    SUBTRACTIVE1,
    SUBTRACTIVE2,
    MULTIPLY,
    MULTIPLY2,
    ADJUSTABLE,
    ALPHA,
    IGNORE,
}

export interface IEffectListOpts {
    code: {
        init: string,
        perFrame: string,
    };
    output: string;
    input: string;
    clearFrame: boolean;
    enableOnBeat: boolean;
    enableOnBeatFor: number;
}

interface IELCodeInstance extends CodeInstance {
    beat: number;
    enabled: number;
    clear: number;
    init: () => void;
    perFrame: () => void;
}

// Effectlist is a container that renders components to a separate buffer. and blends
// it in with the parent buffer. Its also used as the root component in Webvs.Main
export default class EffectList extends Container {
    public static componentName = "EffectList";
    public static componentTag = "";
    protected static defaultOptions: IEffectListOpts = {
        clearFrame: false,
        code: {
            init: "",
            perFrame: "",
        },
        enableOnBeat: false,
        enableOnBeatFor: 1,
        input: "IGNORE",
        output: "REPLACE",
    };
    protected static optUpdateHandlers = {
        code: "updateCode",
        input: "updateBlendMode",
        output: "updateBlendMode",
    };

    protected opts: IEffectListOpts;
    private frameCounter: number;
    private first: boolean;
    private inited: boolean = false;
    private code: IELCodeInstance;
    private input: ELBlendModes;
    private output: ELBlendModes;

    constructor(main: IMain, parent: Container, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        super.init();
        this.fm = new FrameBufferManager(this.main.rctx, this.main.copier, this.parent ? true : false);
        this.updateCode();
        this.updateBlendMode(this.opts.input, "input");
        this.updateBlendMode(this.opts.output, "output");
        this.frameCounter = 0;
        this.first = true;
        this.listenTo(this.main, "resize", this.handleResize);
    }

    public draw() {
        const opts = this.opts;

        if (opts.enableOnBeat) {
            if (this.main.analyser.beat) {
                this.frameCounter = opts.enableOnBeatFor;
            } else if (this.frameCounter > 0) {
                this.frameCounter--;
            }

            // only enable for enableOnBeatFor # of frames
            if (this.frameCounter === 0) {
                return;
            }
        }

        this.code.beat = this.main.analyser.beat ? 1 : 0;
        this.code.enabled = 1;
        this.code.clear = opts.clearFrame ? 1 : 0;
        if (!this.inited) {
            this.inited = true;
            this.code.init();
        }
        this.code.perFrame();
        if (this.code.enabled === 0) {
            return;
        }

        // set rendertarget to internal framebuffer
        this.fm.setRenderTarget();

        // clear frame
        if (opts.clearFrame || this.first || this.code.clear) {
            const gl = this.main.rctx.gl;
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            this.first = false;
        }

        // blend input texture onto internal texture
        if (this.input !== ELBlendModes.IGNORE) {
            const inputTexture = this.parent.fm.getCurrentTexture();
            this.main.copier.run(this.fm, { srcTexture: inputTexture }, this.input as number);
        }

        // render all the components
        // for (let i = 0; i < this.components.length; i++) {
        for (const component of this.components) {
            if (component.enabled) {
                component.draw();
            }
        }

        // switch to old framebuffer
        this.fm.restoreRenderTarget();

        // blend current texture to the output framebuffer
        if (this.output !== ELBlendModes.IGNORE) {
            if (this.parent) {
                this.main.copier.run(
                    this.parent.fm,
                    { srcTexture: this.fm.getCurrentTexture() },
                    this.output as number,
                );
            } else {
                this.main.copier.run(null, { srcTexture: this.fm.getCurrentTexture() });
            }
        }
    }

    public destroy() {
        super.destroy();
        if (this.fm) {
            // destroy the framebuffer manager
            this.fm.destroy();
        }
    }

    private updateCode() {
        this.code = compileExpr(this.opts.code, ["init", "perFrame"]).codeInst as IELCodeInstance;
        this.code.setup(this.main);
        this.inited = false;
    }

    private updateBlendMode(value: string, name: "input" | "output") {
        if (name === "input") {
            this.input = ELBlendModes[value];
        } else {
            this.output = ELBlendModes[value];
        }
    }

    private handleResize() {
        this.fm.resize();
        this.code.updateDimVars(this.main.rctx.gl);
    }
}
