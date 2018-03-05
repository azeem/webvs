import * as _ from 'lodash';
import IMain from "../IMain";
import Component, { IContainer } from "../Component";
import RenderingContext from "../webgl/RenderingContext";
import { WebGLVarType } from "../utils";
import ShaderProgram from '../webgl/ShaderProgram';

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
const ShiftChannelsKeys = Object.keys(ShiftChannels).filter(s => isNaN(parseInt(s)));

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
    private program: ShaderProgram;
    private channel: ShiftChannels;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.program = new ShaderProgram(this.main.rctx, {
            swapFrame: true,
            bindings: {
                uniforms: {
                    channel: { name: 'u_channel', valueType: WebGLVarType._1I }
                }
            },
            fragmentShader: `
                uniform int u_channel;
                void main() {
                    vec3 color = getSrcColor().rgb;
                    ${
                        _.flatMap(ShiftChannelsKeys, (channel) => `
                            if(u_channel == ${ShiftChannels[channel]}) {
                                setFragColor(vec4(color.${channel.toLowerCase()}, 1));
                            }
                        `).join("\n")
                    }
                }
            `
        });
        this.updateChannel();
    }

    draw() {
        if(this.opts.onBeatRandom && this.main.analyser.beat) {
            this.channel = Math.floor(Math.random() * ShiftChannelsKeys.length);
        }
        this.program.run(this.parent.fm, { channel: this.channel });
    }

    destroy() {
        super.destroy();
        this.program.destroy();
    }

    private updateChannel() {
        this.channel = ShiftChannels[this.opts.channel];
    }
}