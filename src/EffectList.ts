import Component from "./Component";
import Container from "./Container";
import CodeInstance from "./expr/CodeInstance";
import compileExpr from "./expr/compileExpr";
import IMain from "./IMain";
import { BlendMode } from "./utils";
import TextureSetManager from "./webgl/TextureSetManager";

/**
 * BlendModes supported by Effectlist
 */
export enum ELBlendMode {
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

/**
 * Options for EffectList
 */
export interface IEffectListOpts {
    /**
     * EEL code to control the effectlist.
     *
     * Following varaibles are available:
     *
     * + `beat`: 0 or 1 to indicate a beat for the current frame
     * + `enabled`: set this to 0 or 1 to disable or enable the effectlist
     * + `clear`: set this to 0 or 1 to clear the frame
     */
    code: {
        /**
         * EEL that will be run on init
         */
        init: string,
        /**
         * EEL that will be run per frame
         */
        perFrame: string,
    };
    /**
     * The output blend mode. Default: "REPLACE"
     */
    output: string;
    /**
     * The input blend mode. Default: "IGNORE"
     */
    input: string;
    /**
     * Enable clearing each frame. Default: false
     */
    clearFrame: boolean;
    /**
     * If set, the this effectlist is enabled only on a beat. Default: false
     */
    enableOnBeat: boolean;
    /**
     * When enableOnBeat, this determines the number of beats
     * counted before the Effectlist is enabled. Default: 1
     */
    enableOnBeatFor: number;
}

interface IELCodeInstance extends CodeInstance {
    beat: number;
    enabled: number;
    clear: number;
    init: () => void;
    perFrame: () => void;
}

/**
 * Effectlist is a container that renders components to a separate buffer. And blends
 * it in with the parent buffer.
 *
 * An implicit Effeclist is also created by [[Main]] as a root component.
 */
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
    private input: ELBlendMode;
    private output: ELBlendMode;

    constructor(main: IMain, parent: Container, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        super.init();
        const tsm = new TextureSetManager(
            this.main.getRctx(), this.main.getCopier(), this.parent ? false : true);
        this.setTSM(tsm);
        this.updateCode();
        this.updateBlendMode(this.opts.input, "input");
        this.updateBlendMode(this.opts.output, "output");
        this.frameCounter = 0;
        this.first = true;
        this.listenTo(this.main, "resize", () => this.handleResize());
    }

    public draw() {
        const opts = this.opts;

        if (opts.enableOnBeat) {
            if (this.main.getAnalyser().isBeat()) {
                this.frameCounter = opts.enableOnBeatFor;
            } else if (this.frameCounter > 0) {
                this.frameCounter--;
            }

            // only enable for enableOnBeatFor # of frames
            if (this.frameCounter === 0) {
                return;
            }
        }

        this.code.beat = this.main.getAnalyser().isBeat() ? 1 : 0;
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
        this.getTSM().setAsRenderTarget();

        // clear frame
        if (opts.clearFrame || this.first || this.code.clear) {
            const gl = this.main.getRctx().getGl();
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            this.first = false;
        }

        // blend input texture onto internal texture
        if (this.input !== ELBlendMode.IGNORE) {
            const inputTexture = this.parent.getTSM().getCurrentTexture();
            this.main.getCopier().run(this.getTSM(), { srcTexture: inputTexture }, this.input as number);
        }

        // render all the components
        // for (let i = 0; i < this.components.length; i++) {
        for (const component of this.components) {
            if (component.isEnabled()) {
                component.draw();
            }
        }

        // switch to old framebuffer
        this.getTSM().unsetAsRenderTarget();

        // blend current texture to the output framebuffer
        if (this.output !== ELBlendMode.IGNORE) {
            if (this.parent) {
                this.main.getCopier().run(
                    this.parent.getTSM(),
                    { srcTexture: this.getTSM().getCurrentTexture() },
                    this.output as number,
                );
            } else {
                this.main.getCopier().run(null, { srcTexture: this.getTSM().getCurrentTexture() });
            }
        }
    }

    public destroy() {
        super.destroy();
        if (this.getTSM()) {
            // destroy the framebuffer manager
            this.getTSM().destroy();
        }
    }

    private updateCode() {
        this.code = compileExpr(this.opts.code, ["init", "perFrame"]).codeInst as IELCodeInstance;
        this.code.setup(this.main);
        this.inited = false;
    }

    private updateBlendMode(value: string, name: "input" | "output") {
        if (name === "input") {
            this.input = ELBlendMode[value];
        } else {
            this.output = ELBlendMode[value];
        }
    }

    private handleResize() {
        this.getTSM().resize();
        this.code.updateDimVars(this.main.getRctx().getGl());
    }
}
