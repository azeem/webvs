import each from "lodash-es/each";
import indexOf from "lodash-es/indexOf";
import { BlendMode, flatString, logShaderError, WebGLVarType } from "../utils";
import Buffer from "./Buffer";
import { squareGeometry } from "./geometries";
import RenderingContext from "./RenderingContext";
import TextureSetManager from "./TextureSetManager";

/**
 * Attribute binding. The properties here are basically just
 * passed in as arguments to a `gl.vertixAttribPointer` call.
 */
interface IAttributeBinding {
    /**
     * Name of the attribute
     */
    name: string;
    /**
     * vector size of the attribute. Default: 2
     */
    size?: number;
    /**
     * type of the values. Default: `gl.FLOAT`
     */
    valueType?: number;
    /**
     * Indicates whether integer data valiues should be normalized
     */
    normalized?: boolean;
    /**
     * Stride for attribute packing
     */
    stride?: number;
    /**
     * Offset to first value
     */
    offset?: number;
    /**
     * If specified then this attributes length is to make
     * a default draw call using this drawMode
     */
    drawMode?: number;
}

/**
 * Uniform binding.
 */
interface IUniformBinding {
    /**
     * Name of the uniform
     */
    name: string;
    /**
     * Type of the uniform
     */
    valueType?: WebGLVarType;
}

/**
 * Binding for index array.
 */
interface IndexBinding {
    /**
     * Name under which the index array will be passed in
     * to the [[ShaderProgram.run]] call
     */
    valueName: string;
    /**
     * Specified the drawmode for the `gl.drawElements` call
     */
    drawMode?: number;
}

interface IBindings {
    /**
     * Bindings for uniforms
     */
    uniforms?: {[name: string]: IUniformBinding};
    /**
     * Bindings for attributes
     */
    attribs?: {[name: string]: IAttributeBinding};
    /**
     * Index array binding
     */
    index?: IndexBinding;
}

/**
 * Options for [[ShaderProgram]]
 *
 * Common functions, variables and constants avialable in
 * both fragment and vertex shaders:
 *
 * + `PI`: The constant pi
 * + `u_resolution`: a `vec2` with the frame's width and height
 * + `u_srcTexture`: when `swapFrame` is true then this is a
 *   reference to the previous texture
 * + `getSrcColorAtPos(vec2 pos)`: when `swapFrame` is true, this gives
 *   the color at given position in the previous texture
 */
export interface IShaderOpts<ValueType = any> {
    /**
     * Source for fragment shader.
     *
     * variables and functions available in fragment shaders:
     * + `v_position`: a [0-1,0-1] varying of the position
     * + `getSrcColor()`: equivalent to `getSrcColorAtPos(v_position)`
     * + `setFragColor(vec3 color)`: sets gl_FragColor with correct blending
     */
    fragmentShader: string | string[];
    /**
     * Source for vertex shader. If no vertex shader is provided then a
     * a default vertex shader with squareGeometry values is provided.
     *
     * variables and functions available in fragment shaders:
     * + `v_position`: a [0-1,0-1] varying of the position
     * + `setPosition(vec2 position)`: correctly sets the `gl_position`
     */
    vertexShader?: string | string[];
    /**
     * Specifies the default blend mode for this shader.
     */
    blendMode?: BlendMode;
    /**
     * If enabled then everytime this shader is run, we cycle to next frame
     * in the TextureSetManager that's passed in to the run call. The shader
     * program may also choose to do this if a blendMode is not supported by
     * `gl.BlendFunc`
     */
    swapFrame?: boolean;
    /**
     * If enabled, then immediately after a frame swap on the TextureSetManager
     * we also copy the previous frame into current frame
     */
    copyOnSwap?: boolean;
    /**
     * If enabled then default blendMode is not baked into the shader
     * and blendMode can be set on [[ShaderProgram.run]] call
     */
    dynamicBlend?: boolean;
    /**
     * Specifies the blendValue when defaultBlend mode is `ADJUSTABLE`
     */
    blendValue?: 0.5;
    /**
     * Variable bindings for the shader.
     */
    bindings?: IBindings;
    /**
     * A hook function that'd called instead of the default draw call behavior.
     * drawHook can also return a falsy value to indicate that draw has not been
     * handled, causing the shader to fallback to default draw call behavior.
     */
    drawHook?: (values: ValueType, gl: WebGLRenderingContext, shader: ShaderProgram) => any;
}

/**
 * ShaderProgram is an abstraction for Shaders Programs that provides,
 * blended output, easier variable bindings and other nice features.
 */
