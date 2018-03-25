import * as _ from "lodash";
import { BlendModes, flatString, logShaderError, WebGLVarType } from "../utils";
import Buffer from "./Buffer";
import FrameBufferManager from "./FrameBufferManager";
import { squareGeometry } from "./geometries";
import RenderingContext from "./RenderingContext";

interface IAttributeBinding {
    name: string;
    size?: number;
    valueType?: number;
    normalized?: boolean;
    stride?: number;
    offset?: number;
    drawMode?: number;
}

interface IUniformBinding {
    name: string;
    valueType?: WebGLVarType;
}

interface IndexBinding {
    valueName: string;
    drawMode?: number;
}

interface IBindings {
    uniforms?: {[name: string]: IUniformBinding};
    attribs?: {[name: string]: IAttributeBinding};
    index?: IndexBinding;
}

export interface IShaderOpts<ValueType = any> {
    fragmentShader: string | string[];
    vertexShader?: string | string[];
    blendMode?: BlendModes;
    swapFrame?: boolean;
    copyOnSwap?: boolean;
    dynamicBlend?: boolean;
    blendValue?: 0.5;
    bindings?: IBindings;
    drawHook?: (values: ValueType, gl: WebGLRenderingContext, shader: ShaderProgram) => any;
}

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
export default class ShaderProgram<ValueType = any> {
    // these are blend modes not supported with gl.BLEND
    // and the formula to be used inside shader
    private static shaderBlendEq = {
        [BlendModes.MAXIMUM]: "max(color, texture2D(u_srcTexture, v_position))",
        [BlendModes.MULTIPLY]: "clamp(color * texture2D(u_srcTexture, v_position) * 256.0, 0.0, 1.0)",
    };

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
    private drawHook: (values: ValueType, gl: WebGLRenderingContext, shader: ShaderProgram) => any;
    private bindings: IBindings;
    private locations: {[key: string]: number | WebGLUniformLocation};
    private textureVars: string[];
    private enabledAttribs: number[];

    constructor(rctx: RenderingContext, opts: IShaderOpts<ValueType>) {
        opts = _.defaults(opts, {
            blendMode: BlendModes.REPLACE,
            blendValue: 0.5,
            copyOnSwap: false,
            dynamicBlend: false,
            swapFrame: false,
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

        if (this.dynamicBlend) {
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
            if (this._isShaderBlend(this.blendMode)) {
                const eq = ShaderProgram.shaderBlendEq[this.blendMode];
                fsrc.push(`#define setFragColor(color) (gl_FragColor = (${eq}))`);
            } else {
                fsrc.push("#define setFragColor(color) (gl_FragColor = color)");
            }
        }

        this.drawHook = opts.drawHook;
        this.vertexSrc = vsrc.join("\n") + "\n";
        if (opts.vertexShader) {
            this.vertexSrc += flatString(opts.vertexShader);
        } else {
            this.vertexSrc += `
                attribute vec2 a_position;
                void main() {
                   setPosition(a_position);
                }
            `;
            const oldDrawHook = this.drawHook;
            this.drawHook = (values, gl, shader) => {
                if (oldDrawHook) {
                    oldDrawHook(values, gl, shader);
                }
                this.setAttrib("a_position", squareGeometry(this.rctx));
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            };
        }

        this.fragmentSrc = fsrc.join("\n") + "\n" + flatString(opts.fragmentShader);
        this.locations = {};
        this.textureVars = [];
        this.enabledAttribs = [];
        this.bindings = opts.bindings || {};

        this._compile();
    }

    // Runs this shader program
    public run(fm: FrameBufferManager, values: ValueType, blendMode: BlendModes = null, blendValue: number = null) {
        const gl = this.rctx.getGl();
        const oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.useProgram(this.program);

        if (blendMode && !this.dynamicBlend) {
            throw new Error("Cannot set blendmode at runtime. Use dynamicBlend");
        }
        blendMode = blendMode || this.blendMode;
        blendValue = typeof(blendValue) === "number" ? blendValue : this.blendValue;

        if (fm) {
            this.setUniform("u_resolution", WebGLVarType._2F, gl.drawingBufferWidth, gl.drawingBufferHeight);
            if (this.swapFrame || this._isShaderBlend(blendMode)) {
                this.setUniform("u_srcTexture", WebGLVarType.TEXTURE2D, fm.getCurrentTexture());
                fm.switchTexture();
                if (this.copyOnSwap) {
                    fm.copyOver();
                }
            } else if (this.dynamicBlend) {
                this.setUniform("u_srcTexture", WebGLVarType.TEXTURE2D, null);
            }
        }

        if (this.dynamicBlend) {
            this.setUniform("u_blendMode", WebGLVarType._1I, blendMode);
        }

        this._setGlBlendMode(blendMode, blendValue);
        this.draw(values);
        // disable all enabled attributes
        while (this.enabledAttribs.length) {
            gl.disableVertexAttribArray(this.enabledAttribs.shift());
        }
        gl.disable(gl.BLEND);
        gl.useProgram(oldProgram);
    }

    // returns the location of a uniform or attribute. locations are cached.
    public getLocation(name: string, attrib: boolean = false): number | WebGLUniformLocation {
        let location = this.locations[name];
        if (typeof location === "undefined") {
            const gl = this.rctx.getGl();
            if (attrib) {
                location = gl.getAttribLocation(this.program, name);
            } else {
                location = gl.getUniformLocation(this.program, name);
            }
            this.locations[name] = location;
        }
        return location;
    }

    // returns the index of a texture. assigns id if not already assigned.
    public getTextureId(name: string): number {
        let id = _.indexOf(this.textureVars, name);
        if (id === -1) {
            this.textureVars.push(name);
            id = this.textureVars.length - 1;
        }
        return id;
    }

    // binds value of a uniform variable in this program
    public setUniform(name: string, type: WebGLVarType, ...values) {
        const location = this.getLocation(name);
        const gl = this.rctx.getGl();
        switch (type) {
            case "texture2D":
                const id = this.getTextureId(name);
                gl.activeTexture(gl["TEXTURE" + id]);
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
                if (!(value instanceof Float32Array)) {
                    value = new Float32Array(value);
                }
                gl["uniform" + type].call(gl, location, value);
                break;
        }
    }

    public setIndex(buffer: Buffer) {
        const gl = this.rctx.getGl();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.getGlBuffer());
    }

    public setAttrib(
        name: string,
        buffer: Buffer,
        size: number = 2,
        type: number = this.rctx.getGl().FLOAT,
        normalized: boolean = false,
        stride: number = 0,
        offset: number = 0,
    ) {
        const gl = this.rctx.getGl();
        const location = this.getLocation(name, true) as number;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.getGlBuffer());
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
        gl.enableVertexAttribArray(location);
        this.enabledAttribs.push(location);
    }

