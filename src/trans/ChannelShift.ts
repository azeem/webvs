import flatMap from "lodash-es/flatMap";
import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import { WebGLVarType } from "../utils";
import RenderingContext from "../webgl/RenderingContext";
import ShaderProgram from "../webgl/ShaderProgram";

/**
 * Options for [[ChannelShift]] component
 */
export interface IChannelShiftOpts {
    /**
     * Channel shift mode. see [[ChannelShiftMode]]
     */
    mode: string;
    /**
     * If enabled, channel shift mode will randomize on beat
     */
    onBeatRandom: boolean;
}

/**
 * Channel shift mode for [[ChannelShift]] component
 */
enum ChannelShiftMode {
    RGB = 0,
    RBG,
    BRG,
    BGR,
    GBR,
    GRB,
}
const ShiftChannelsKeys = Object.keys(ChannelShiftMode).filter((s) => isNaN(parseInt(s, 10)));

/**
 * A component that swizzles the color component
 */
export default class ChannelShift extends Component {
    public static componentName: string = "ChannelShift";
    public static componentTag: string = "trans";
    protected static optUpdateHandlers = {
        mode: "updateMode",
    };
    protected static defaultOptions: IChannelShiftOpts = {
        mode: "RGB",
        onBeatRandom: false,
    };

    protected opts: IChannelShiftOpts;
    private program: ShaderProgram;
    private mode: ChannelShiftMode;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.program = new ShaderProgram(this.main.getRctx(), {
            bindings: {
                uniforms: {
                    mode: { name: "u_channel", valueType: WebGLVarType._1I },
                },
            },
            fragmentShader: `
                uniform int u_channel;
                void main() {
                    vec3 color = getSrcColor().rgb;
                    ${
                        flatMap(ShiftChannelsKeys, (mode) => `
                            if(u_channel == ${ChannelShiftMode[mode]}) {
                                setFragColor(vec4(color.${mode.toLowerCase()}, 1));
                            }
                        `).join("\n")
                    }
                }
            `,
            swapFrame: true,
        });
        this.updateMode();
    }

    public draw() {
        if (this.opts.onBeatRandom && this.main.getAnalyser().isBeat()) {
            this.mode = Math.floor(Math.random() * ShiftChannelsKeys.length);
        }
        this.program.run(this.parent.getTSM(), { mode: this.mode });
    }

    public destroy() {
        super.destroy();
        this.program.destroy();
    }

    private updateMode() {
        this.mode = ChannelShiftMode[this.opts.mode];
    }
}
