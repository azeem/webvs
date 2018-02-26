import * as _ from 'lodash';
import IMain from "../IMain";
import Component, { IContainer } from "../Component";
import QuadBoxProgram from "../webgl/QuadBoxProgram";
import RenderingContext from "../webgl/RenderingContext";
import { WebGLVarType } from "../utils";

export interface ChannelShiftOpts {
    channel: string,
    onBeatRandom: boolean
}

enum ShiftChannels {
    RGB = 0,
    RBG,
    BRG,
    BGR,
    GBR,
    GRB
};
const ShiftChannelsKeys = Object.keys(ShiftChannels).filter(s => typeof s === "string");

// A component that swizzles the color component
export default class ChannelShift extends Component {
    public static componentName: string = "ChannelShift";
    public static componentTag: string = "trans";
    protected static optUpdateHandlers = {
        channel: "updateChannel"
    };
    protected static defaultOptions: ChannelShiftOpts = {
        channel: "RGB",
        onBeatRandom: false
    };

    protected opts: ChannelShiftOpts;
    private program: ChannelShiftProgram;
    private channel: ShiftChannels;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.program = new ChannelShiftProgram(this.main.rctx);
        this.updateChannel();
    }

    draw() {
        if(this.opts.onBeatRandom && this.main.analyser.beat) {
            this.channel = Math.floor(Math.random() * ShiftChannelsKeys.length);
        }
        this.program.run(this.parent.fm, null, this.channel);
    }

    destroy() {
        super.destroy();
        this.program.destroy();
    }

    private updateChannel() {
        this.channel = ShiftChannels[this.opts.channel];
    }
}

class ChannelShiftProgram extends QuadBoxProgram {
    constructor(rctx: RenderingContext) {
        super(rctx, {
            swapFrame: true,
            fragmentShader: [
                "uniform int u_channel;",
                "void main() {",
                "   vec3 color = getSrcColor().rgb;",

                _.flatMap(ShiftChannelsKeys, (channel) => {
                    return [
                        "if(u_channel == "+ShiftChannels[channel]+") {",
                        "   setFragColor(vec4(color." + channel.toLowerCase() + ",1));",
                        "}"
                    ];
                }).join("\n"),
            "}"
            ]
        });
    }

    draw(channel) {
        this.setUniform("u_channel", WebGLVarType._1I, channel);
        super.draw();
    }
}