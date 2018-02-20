/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

import * as _ from 'lodash';
import IMain from '../IMain';
import Component, {IContainer} from '../Component';
import Buffer from '../webgl/Buffer';
import ShaderProgram from '../webgl/ShaderProgram';
import RenderingContext from '../webgl/RenderingContext';
import { BlendModes, Source, Color, parseColorNorm, WebGLVarType } from '../utils';
import compileExpr, { CompileResult } from '../expr/compileExpr';
import CodeInstance from '../expr/CodeInstance';
import { Channel } from '../analyser/AnalyserAdapter';

enum DrawModes {
    LINES = 1,
    DOTS
}

interface SuperScopeOpts {
    code: {
        init: string,
        perFrame: string,
        onBeat: string,
        perPoint: string
    },
    blendMode: string,
    channel: string,
    source: string,
    drawMode: string,
    thickness: number,
    clone: number,
    colors: string[],
    cycleSpeed: number
}

interface SSCodeInstance extends CodeInstance {
    red: number;
    green: number;
    blue: number;
    n: number;
    b: number;
    i: number;
    v: number;
    x: number;
    y: number;
    init: () => void;
    perFrame: () => void;
    onBeat: () => void;
    perPoint: () => void;
}

// A generic scope, that can draw points or lines based on user code
export default class SuperScope extends Component {
    public static componentName: string = "SuperScope";
    public static componentTag: string = "render";
    protected static optUpdateHandlers = {
        code: ["updateCode", "updateClones"],
        colors: "updateColors",
        cycleSpeed: "updateSpeed",
        clone: "updateClones",
        channel: "updateChannel",
        thickness: "updateThickness",
        blendMode: "updateProgram",
        drawMode: "updateDrawMode",
        source: "updateSource",
    };
    protected static defaultOptions: SuperScopeOpts = {
        code: {
            init: "n=800",
            perFrame: "t=t-0.05",
            onBeat: "",
            perPoint: "d=i+v*0.2; r=t+i*$PI*4; x=cos(r)*d; y=sin(r)*d"
        },
        blendMode: "REPLACE",
        channel: "CENTER",
        source: "SPECTRUM",
        drawMode: "LINES",
        thickness: 1,
        clone: 1,
        colors: ["#ffffff"],
        cycleSpeed: 0.01
    };

    protected opts: SuperScopeOpts;
    private pointBuffer: Buffer;
    private colorBuffer: Buffer;
    private code: SSCodeInstance[];
    private inited: boolean;
    private program: SuperScopeShader;
    private source: Source;
    private channel: Channel;
    private drawMode: DrawModes;
    private veryThick: boolean;
    private colors: Color[];
    private curColorId: number;
    private maxStep: number;
    private curStep: number;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.updateDrawMode();
        this.updateSource();
        this.updateProgram();
        this.updateCode();
        this.updateClones();
        this.updateSpeed();
        this.updateColors();
        this.updateChannel();
        this.updateThickness();
        this.listenTo(this.main, "resize", this.handleResize);

