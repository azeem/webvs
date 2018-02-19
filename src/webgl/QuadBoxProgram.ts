/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

import _ from 'lodash';
import ShaderProgram from './ShaderProgram';
import Buffer from './Buffer';
import { squareGeometry } from './geometries';
import RenderingContext from './RenderingContext';

// A Base for shaders that provides a vertexShader and vertices
// for a rectangle that fills the entire screen
export default class QuadBoxProgram extends ShaderProgram {
    private pointBuffer: Buffer;

    constructor(rctx: RenderingContext, options) {
        options = _.defaults(options, {
            vertexShader: [
                "attribute vec2 a_position;",
                "void main() {",
                "   setPosition(a_position);",
                "}"
            ]
        });
        super(rctx, options);
    }

    // Sets the vertices for the quad box
    draw(...args: any[]) {
        const gl = this.rctx.gl;
        this.setAttrib("a_position", squareGeometry(this.rctx));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    destroy() {
        super.destroy();
    }
}