    public disableAttrib(name: string) {
        const location = this.getLocation(name, true) as number;
        this.rctx.getGl().disableVertexAttribArray(location);
    }

    // destroys webgl resources consumed by this program.
    // call in component destroy
    public destroy() {
        const gl = this.rctx.getGl();
        gl.deleteProgram(this.program);
        gl.deleteShader(this.vertex);
        gl.deleteShader(this.fragment);
    }

    private _isShaderBlend(mode) {
        return (mode in ShaderProgram.shaderBlendEq);
    }

    private _compile() {
        const gl = this.rctx.getGl();
        const vertex = this._compileShader(this.vertexSrc, gl.VERTEX_SHADER);
        const fragment = this._compileShader(this.fragmentSrc, gl.FRAGMENT_SHADER);
        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error("Program link Error: " + gl.getProgramInfoLog(program));
        }

        this.vertex = vertex;
        this.fragment = fragment;
        this.program = program;
    }

    private _compileShader(shaderSrc: string, type: number): WebGLShader {
        const gl = this.rctx.getGl();
        const shader = gl.createShader(type);
        gl.shaderSource(shader, shaderSrc);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            logShaderError(shaderSrc, gl.getShaderInfoLog(shader));
            throw new Error("Shader compilation Error: " + gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    private draw(values: ValueType) {
        const errorIfNotBuffer = (value, valueName): Buffer => {
            if (value instanceof Buffer) {
                return value;
            } else {
                throw new Error(`Value "${valueName}" should be a Buffer`);
            }
        };

        // bind variables
        let isElements: boolean = false;
        let drawMode: number = null;
        let drawCount: number = null;

        for (const bindingType in this.bindings) {
            if (bindingType === "index") {
                const defn = this.bindings[bindingType];
                const valueName = defn.valueName;
                const value = values[valueName];
                const indexBuffer = errorIfNotBuffer(value, valueName);
                this.setIndex(indexBuffer);
                if (defn.drawMode) {
                    drawCount = indexBuffer.length;
                    drawMode = defn.drawMode;
                    isElements = true;
                }
            } else {
                for (const valueName in this.bindings[bindingType]) {
                    if (!this.bindings[bindingType].hasOwnProperty(valueName)) {
                        continue;
                    }
                    const value = values[valueName];
                    if (bindingType === "attribs") {
                        const defn = this.bindings[bindingType][valueName];
                        if (!value) {
                            this.disableAttrib(defn.name);
                        } else {
                            const attribBuffer = errorIfNotBuffer(value, valueName);
                            this.setAttrib(
                                defn.name,
                                attribBuffer,
                                defn.size,
                                defn.valueType,
                                defn.normalized,
                                defn.stride,
                                defn.offset,
                            );
                            if (defn.drawMode) {
                                drawCount = attribBuffer.length / (defn.size || 2);
                                drawMode = defn.drawMode;
                            }
                        }
                    } else if (bindingType === "uniforms") {
                        const defn = this.bindings[bindingType][valueName];
                        this.setUniform(defn.name, defn.valueType, value);
                    }
                }
            }
        }

        const gl = this.rctx.getGl();
        let drawHandled = false;
        if (this.drawHook) {
            drawHandled = !this.drawHook(values, gl, this);
        }
        if (!drawHandled) {
            if (drawMode !== null) {
                if (isElements) {
                    gl.drawElements(drawMode, drawCount, gl.UNSIGNED_SHORT, 0);
                } else {
                    gl.drawArrays(drawMode, 0, drawCount);
                }
            } else {
                throw new Error("Draw unhandled and no bindings containing drawMode.");
            }
        }
    }

    private _setGlBlendMode(mode, blendValue) {
        const gl = this.rctx.getGl();
        switch (mode) {
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
                gl.blendColor(0, 0, 0, blendValue);
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
}
