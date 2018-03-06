import * as _ from "lodash";
import Component, {IContainer} from "../Component";
import IMain from "../IMain";
import {BlendModes, Color, parseColorNorm} from "../utils";
import ClearScreenProgram from "../webgl/ClearScreenProgram";
import ShaderProgram from "../webgl/ShaderProgram";

export interface IClearScreenOpts {
    beatCount: number;
    color: string;
    blendMode: string;
}

// A component that clears the screen
export default class ClearScreen extends Component {
    public static componentName = "ClearScreen";
    public static componentTag = "render";
    protected static defaultOptions: IClearScreenOpts = {
        beatCount: 0,
        blendMode: "REPLACE",
        color: "#000000",
    };
    protected static optUpdateHandlers = {
        blendMode: "updateProgram",
        color: "updateColor",
    };
    protected opts: IClearScreenOpts;

    private prevBeat: boolean;
    private beatCount: number;
    private program: ClearScreenProgram;
    private color: Color;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.prevBeat = false;
        this.beatCount = 0;

        this.updateColor();
        this.updateProgram();
    }

    public draw() {
        let clear = false;
        if (this.opts.beatCount === 0) {
            clear = true;
        } else {
            if (this.main.analyser.beat && !this.prevBeat) {
                this.beatCount++;
                if (this.beatCount >= this.opts.beatCount) {
                    clear = true;
                    this.beatCount = 0;
                }
            }
            this.prevBeat = this.main.analyser.beat;
        }

        if (clear) {
            this.program.run(this.parent.fm, {color: this.color});
        }
    }

    public destroy() {
        super.destroy();
        this.program.destroy();
    }

    public updateColor() {
        this.color = parseColorNorm(this.opts.color);
    }

    public updateProgram() {
        const blendMode = BlendModes[this.opts.blendMode];
        const program = new ClearScreenProgram(this.main.rctx, blendMode);
        if (this.program) {
            this.program.destroy();
        }
        this.program = program;
    }
}
