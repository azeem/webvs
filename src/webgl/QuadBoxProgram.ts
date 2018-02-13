/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

import _ from 'lodash';
import ShaderProgram from './ShaderProgram';
import Buffer from './Buffer';

// A Base for shaders that provides a vertexShader and vertices
// for a rectangle that fills the entire screen
export default class QuadBoxProgram extends ShaderProgram {
    private pointBuffer: Buffer;

    constructor(gl, options) {
        options = _.defaults(options, {
            vertexShader: [
                "attribute vec2 a_position;",
                "void main() {",
                "   setPosition(a_position);",
                "}"
            ]
        });
        super(gl, options);
    }

    init() {
        this.pointBuffer = new Buffer(
            this.gl, false,
            [
                -1,  -1,
                1,  -1,
                -1,  1,
                -1,  1,
                1,  -1,
                1,  1
            ]
       );
    }

    // Sets the vertices for the quad box
    draw(...args: any[]) {
        this.setAttrib("a_position", this.pointBuffer);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
    
    destroy() {
        this.pointBuffer.destroy();
        super.destroy();
    }
}