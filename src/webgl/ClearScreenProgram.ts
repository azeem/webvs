import { BlendMode, Color, WebGLVarType } from "../utils";
import RenderingContext from "./RenderingContext";
import ShaderProgram from "./ShaderProgram";

/**
 * Values that can be passed to [[ClearScreenProgram.run]]
 */
export interface IClearScreenProgramValues {
    /**
     * Color to which the screen should be cleared
     */
    color: Color;
}

/**
 * A Shader program the clears the screen to a given color
 */
export default class ClearScreenProgram extends ShaderProgram<IClearScreenProgramValues> {
    /**
     * Creates new ClearScreenProgram
     * @param rctx the rendering context in which to create this shader
     * @param blendMode blend mode for this shader
     */
    constructor(rctx: RenderingContext, blendMode: BlendMode) {
        super(rctx, {
            bindings: {
                uniforms: {
                    color: { name: "u_color", valueType: WebGLVarType._3FV},
                },
            },
            blendMode,
            fragmentShader: `
                uniform vec3 u_color;
                void main() {
                setFragColor(vec4(u_color, 1));
                }
            `,
        });
    }
}
