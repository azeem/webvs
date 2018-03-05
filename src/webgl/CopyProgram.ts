import * as _ from 'lodash';
import { WebGLVarType } from '../utils';
import RenderingContext from './RenderingContext';
import ShaderProgram from './ShaderProgram';

export interface CopyProgramValues {
    srcTexture: WebGLTexture
}

// A Shader that copies given texture onto current buffer
export default class CopyProgram extends ShaderProgram<CopyProgramValues> {
    constructor(rctx: RenderingContext) {
        super(rctx, {
            bindings: {
                uniforms: {
                    srcTexture: { name: 'u_copySource', valueType: WebGLVarType.TEXTURE2D }
                }
            },
            fragmentShader: `
                uniform sampler2D u_copySource;
                void main() {
                setFragColor(texture2D(u_copySource, v_position));
                }
            `
        });
    }
}