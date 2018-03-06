import * as _ from "lodash";
import { WebGLVarType } from "../utils";
import RenderingContext from "./RenderingContext";
import ShaderProgram from "./ShaderProgram";

export interface ICopyProgramValues {
    srcTexture: WebGLTexture;
}

// A Shader that copies given texture onto current buffer
export default class CopyProgram extends ShaderProgram<ICopyProgramValues> {
    constructor(rctx: RenderingContext, dynamicBlend: boolean = false) {
        super(rctx, {
            bindings: {
                uniforms: {
                    srcTexture: { name: "u_copySource", valueType: WebGLVarType.TEXTURE2D },
                },
            },
            dynamicBlend,
            fragmentShader: `
                uniform sampler2D u_copySource;
                void main() {
                setFragColor(texture2D(u_copySource, v_position));
                }
            `,
        });
    }
}
