/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

import _ from 'lodash';
import QuadBoxProgram from './QuadBoxProgram';
import { WebGLVarType } from '../utils';

// A Shader that copies given texture onto current buffer
export default class CopyProgram extends QuadBoxProgram {
    constructor(gl, options) {
        options = _.defaults(options||{}, {
            fragmentShader: [
                "uniform sampler2D u_copySource;",
                "void main() {",
                "   setFragColor(texture2D(u_copySource, v_position));",
                "}"
            ]
        });
        super(gl, options);
    }
    // Renders this shader
    draw(srcTexture) {
        this.setUniform("u_copySource", WebGLVarType.TEXTURE2D, srcTexture);
        super.draw();
    }
}