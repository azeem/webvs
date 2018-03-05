import IMain from "../IMain";
import Component, { IContainer } from "../Component";
import { BlendModes, Color, parseColorNorm } from "../utils";
import ClearScreenProgram from "../webgl/ClearScreenProgram";

export interface FadeOutOpts {
    speed: number,
    color: string
}

// A component that slowly fades the screen to a specified color
export default class FadeOut extends Component {
    public static componentName: string = "FadeOut";
    public static componentTag: string = "trans";
    protected static optUpdateHandlers = {
        speed: "updateSpeed",
        color: "updateColor"
    };
    protected static defaultOptions: FadeOutOpts = {
        speed: 1,
        color: "#000000"
    };

    protected opts: FadeOutOpts;
    private program: ClearScreenProgram;
    private frameCount: number;
    private maxFrameCount: number;
    private color: Color;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.program = new ClearScreenProgram(this.main.rctx, BlendModes.AVERAGE);
        this.updateSpeed();
        this.updateColor();
    }

    draw() {
        this.frameCount++;
        if(this.frameCount == this.maxFrameCount) {
            this.frameCount = 0;
            this.program.run(this.parent.fm, { color: this.color });
        }
    }

    destroy() {
        super.destroy();
        this.program.destroy();
    }

    private updateSpeed() {
        this.frameCount = 0;
        this.maxFrameCount = Math.floor(1/this.opts.speed);
    }

    private updateColor() {
        this.color = parseColorNorm(this.opts.color);
    }
}