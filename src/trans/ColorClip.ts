import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import { Color, parseColorNorm, WebGLVarType } from "../utils";
import RenderingContext from "../webgl/RenderingContext";
import ShaderProgram from "../webgl/ShaderProgram";

export interface IColorClipOpts {
    mode: string;
    color: string;
    outColor: string;
    level: number;
}
enum ClipModes {
    BELOW = 0,
    ABOVE,
    NEAR,
}

// A component that clips colors to a different color depending
// on whether the source colors are above or below a reference color.
export default class ColorClip extends Component {
    public static componentName: string = "ColorClip";
    public static componentTag: string = "trans";
    protected static optUpdateHandlers = {
        color: "updateColor",
        mode: "updateMode",
        outColor: "updateColor",
    };
    protected static defaultOptions: IColorClipOpts = {
        color: "#202020",
        level: 0,
        mode: "BELOW",
        outColor: "#202020",
    };

    protected opts: IColorClipOpts;
    private program: ShaderProgram;
    private mode: ClipModes;
    private color: Color;
    private outColor: Color;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.program = new ShaderProgram(this.main.rctx, {
            bindings: {
                uniforms: {
                    color:    { name: "u_color", valueType: WebGLVarType._3FV },
                    level:    { name: "u_level", valueType: WebGLVarType._1F },
                    mode:     { name: "u_mode", valueType: WebGLVarType._1I },
                    outColor: { name: "u_outColor", valueType: WebGLVarType._3FV },
                },
            },
            fragmentShader: `
                uniform int u_mode;
                uniform vec3 u_color;
                uniform vec3 u_outColor;
                uniform float u_level;

                void main() {
                   vec4 inColor4 = getSrcColor();
                   vec3 inColor = inColor4.rgb;
                   bool clip = false;
                   if(u_mode == 0) {
                        clip = all(lessThanEqual(inColor, u_color));
                   }
                   if(u_mode == 1) {
                        clip = all(greaterThanEqual(inColor, u_color));
                   }
                   if(u_mode == 2) {
                        clip = (distance(inColor, u_color) <= u_level*0.5);
                   }
                   if(clip) {
                       setFragColor(vec4(u_outColor, inColor4.a));
                   } else {
                       setFragColor(inColor4);
                   }
                }
            `,
            swapFrame: true,
        });
        this.updateColor();
        this.updateMode();
    }

    public draw() {
        this.program.run(
            this.parent.fm,
            {
                color: this.color,
                level: this.opts.level,
                mode: this.mode,
                outColor: this.outColor,
            },
        );
    }

    public destroy() {
        super.destroy();
        this.program.destroy();
    }

    private updateMode() {
        this.mode = ClipModes[this.opts.mode];
    }

    private updateColor() {
        this.color = parseColorNorm(this.opts.color);
        this.outColor = parseColorNorm(this.opts.outColor);
    }
}
