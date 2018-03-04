import * as _ from 'lodash';
import { BlendModes, logShaderError, WebGLVarType } from '../utils';
import Buffer from './Buffer';
import FrameBufferManager from './FrameBufferManager';
import RenderingContext from './RenderingContext';

// Base class for Webgl Shaders. This provides an abstraction
// with support for blended output, easier variable bindings
// etc.

// For outputblending, we try to use GL blendEq and blendFunc
// if possible, otherwise we fallback to shader based blending,
// where we swap the frame, sample the previous texture, and blend
// the colors in the shader itself. To do this seamlessly, shader code in subclasses
// should use a set of macros. eg: setFragColor instead of
// setting gl_FragColor directly. The proper macro implementation
// is inserted based on the blending modes.

// #### glsl utilities

// The following utilities are usable inside the shader code in subclasses
// + `setPosition(vec2 pos)` - sets gl_Position
// + `getSrcColorAtPos(vec2 pos)` - pixel value at pos in u_srcTexture
// + `getSrcColor(vec2 pos)` - same as above, but uses v_position
// + `setFragColor(vec4 color)` - sets the correctly blended fragment color
// + `sampler2D u_srcTexture` - the source texture from previous frame. enabled
//     when swapFrame is set to true
// + `vec1 u_resolution` - the screen resolution. enabled only if fm is 
//     passed to {@link Webvs.ShaderProgram.run} call
// + `vec2 v_position` - a 0-1, 0-1 normalized varying of the vertex. enabled
//     when varyingPos option is used
export default abstract class ShaderProgram {
    protected rctx: RenderingContext;
    private swapFrame: boolean;
    private copyOnSwap: boolean;
    private blendValue: number;
    private blendMode: BlendModes;
    private dynamicBlend: boolean;
    private fragmentSrc: string;
    private vertexSrc: string;
    private fragment: WebGLShader;
    private vertex: WebGLShader;
    private program: WebGLProgram;
    private _locations: {[key:string]: number | WebGLUniformLocation};
    private _textureVars: string[];
    private _enabledAttribs: number[];

    // these are blend modes not supported with gl.BLEND
    // and the formula to be used inside shader
    static shaderBlendEq = {
        [BlendModes.MAXIMUM]: "max(color, texture2D(u_srcTexture, v_position))",
        [BlendModes.MULTIPLY]: "clamp(color * texture2D(u_srcTexture, v_position) * 256.0, 0.0, 1.0)"
    };

    // Performs the actual drawing and any further bindings and calculations if required.
    abstract draw(...args: any[]): void;

    constructor(rctx: RenderingContext, opts: any) {
        opts = _.defaults(opts, {
            blendMode: BlendModes.REPLACE,
            swapFrame: false,
            copyOnSwap: false,
            dynamicBlend: false,
            blendValue: 0.5
        });

        const vsrc = [`
            precision mediump float;
            varying vec2 v_position;
            uniform vec2 u_resolution;
            uniform sampler2D u_srcTexture;

            #define PI ${Math.PI}
            #define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))
            #define setPosition(pos) (v_position = (((pos)+1.0)/2.0),gl_Position = vec4((pos), 0, 1))
        `];

        const fsrc = [`
            precision mediump float;
            varying vec2 v_position;
            uniform vec2 u_resolution;
            uniform sampler2D u_srcTexture;

            #define PI ${Math.PI}
            #define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))
            #define getSrcColor() (texture2D(u_srcTexture, v_position))
        `];

        this.rctx = rctx;
        this.swapFrame = opts.swapFrame;
        this.copyOnSwap = opts.copyOnSwap;
        this.blendValue = opts.blendValue;
        this.blendMode = opts.blendMode;
        this.dynamicBlend = opts.dynamicBlend;

        if(this.dynamicBlend) {
            fsrc.push(`
                uniform int u_blendMode;
                void setFragColor(vec4 color) {
            `);
            _.each(ShaderProgram.shaderBlendEq, (eq, mode) => {
                fsrc.push(`
                    if(u_blendMode == ${mode}) {
                        gl_FragColor = (${eq});
                    } else
                `);
            });
            fsrc.push(`
                    {
                        gl_FragColor = color;
                    }
                }
            `);
        } else {
            if(this._isShaderBlend(this.blendMode)) {
                const eq = ShaderProgram.shaderBlendEq[this.blendMode];
                fsrc.push(`#define setFragColor(color) (gl_FragColor = (${eq}))`);
            } else {
                fsrc.push("#define setFragColor(color) (gl_FragColor = color)");
            }
        }

        this.fragmentSrc = fsrc.join("\n") + "\n" + opts.fragmentShader.join("\n");
        this.vertexSrc = vsrc.join("\n") + "\n" + opts.vertexShader.join("\n");
        this._locations = {};
        this._textureVars = [];
        this._enabledAttribs = [];

        this._compile();
        this.init();
    }

    init() {}

    private _isShaderBlend(mode) {
        return (mode in ShaderProgram.shaderBlendEq);
    }

    private _compile() {
        const gl = this.rctx.gl;
        const vertex = this._compileShader(this.vertexSrc, gl.VERTEX_SHADER);
        const fragment = this._compileShader(this.fragmentSrc, gl.FRAGMENT_SHADER);
        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);