        this.pointBuffer = new Buffer(this.main.rctx);
        this.colorBuffer = new Buffer(this.main.rctx);
    }

    draw() {
        const color = this._makeColor();
        _.each(this.code, (code) => {
            this.drawScope(code, color, !this.inited);
        });
        this.inited = true;
    }

    destroy() {
        super.destroy();
        this.program.destroy();
        this.pointBuffer.destroy();
        this.colorBuffer.destroy();
    }

    /**
     * renders the scope
     * @memberof Webvs.SuperScope#
     */
    private drawScope(code: SSCodeInstance, color: Color, runInit: boolean) {
        const gl = this.main.rctx.gl;

        code.red = color[0];
        code.green = color[1];
        code.blue = color[2];

        if(runInit) {
            code.init();
        }

        const beat = this.main.analyser.beat;
        code.b = beat?1:0;
        code.perFrame();
        if(beat) {
            code.onBeat();
        }

        const nPoints = Math.floor(code.n);
        let data;
        if(this.source == Source.SPECTRUM) {
            data = this.main.analyser.getSpectrum(this.channel);
        } else {
            data = this.main.analyser.getWaveform(this.channel);
        }
        const dots = this.drawMode == DrawModes.DOTS;
        const bucketSize = data.length/nPoints;
        let pbi = 0;
        let cdi = 0;

        let bufferSize, thickX, thickY;
        let lastX, lastY, lastR, lastG, lastB;
        if(this.veryThick) {
            bufferSize = (dots?(nPoints*6):(nPoints*6-6));
            thickX = this.opts.thickness/gl.drawingBufferWidth;
            thickY = this.opts.thickness/gl.drawingBufferHeight;
        } else {
            bufferSize = (dots?nPoints:(nPoints*2-2));
        }

        const pointBufferData = new Float32Array(bufferSize * 2);
        const colorData = new Float32Array(bufferSize * 3);
        for(let i = 0;i < nPoints;i++) {
            let value = 0;
            let size = 0;
            for(let j = Math.floor(i*bucketSize);j < (i+1)*bucketSize;j++,size++) {
                value += data[j];
            }
            value = value/size;

            var pos = i/((nPoints > 1)?(nPoints-1):1);
            code.i = pos;
            code.v = value;
            code.perPoint();
            code.y *= -1;
            if(this.veryThick) {
                if(dots) {
                    // just a box at current point
                    pointBufferData[pbi++] = code.x-thickX;
                    pointBufferData[pbi++] = code.y-thickY;

                    pointBufferData[pbi++] = code.x+thickX;
                    pointBufferData[pbi++] = code.y-thickY;

                    pointBufferData[pbi++] = code.x-thickX;
                    pointBufferData[pbi++] = code.y+thickY;

                    pointBufferData[pbi++] = code.x+thickX;
                    pointBufferData[pbi++] = code.y-thickY;

                    pointBufferData[pbi++] = code.x-thickX;
                    pointBufferData[pbi++] = code.y+thickY;

                    pointBufferData[pbi++] = code.x+thickX;
                    pointBufferData[pbi++] = code.y+thickY;

                    for(let j = 0;j < 6;j++) {
                        colorData[cdi++] = code.red;
                        colorData[cdi++] = code.green;
                        colorData[cdi++] = code.blue;
                    }
                } else {
                    if(i !== 0) {
                        const xdiff = Math.abs(lastX-code.x);
                        const ydiff = Math.abs(lastY-code.y);
                        const xoff = (xdiff <= ydiff)?thickX:0;
                        const yoff = (xdiff >  ydiff)?thickY:0;

                        // a rectangle from last point to the current point
                        pointBufferData[pbi++] = lastX+xoff;
                        pointBufferData[pbi++] = lastY+yoff;

                        pointBufferData[pbi++] = code.x+xoff;
                        pointBufferData[pbi++] = code.y+yoff;

                        pointBufferData[pbi++] = lastX-xoff;
                        pointBufferData[pbi++] = lastY-yoff;

                        pointBufferData[pbi++] = code.x+xoff;
                        pointBufferData[pbi++] = code.y+yoff;

                        pointBufferData[pbi++] = lastX-xoff;
                        pointBufferData[pbi++] = lastY-yoff;

                        pointBufferData[pbi++] = code.x-xoff;
                        pointBufferData[pbi++] = code.y-yoff;

                        for(let j = 0;j < 6;j++) {
                            colorData[cdi++] = code.red;
                            colorData[cdi++] = code.green;
                            colorData[cdi++] = code.blue;
                        }
                    }
                    lastX = code.x;
                    lastY = code.y;
                    lastR = code.red;
                    lastG = code.green;
                    lastB = code.blue;
                }
            } else {
                if(dots) {
                    // just a point at the current point
                    pointBufferData[pbi++] = code.x;
                    pointBufferData[pbi++] = code.y;

                    colorData[cdi++] = code.red;
                    colorData[cdi++] = code.green;
                    colorData[cdi++] = code.blue;
                } else {
                    if(i !== 0) {
                        // lines from last point to current point
                        pointBufferData[pbi++] = lastX;
                        pointBufferData[pbi++] = lastY;

                        pointBufferData[pbi++] = code.x;
                        pointBufferData[pbi++] = code.y;

                        for(let j = 0;j < 2;j++) {
                            // use current color for both points because
                            // we dont want color interpolation between points
                            colorData[cdi++] = code.red;
                            colorData[cdi++] = code.green;
                            colorData[cdi++] = code.blue;
                        }
                    }
                    lastX = code.x;
                    lastY = code.y;
                    lastR = code.red;
                    lastG = code.green;
                    lastB = code.blue;
                }
            }
        }

        this.pointBuffer.setData(pointBufferData);
        this.colorBuffer.setData(colorData);

        this.program.run(this.parent.fm, null, 
                         this.pointBuffer, 
                         this.colorBuffer, 
                         dots, 
                         this.veryThick?1:this.opts.thickness, 
                         this.veryThick);
    }

    private updateProgram() {
        const blendMode: BlendModes = BlendModes[this.opts.blendMode];
        const program = new SuperScopeShader(this.main.rctx, blendMode);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    }

    private updateCode() {
        const code = compileExpr(this.opts.code, ["init", "onBeat", "perFrame", "perPoint"]).codeInst as SSCodeInstance;
        code.n = 100;
        code.setup(this.main);
        this.inited = false;
        this.code = [code];
    }

    private updateClones() {
        this.code = CodeInstance.clone(this.code, this.opts.clone) as SSCodeInstance[];
    }

    private updateColors() {
        this.colors = _.map(this.opts.colors, parseColorNorm);
        this.curColorId = 0;
    }

    private updateSpeed() {
        const oldMaxStep = this.maxStep;
        this.maxStep = Math.floor(1/this.opts.cycleSpeed);
        if(this.curStep) {
            // curStep adjustment when speed changes
            this.curStep = Math.floor((this.curStep/oldMaxStep)*this.maxStep);
        } else {
            this.curStep = 0;
        }
    }

    private updateChannel() {
        this.channel = Channel[this.opts.channel];
    }

    private updateSource() {
        this.source = Source[this.opts.source];
    }

    private updateDrawMode() {
        this.drawMode = DrawModes[this.opts.drawMode];
    }

    private updateThickness() {
        let range;
        const gl = this.main.rctx.gl;
        if(this.drawMode == DrawModes.DOTS) {
            range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
        } else {
            range = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);
        }
        if(this.opts.thickness < range[0] || this.opts.thickness > range[1]) {
            this.veryThick = true;
        } else {
            this.veryThick = false;
        }
    }

    private _makeColor(): Color {
        if(this.colors.length == 1) {
            return this.colors[0];
        } else {
            const color: Color = [0,0,0];
            const currentColor = this.colors[this.curColorId];
            const nextColor = this.colors[(this.curColorId+1)%this.colors.length];
            const mix = this.curStep/this.maxStep;
            for(let i = 0;i < 3;i++) {
                color[i] = currentColor[i]*(1-mix) + nextColor[i]*mix;
            }
            this.curStep = (this.curStep+1)%this.maxStep;
            if(this.curStep === 0) {
                this.curColorId = (this.curColorId+1)%this.colors.length;
            }
            return color;
        }
    }

    private handleResize() {
        _.each(this.code, (code) => {
            code.updateDimVars(this.main.rctx.gl);
        });
    }
}

