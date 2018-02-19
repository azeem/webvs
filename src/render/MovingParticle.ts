/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

import IMain from '../IMain';
import Component, {IContainer} from '../Component';
import ShaderProgram from '../webgl/ShaderProgram';
import Buffer from '../webgl/Buffer';
import { Color, WebGLVarType, BlendModes, parseColorNorm } from '../utils';
import RenderingContext from '../webgl/RenderingContext';
import { circleGeometry } from '../webgl/geometries';

interface MovingParticleOpts {
    color: string,
    distance: number,
    particleSize: number,
    onBeatSizeChange: boolean,
    onBeatParticleSize: number,
    blendMode: string
}

// A particle that moves around depending on beat changes
export default class MovingParticle extends Component {
    public static componentName: string = "MovingParticle";
    public static componentTag: string = "render";
    protected static optUpdateHandlers = {
        color: "updateColor",
        blendMode: "updateBlendMode"
    };
    protected static defaultOptions: MovingParticleOpts = {
        color: "#FFFFFF",
        distance: 0.7,
        particleSize: 10,
        onBeatSizeChange: false,
        onBeatParticleSize: 10,
        blendMode: "REPLACE"
    };

    protected opts: MovingParticleOpts;
    private centerX: number;
    private centerY: number;
    private velocityX: number;
    private velocityY: number;
    private posX: number;
    private posY: number;
    private program: MovingParticleShader;
    private blendMode: BlendModes;
    private color: Color;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.centerX = 0;
        this.centerY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.posX = 0;
        this.posY = 0;

        this.updateBlendMode();
        this.program = new MovingParticleShader(this.main.rctx);
        this.updateColor();
    }

    draw() {
        if(this.main.analyser.beat) {
            this.centerX = (Math.random()*2-1)*0.3;
            this.centerY = (Math.random()*2-1)*0.3;
        }

        this.velocityX -= 0.004*(this.posX-this.centerX);
        this.velocityY -= 0.004*(this.posY-this.centerY);

        this.posX += this.velocityX;
        this.posY += this.velocityY;

        this.velocityX *= 0.991;
        this.velocityY *= 0.991;
        
        var x = this.posX*this.opts.distance;
        var y = this.posY*this.opts.distance;

        var scaleX, scaleY;
        if(this.opts.onBeatSizeChange && this.main.analyser.beat) {
            scaleX = this.opts.onBeatParticleSize;
            scaleY = this.opts.onBeatParticleSize;
        } else {
            scaleX = this.opts.particleSize;
            scaleY = this.opts.particleSize;
        }
        const gl = this.main.rctx.gl;
        scaleX = 2*scaleX/gl.drawingBufferWidth;
        scaleY = 2*scaleY/gl.drawingBufferHeight;

        this.program.run(this.parent.fm, this.blendMode,
                         circleGeometry(this.main.rctx),
                         scaleX, scaleY, x, y, this.color);
    }

    updateBlendMode() {
        this.blendMode = BlendModes[this.opts.blendMode];
    }

    updateColor() {
        this.color = parseColorNorm(this.opts.color);
    }

    destroy() {
        super.destroy();
        this.program.destroy();
    }
}

class MovingParticleShader extends ShaderProgram {
    constructor(rctx: RenderingContext) {
        super(rctx, {
            copyOnSwap: true,
            dynamicBlend: true,
            vertexShader: [
                "attribute vec2 a_point;",
                "uniform vec2 u_position;",
                "uniform vec2 u_scale;",
                "void main() {",
                "   setPosition((a_point*u_scale)+u_position);",
                "}"
            ],
            fragmentShader: [
                "uniform vec3 u_color;",
                "void main() {",
                "   setFragColor(vec4(u_color, 1));",
                "}"
            ]
        });
    }

    draw(points: Buffer, scaleX: number, scaleY: number, x: number, y: number, color: Color) {
        const gl = this.rctx.gl;
        this.setUniform("u_scale", WebGLVarType._2F, scaleX, scaleY);
        this.setUniform("u_position", WebGLVarType._2F, x, y);
        this.setUniform("u_color", WebGLVarType._3FV, color);
        this.setAttrib("a_point", points);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, points.length/2);
    }
}