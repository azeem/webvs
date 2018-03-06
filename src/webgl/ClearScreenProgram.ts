import { BlendModes, Color, WebGLVarType } from "../utils";
import RenderingContext from "./RenderingContext";
import ShaderProgram from "./ShaderProgram";

export interface IClearScreenProgramValues {
    color: Color;
}

export default class ClearScreenProgram extends ShaderProgram<IClearScreenProgramValues> {
    constructor(rctx: RenderingContext, blendMode: BlendModes) {
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