class SuperScopeShader extends ShaderProgram {
    constructor(rctx: RenderingContext, blendMode: BlendModes) {
        super(rctx, {
            copyOnSwap: true,
            blendMode: blendMode,
            vertexShader: [
                "attribute vec2 a_position;",
                "attribute vec3 a_color;",
                "varying vec3 v_color;",
                "uniform float u_pointSize;",
                "void main() {",
                "   gl_PointSize = u_pointSize;",
                "   setPosition(a_position);",
                "   v_color = a_color;",
                "}"
            ],
            fragmentShader: [
                "varying vec3 v_color;",
                "void main() {",
                "   setFragColor(vec4(v_color, 1));",
                "}"
            ]
        });
    }

    draw(points, colors, dots, thickness, triangles) {
        const gl = this.rctx.gl;

        this.setUniform("u_pointSize", WebGLVarType._1F, thickness);
        this.setAttrib("a_position", points, 2);
        this.setAttrib("a_color", colors, 3);

        var prevLineWidth;
        if(!dots) {
            prevLineWidth = gl.getParameter(gl.LINE_WIDTH);
            gl.lineWidth(thickness);
        }

        var mode;
        if(triangles) {
            mode = gl.TRIANGLES;
        } else if(dots) {
            mode = gl.POINTS;
        } else {
            mode = gl.LINES;
        }
        gl.drawArrays(mode, 0, points.length/2);

        if(!dots) {
            gl.lineWidth(prevLineWidth);
        }
    }
}