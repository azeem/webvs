import each from "lodash-es/each";
import Component, {IContainer} from "../Component";
import CodeInstance from "../expr/CodeInstance";
import compileExpr, { ICompileResult } from "../expr/compileExpr";
import IMain from "../IMain";
import { AudioChannels, AudioSource, BlendMode, Color, parseColorNorm, WebGLVarType } from "../utils";
import Buffer from "../webgl/Buffer";
import RenderingContext from "../webgl/RenderingContext";
import ShaderProgram from "../webgl/ShaderProgram";

/**
 * Drawing modes for the [[SuperScope]] component
 */
enum SuperScopeDrawMode {
    LINES = 1,
    DOTS,
}

/**
 * Options for the [[SuperScope]] component
 */
export interface ISuperScopeOpts {
    /**
     * EEL code to control drawing of scope
     *
     * EEL Variables:
     * + `red: `(ReadWrite, perPoint)` Set red of color (0-1)
     * + `green`: `(ReadWrite, perPoint)` Set green of color (0-1)
     * + `blue`: `(ReadWrite, perPoint)` Set blue of color (0-1)
     * + `n`: `(ReadWrite, init/perFrame/onBeat)` Set the number of points to be drawn
     * + `b`: `(Read, onBeat/perFrame/perPixel)` - 0/1 value indicate a beat
     * + `i`: `(Read, perPixel)` - (0-1) value indicating index of current point
     * + `v`: `(Read, perPixel)` - (0-1) value indicating value of scope at current point
     * + `x`: `(Write, perPixel)` - set this to set position of current point
     * + `y`: `(Write, perPixel)` - set this to set position of current point
     */
    code: {
        /**
         * EEL that'll be run on init
         */
        init: string,
        /**
         * EEL code that's run per frame
         */
        perFrame: string,
        /**
         * EEL code that's run on beat
         */
        onBeat: string,
        /**
         * EEL code that's run for each point
         */
        perPoint: string,
    };
    /**
     * Blend mode for superscope. Default: `REPLACE`
     */
    blendMode: string;
    /**
     * Channel for scope values. Default: `CENTER`
     */
    audioChannel: string;
    /**
     * Data source of scope value. Default: `SPECTRUM`
     */
    audioSource: string;
    /**
     * Drawing mode for the scope. see [[SuperScopeDrawMode]]. Default: `LINES`
     */
    drawMode: string;
    /**
     * Thickness of dots/line. Default: 1
     */
    thickness: number;
    /**
     * Number of times this superscope instance should be cloned. Default: 1
     */
    clone: number;
    /**
     * Colors that the superscope should cycle through.
     * RGB values set through EEL override this color.
     * Default: `["#FFFFFF"]`
     */
    colors: string[];
    /**
     * Speed at which superscope colors will be cycled.
     * Default: `0.01`
     */
    cycleSpeed: number;
}

interface ISuperScopeShaderValues {
    pointSize: number;
    points: Buffer;
    colors: Buffer;
    isDots: boolean;
    drawTriangles: boolean;
}

interface ISSCodeInstance extends CodeInstance {
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

/**
 * A generic scope, that can draw points or lines based on user code
 */
export default class SuperScope extends Component {
    public static componentName: string = "SuperScope";
    public static componentTag: string = "render";
    protected static optUpdateHandlers = {
        audioChannel: "updateAudioChannel",
        audioSource: "updateAudioSource",
        blendMode: "updateProgram",
        clone: "updateClones",
        code: [ "updateCode", "updateClones"],
        colors: "updateColors",
        cycleSpeed: "updateSpeed",
        drawMode: "updateDrawMode",
        thickness: "updateThickness",
    };
    protected static defaultOptions: ISuperScopeOpts = {
        audioChannel: "CENTER",
        audioSource: "SPECTRUM",
        blendMode: "REPLACE",
        clone: 1,
        code: {
            init: "n=800",
            onBeat: "",
            perFrame: "t=t-0.05",
            perPoint: "d=i+v*0.2; r=t+i*$PI*4; x=cos(r)*d; y=sin(r)*d",
        },
        colors: ["#ffffff"],
        cycleSpeed: 0.01,
        drawMode: "LINES",
        thickness: 1,
    };

    protected opts: ISuperScopeOpts;
    private pointBuffer: Buffer;
    private colorBuffer: Buffer;
    private code: ISSCodeInstance[];
    private inited: boolean;
    private program: ShaderProgram<ISuperScopeShaderValues>;
    private audioSource: AudioSource;
    private audioChannel: AudioChannels;
    private drawMode: SuperScopeDrawMode;
    private veryThick: boolean;
    private colors: Color[];
    private curColorId: number;
    private maxStep: number;
    private curStep: number;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.updateDrawMode();
        this.updateAudioSource();
        this.updateProgram();
        this.updateCode();
        this.updateClones();
        this.updateSpeed();
        this.updateColors();
        this.updateAudioChannel();
        this.updateThickness();
        this.listenTo(this.main, "resize", () => this.handleResize());

