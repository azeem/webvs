import { BlendModes, Color, WebGLVarType } from "../utils";
import RenderingContext from "./RenderingContext";
import ShaderProgram from "./ShaderProgram";

export interface ClearScreenProgramValues {
    color: Color;
}

export default class ClearScreenProgram extends ShaderProgram<ClearScreenProgramValues> {
    constructor(rctx: RenderingContext, blendMode: BlendModes) {
        super(rctx, {
            blendMode,
            bindings: {
                uniforms: {
                    color: { name: "u_color", valueType: WebGLVarType._3FV},
                },
            },
            fragmentShader: `
                uniform vec3 u_color;
                void main() {
                setFragColor(vec4(u_color, 1));
                }
            `,
        });
    }
}