export default class ShaderProgram<ValueType = any> {
    // these are blend modes not supported with gl.BLEND
    // and the formula to be used inside shader
    private static shaderBlendEq = {
        [BlendMode.MAXIMUM]: "max(color, texture2D(u_srcTexture, v_position))",
        [BlendMode.MINIMUM]: "min(color, texture2D(u_srcTexture, v_position))",
        [BlendMode.MULTIPLY]: "clamp(color * texture2D(u_srcTexture, v_position) * 256.0, 0.0, 1.0)",
        [BlendMode.ABSOLUTE_DIFFERENCE]: "abs(color - texture2D(u_srcTexture, v_position))",
    };

    private rctx: RenderingContext;
    private swapFrame: boolean;
    private copyOnSwap: boolean;
    private blendValue: number;
    private blendMode: BlendMode;
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

    /**
     * Creates a new shader and compiles the source
     * @param rctx the rendering context under which the shader program will be created
     * @param opts shader options
     */
    constructor(rctx: RenderingContext, opts: IShaderOpts<ValueType>) {
        opts = {
            blendMode: BlendMode.REPLACE,
            blendValue: 0.5,
            copyOnSwap: false,
            dynamicBlend: false,
            swapFrame: false,
            ...opts,
        };

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
            each(ShaderProgram.shaderBlendEq, (eq, mode) => {
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

    /**
     * Runs the shader program
     * @param tsm the texture set in which the rendering will be made
     * @param values an object containing values for variables specified in the bindings
     * @param blendMode the blendMode for this render
     * @param blendValue blendValue when blendMode is `ADJUSTABLE`
     */
    public run(tsm: TextureSetManager, values: ValueType, blendMode: BlendMode = null, blendValue: number = null) {
        const gl = this.rctx.getGl();
        const oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.useProgram(this.program);

        if (blendMode && !this.dynamicBlend) {
            throw new Error("Cannot set blendmode at runtime. Use dynamicBlend");
        }
        blendMode = blendMode || this.blendMode;
        blendValue = typeof(blendValue) === "number" ? blendValue : this.blendValue;

        if (tsm) {
            this.setUniform("u_resolution", WebGLVarType._2F, gl.drawingBufferWidth, gl.drawingBufferHeight);
            if (this.swapFrame || this._isShaderBlend(blendMode)) {
                this.setUniform("u_srcTexture", WebGLVarType.TEXTURE2D, tsm.getCurrentTexture());
                tsm.switchTexture();
                if (this.copyOnSwap) {
                    tsm.copyOver();
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

    /**
     * Returns the location of a uniform or attribute.
     *
     * Locations are cached
     * @param name name of the variable
     * @param attrib if true then name is assumed to be an attribute
     */
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

    /**
     * Returns the index of a texture. Assigns id if not already assigned.
     * @param name name of the texture
     */
    public getTextureId(name: string): number {
        let id = indexOf(this.textureVars, name);
        if (id === -1) {
            this.textureVars.push(name);
            id = this.textureVars.length - 1;
        }
        return id;
    }

    /**
     * Binds value of a uniform variable in this program.
     * @param name name of the uniforma variable
     * @param type type of the value
     * @param values value(s) to be bound
     */
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

    /**
     * Binds given buffer as the `ELEMENT_ARRAY_BUFFER`
     * @param buffer buffer to be bound as index
     */
    public setIndex(buffer: Buffer) {
        const gl = this.rctx.getGl();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.getGlBuffer());
    }

    /**
     * Binds an attribute buffer and sets up vertex pointer
     * @param name name of the attribute
     * @param buffer buffer to be bound
     * @param size size of values
     * @param type type of values
     * @param normalized enables normalization for integers
     * @param stride array value stride
     * @param offset offset of first value
     */
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

    /**
     * Destroys all webgl resources
     */
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
                    drawCount = indexBuffer.getLength();
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
                                drawCount = attribBuffer.getLength() / (defn.size || 2);
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
            case BlendMode.ADDITIVE:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case BlendMode.SUB_DEST_SRC:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
                break;
            case BlendMode.SUB_SRC_DEST:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_SUBTRACT);
                break;
            case BlendMode.ALPHA:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case BlendMode.MULTIPLY2:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.DST_COLOR, gl.ZERO);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case BlendMode.ADJUSTABLE:
                gl.enable(gl.BLEND);
                gl.blendColor(0, 0, 0, blendValue);
                gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case BlendMode.FIFTY_FIFTY:
                gl.enable(gl.BLEND);
                gl.blendColor(0.5, 0.5, 0.5, 1);
                gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            // shader blending cases
            case BlendMode.REPLACE:
            case BlendMode.MULTIPLY:
            case BlendMode.MAXIMUM:
            case BlendMode.MINIMUM:
            case BlendMode.ABSOLUTE_DIFFERENCE:
                gl.disable(gl.BLEND);
                break;
            default:
                throw new Error("Unknown blend mode " + mode + " in shader");
        }
    }
}