        this.pointBuffer = new Buffer(this.main.getRctx());
        this.colorBuffer = new Buffer(this.main.getRctx());
    }

    public draw() {
        const color = this._makeColor();
        each(this.code, (code) => {
            this.drawScope(code, color, !this.inited);
        });
        this.inited = true;
    }

    public destroy() {
        super.destroy();
        this.program.destroy();
        this.pointBuffer.destroy();
        this.colorBuffer.destroy();
    }

    /**
     * renders the scope
     * @memberof Webvs.SuperScope#
     */
    private drawScope(code: ISSCodeInstance, color: Color, runInit: boolean) {
        const gl = this.main.getRctx().getGl();

        code.red = color[0];
        code.green = color[1];
        code.blue = color[2];

        if (runInit) {
            code.init();
        }

        const beat = this.main.getAnalyser().isBeat();
        code.b = beat ? 1 : 0;
        code.perFrame();
        if (beat) {
            code.onBeat();
        }

        const nPoints = Math.floor(code.n);
        let data;
        if (this.audioSource === AudioSource.SPECTRUM) {
            data = this.main.getAnalyser().getSpectrum(this.audioChannel);
        } else {
            data = this.main.getAnalyser().getWaveform(this.audioChannel);
        }
        const dots = this.drawMode === SuperScopeDrawMode.DOTS;
        const bucketSize = data.length / nPoints;
        let pbi = 0;
        let cdi = 0;

        let bufferSize;
        let thickX;
        let thickY;
        let lastX;
        let lastY;
        let lastR;
        let lastG;
        let lastB;
        if (this.veryThick) {
            bufferSize = (dots ? (nPoints * 6) : (nPoints * 6 - 6));
            thickX = this.opts.thickness / gl.drawingBufferWidth;
            thickY = this.opts.thickness / gl.drawingBufferHeight;
        } else {
            bufferSize = (dots ? nPoints : (nPoints * 2 - 2));
        }

        const pointBufferData = new Float32Array(bufferSize * 2);
        const colorData = new Float32Array(bufferSize * 3);
        for (let i = 0; i < nPoints; i++) {
            let value = 0;
            let size = 0;
            for (let j = Math.floor(i * bucketSize); j < (i + 1) * bucketSize; j++, size++) {
                value += data[j];
            }
            value = value / size;

            const pos = i / ((nPoints > 1) ? (nPoints - 1) : 1);
            code.i = pos;
            code.v = value;
            code.perPoint();
            code.y *= -1;
            if (this.veryThick) {
                if (dots) {
                    // just a box at current point
                    pointBufferData[pbi++] = code.x - thickX;
                    pointBufferData[pbi++] = code.y - thickY;

                    pointBufferData[pbi++] = code.x + thickX;
                    pointBufferData[pbi++] = code.y - thickY;

                    pointBufferData[pbi++] = code.x - thickX;
                    pointBufferData[pbi++] = code.y + thickY;

                    pointBufferData[pbi++] = code.x + thickX;
                    pointBufferData[pbi++] = code.y - thickY;

                    pointBufferData[pbi++] = code.x - thickX;
                    pointBufferData[pbi++] = code.y + thickY;

                    pointBufferData[pbi++] = code.x + thickX;
                    pointBufferData[pbi++] = code.y + thickY;

                    for (let j = 0; j < 6; j++) {
                        colorData[cdi++] = code.red;
                        colorData[cdi++] = code.green;
                        colorData[cdi++] = code.blue;
                    }
                } else {
                    if (i !== 0) {
                        const xdiff = Math.abs(lastX - code.x);
                        const ydiff = Math.abs(lastY - code.y);
                        const xoff = (xdiff <= ydiff) ? thickX : 0;
                        const yoff = (xdiff >  ydiff) ? thickY : 0;

                        // a rectangle from last point to the current point
                        pointBufferData[pbi++] = lastX + xoff;
                        pointBufferData[pbi++] = lastY + yoff;

                        pointBufferData[pbi++] = code.x + xoff;
                        pointBufferData[pbi++] = code.y + yoff;

                        pointBufferData[pbi++] = lastX - xoff;
                        pointBufferData[pbi++] = lastY - yoff;

                        pointBufferData[pbi++] = code.x + xoff;
                        pointBufferData[pbi++] = code.y + yoff;

                        pointBufferData[pbi++] = lastX - xoff;
                        pointBufferData[pbi++] = lastY - yoff;

                        pointBufferData[pbi++] = code.x - xoff;
                        pointBufferData[pbi++] = code.y - yoff;

                        for (let j = 0; j < 6; j++) {
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
                if (dots) {
                    // just a point at the current point
                    pointBufferData[pbi++] = code.x;
                    pointBufferData[pbi++] = code.y;

                    colorData[cdi++] = code.red;
                    colorData[cdi++] = code.green;
                    colorData[cdi++] = code.blue;
                } else {
                    if (i !== 0) {
                        // lines from last point to current point
                        pointBufferData[pbi++] = lastX;
                        pointBufferData[pbi++] = lastY;

                        pointBufferData[pbi++] = code.x;
                        pointBufferData[pbi++] = code.y;

                        for (let j = 0; j < 2; j++) {
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

        this.program.run(
            this.parent.getTSM(),
            {
                colors: this.colorBuffer,
                drawTriangles: this.veryThick,
                isDots: dots,
                pointSize: this.veryThick ? 1 : this.opts.thickness,
                points: this.pointBuffer,
            },
        );
    }

    private updateProgram() {
        const blendMode: BlendMode = BlendMode[this.opts.blendMode];
        const program = new ShaderProgram<ISuperScopeShaderValues>(this.main.getRctx(), {
            bindings: {
                attribs: {
                    colors: { name: "a_color", size: 3 },
                    points: { name: "a_position" },
                },
                uniforms: {
                    pointSize: { name: "u_pointSize", valueType: WebGLVarType._1F },
                },
            },
            blendMode,
            copyOnSwap: true,
            drawHook: (values, gl) => {
                let prevLineWidth;
                if (!values.isDots) {
                    prevLineWidth = gl.getParameter(gl.LINE_WIDTH);
                    gl.lineWidth(values.pointSize);
                }

                let mode;
                if (values.drawTriangles) {
                    mode = gl.TRIANGLES;
                } else if (values.isDots) {
                    mode = gl.POINTS;
                } else {
                    mode = gl.LINES;
                }
                gl.drawArrays(mode, 0, values.points.getLength() / 2);

                if (!values.isDots) {
                    gl.lineWidth(prevLineWidth);
                }
            },
            fragmentShader: `
                varying vec3 v_color;
                void main() {
                    setFragColor(vec4(v_color, 1));
                }
            `,
            vertexShader: `
                attribute vec2 a_position;
                attribute vec3 a_color;
                varying vec3 v_color;
                uniform float u_pointSize;
                void main() {
                    gl_PointSize = u_pointSize;
                    setPosition(a_position);
                    v_color = a_color;
                }
            `,
        });
        if (this.program) {
            this.program.destroy();
        }
        this.program = program;
    }

    private updateCode() {
        const code = compileExpr(
            this.opts.code,
            ["init", "onBeat", "perFrame", "perPoint"],
        ).codeInst as ISSCodeInstance;
        code.n = 100;
        code.setup(this.main);
        this.inited = false;
        this.code = [code];
    }

    private updateClones() {
        this.code = CodeInstance.clone(this.code, this.opts.clone) as ISSCodeInstance[];
    }

    private updateColors() {
        this.colors = this.opts.colors.map(parseColorNorm);
        this.curColorId = 0;
    }

    private updateSpeed() {
        const oldMaxStep = this.maxStep;
        this.maxStep = Math.floor(1 / this.opts.cycleSpeed);
        if (this.curStep) {
            // curStep adjustment when speed changes
            this.curStep = Math.floor((this.curStep / oldMaxStep) * this.maxStep);
        } else {
            this.curStep = 0;
        }
    }

    private updateAudioChannel() {
        this.audioChannel = AudioChannels[this.opts.audioChannel];
    }

    private updateAudioSource() {
        this.audioSource = AudioSource[this.opts.audioSource];
    }

    private updateDrawMode() {
        this.drawMode = SuperScopeDrawMode[this.opts.drawMode];
    }

    private updateThickness() {
        let range;
        const gl = this.main.getRctx().getGl();
        if (this.drawMode === SuperScopeDrawMode.DOTS) {
            range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
        } else {
            range = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);
        }
        if (this.opts.thickness < range[0] || this.opts.thickness > range[1]) {
            this.veryThick = true;
        } else {
            this.veryThick = false;
        }
    }

    private _makeColor(): Color {
        if (this.colors.length === 1) {
            return this.colors[0];
        } else {
            const color: Color = [0, 0, 0];
            const currentColor = this.colors[this.curColorId];
            const nextColor = this.colors[(this.curColorId + 1) % this.colors.length];
            const mix = this.curStep / this.maxStep;
            for (let i = 0; i < 3; i++) {
                color[i] = currentColor[i] * (1 - mix) + nextColor[i] * mix;
            }
            this.curStep = (this.curStep + 1) % this.maxStep;
            if (this.curStep === 0) {
                this.curColorId = (this.curColorId + 1) % this.colors.length;
            }
            return color;
        }
    }

    private handleResize() {
        each(this.code, (code) => {
            code.updateDimVars(this.main.getRctx().getGl());
        });
    }
}