        if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error("Program link Error: " + gl.getProgramInfoLog(program));
        }

        this.vertex = vertex;
        this.fragment = fragment;
        this.program = program;
    }

    private _compileShader(shaderSrc: string, type: number): WebGLShader {
        const gl = this.rctx.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, shaderSrc);
        gl.compileShader(shader);
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            logShaderError(shaderSrc, gl.getShaderInfoLog(shader));
            throw new Error("Shader compilation Error: " + gl.getShaderInfoLog(shader));
        }
        return shader;
    }


    // Runs this shader program
    run(fm: FrameBufferManager, blendMode: BlendModes, ...args: any[]) {
        const gl = this.rctx.gl;
        const oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.useProgram(this.program);

        if(blendMode && !this.dynamicBlend) {
            throw new Error("Cannot set blendmode at runtime. Use dynamicBlend");
        }
        blendMode = blendMode || this.blendMode;

        if(fm) {
            this.setUniform("u_resolution", WebGLVarType._2F, gl.drawingBufferWidth, gl.drawingBufferHeight);
            if(this.swapFrame || this._isShaderBlend(blendMode)) {
                this.setUniform("u_srcTexture", WebGLVarType.TEXTURE2D, fm.getCurrentTexture());
                fm.switchTexture();
                if(this.copyOnSwap) {
                    fm.copyOver();
                }
            } else if(this.dynamicBlend) {
                this.setUniform("u_srcTexture", WebGLVarType.TEXTURE2D, null);
            }
        }

        if(this.dynamicBlend) {
            this.setUniform("u_blendMode", WebGLVarType._1I, blendMode);
        }

        this._setGlBlendMode(blendMode);
        this.draw.apply(this, args);
        // disable all enabled attributes
        while(this._enabledAttribs.length) {
            gl.disableVertexAttribArray(this._enabledAttribs.shift());
        }
        gl.disable(gl.BLEND);
        gl.useProgram(oldProgram);
    }

    private _setGlBlendMode(mode) {
        const gl = this.rctx.gl;
        switch(mode) {
            case BlendModes.ADDITIVE:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case BlendModes.SUBTRACTIVE1:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
                break;
            case BlendModes.SUBTRACTIVE2:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_SUBTRACT);
                break;
            case BlendModes.ALPHA:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case BlendModes.MULTIPLY2:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.DST_COLOR, gl.ZERO);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case BlendModes.ADJUSTABLE:
                gl.enable(gl.BLEND);
                gl.blendColor(0, 0, 0, this.blendValue);
                gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case BlendModes.AVERAGE:
                gl.enable(gl.BLEND);
                gl.blendColor(0.5, 0.5, 0.5, 1);
                gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            // shader blending cases
            case BlendModes.REPLACE:
            case BlendModes.MULTIPLY:
            case BlendModes.MAXIMUM:
                gl.disable(gl.BLEND);
                break;
            default:
                throw new Error("Unknown blend mode " + mode + " in shader");
        }
    }

    // returns the location of a uniform or attribute. locations are cached.
    getLocation(name: string, attrib: boolean = false): number | WebGLUniformLocation {
        let location = this._locations[name];
        if(typeof location === 'undefined') {
            const gl = this.rctx.gl;
            if(attrib) {
                location = gl.getAttribLocation(this.program, name);
            } else {
                location = gl.getUniformLocation(this.program, name);
            }
            this._locations[name] = location;
        }
        return location;
    }

    // returns the index of a texture. assigns id if not already assigned.
    getTextureId(name: string): number {
        let id = _.indexOf(this._textureVars, name);
        if(id === -1) {
            this._textureVars.push(name);
            id = this._textureVars.length-1;
        }
        return id;
    }

    // binds value of a uniform variable in this program
    setUniform(name: string, type: WebGLVarType, ...values) {
        const location = this.getLocation(name);
        const gl = this.rctx.gl;
        switch(type) {
            case "texture2D":
                const id = this.getTextureId(name);
                gl.activeTexture(gl["TEXTURE"+id]);
                gl.bindTexture(gl.TEXTURE_2D, values[0]);
                gl.uniform1i(location, id);
                break;
            case "1f": case "2f": case "3f": case "4f":
            case "1i": case "2i": case "3i": case "4i":
                gl["uniform" + type].apply(gl, [location].concat(values));
                break;
            case "1fv": case "2fv": case "3fv": case "4fv":
            case "1iv": case "2iv": case "3iv": case "4iv":
                let value = values[0];
                if(!(value instanceof Float32Array)) {
                    value = new Float32Array(value);
                }
                gl["uniform" + type].call(gl, location, value);
                break;
        }
    }

    setIndex(buffer: Buffer) {
        const gl = this.rctx.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.getGlBuffer());
    }

    setAttrib(
        name: string, 
        buffer: Buffer, 
        size: number = 2, 
        type: number = this.rctx.gl.FLOAT, 
        normalized:boolean = false, 
        stride: number = 0, 
        offset: number = 0
    ) {
        const gl = this.rctx.gl;
        const location = this.getLocation(name, true) as number;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.getGlBuffer());
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
        gl.enableVertexAttribArray(location);
        this._enabledAttribs.push(location);
    }

    disableAttrib(name: string) {
        const location = this.getLocation(name, true) as number;
        this.rctx.gl.disableVertexAttribArray(location);
    }

    // destroys webgl resources consumed by this program.
    // call in component destroy
    destroy() {
        const gl = this.rctx.gl;
        gl.deleteProgram(this.program);
        gl.deleteShader(this.vertex);
        gl.deleteShader(this.fragment);
    }
}
