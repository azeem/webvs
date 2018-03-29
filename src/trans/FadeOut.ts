import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import { BlendMode, Color, parseColorNorm } from "../utils";
import ClearScreenProgram from "../webgl/ClearScreenProgram";

export interface IFadeOutOpts {
    speed: number;
    color: string;
}

// A component that slowly fades the screen to a specified color
export default class FadeOut extends Component {
    public static componentName: string = "FadeOut";
    public static componentTag: string = "trans";
    protected static optUpdateHandlers = {
        color: "updateColor",
        speed: "updateSpeed",
    };
    protected static defaultOptions: IFadeOutOpts = {
        color: "#000000",
        speed: 1,
    };

    protected opts: IFadeOutOpts;
    private program: ClearScreenProgram;
    private frameCount: number;
    private maxFrameCount: number;
    private color: Color;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.program = new ClearScreenProgram(this.main.getRctx(), BlendMode.AVERAGE);
        this.updateSpeed();
        this.updateColor();
    }

    public draw() {
        this.frameCount++;
        if (this.frameCount === this.maxFrameCount) {
            this.frameCount = 0;
            this.program.run(this.parent.getTSM(), { color: this.color });
        }
    }

    public destroy() {
        super.destroy();
        this.program.destroy();
    }

    private updateSpeed() {
        this.frameCount = 0;
        this.maxFrameCount = Math.floor(1 / this.opts.speed);
    }

    private updateColor() {
        this.color = parseColorNorm(this.opts.color);
    }
}
