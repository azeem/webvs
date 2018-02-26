import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import QuadBoxProgram from "../webgl/QuadBoxProgram";
import RenderingContext from "../webgl/RenderingContext";
import { WebGLVarType, Color, parseColorNorm } from "../utils";

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

export interface ColorClipOpts {
    mode: string,
    color: string,
    outColor: string,
    level: number
}
enum ClipModes {
    BELOW = 0,
    ABOVE,
    NEAR
};

// A component that clips colors to a different color depending
// on whether the source colors are above or below a reference color.
export default class ColorClip extends Component {
    public static componentName: string = "ColorClip";
    public static componentTag: string = "trans";
    protected static optUpdateHandlers = {
        mode: "updateMode",
        color: "updateColor",
        outColor: "updateColor"
    };
    protected static defaultOptions: ColorClipOpts = {
        mode: "BELOW",
        color: "#202020",
        outColor: "#202020",
        level: 0
    };

    protected opts: ColorClipOpts;
    private program: ColorClipProgram;
    private mode: ClipModes;
    private color: Color;
    private outColor: Color;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.program = new ColorClipProgram(this.main.rctx);
        this.updateColor();
        this.updateMode();
    }

    draw() {
        this.program.run(this.parent.fm, null, this.mode, this.color, this.outColor, this.opts.level);
    }

    destroy() {
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

class ColorClipProgram extends QuadBoxProgram {
    constructor(rctx: RenderingContext) {
        super(rctx, {
            swapFrame: true,
            fragmentShader: [
                "uniform int u_mode;",
                "uniform vec3 u_color;",
                "uniform vec3 u_outColor;",
                "uniform float u_level;",

                "void main() {",
                "   vec4 inColor4 = getSrcColor();",
                "   vec3 inColor = inColor4.rgb;",
                "   bool clip = false;",
                "   if(u_mode == 0) {",
                "           clip = all(lessThanEqual(inColor, u_color));",
                "   }",
                "   if(u_mode == 1) {",
                "           clip = all(greaterThanEqual(inColor, u_color));",
                "   }",
                "   if(u_mode == 2) {",
                "           clip = (distance(inColor, u_color) <= u_level*0.5);",
                "   }",
                "   if(clip) {",
                "       setFragColor(vec4(u_outColor, inColor4.a));",
                "   } else {",
                "       setFragColor(inColor4);",
                "   }",
                "}",
            ]
        });
    }

    draw(mode: ClipModes, color: Color, outColor: Color, level: number) {
        this.setUniform("u_mode", WebGLVarType._1I, mode);
        this.setUniform("u_color", WebGLVarType._3FV, color);
        this.setUniform("u_outColor", WebGLVarType._3FV, outColor);
        this.setUniform("u_level", WebGLVarType._1F, level);
        super.draw();
    }
}