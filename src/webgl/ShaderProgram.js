/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class 
 * Base class for Webgl Shaders. This provides an abstraction
 * with support for blended output, easier variable bindings
 * etc.
 *
 * For outputblending, we try to use GL blendEq and blendFunc
 * if possible, otherwise we fallback to shader based blending,
 * where we swap the frame, sample the previous texture, and blend
 * the colors in the shader itself. To do this seamlessly, shader code in subclasses
 * should use a set of macros. eg: setFragColor instead of
 * setting gl_FragColor directly. The proper macro implementation
 * is inserted based on the blending modes.
 *
 * #### glsl utilities
 *
 * The following utilities are usable inside the shader code in subclasses
 *
 * + `setPosition(vec2 pos)` - sets gl_Position
 * + `getSrcColorAtPos(vec2 pos)` - pixel value at pos in u_srcTexture
 * + `getSrcColor(vec2 pos)` - same as above, but uses v_position
 * + `setFragColor(vec4 color)` - sets the correctly blended fragment color
 * + `sampler2D u_srcTexture` - the source texture from previous frame. enabled
 *     when swapFrame is set to true
 * + `vec2 u_resolution` - the screen resolution. enabled only if fm is 
 *     passed to {@link Webvs.ShaderProgram.run} call
 * + `vec2 v_position` - a 0-1, 0-1 normalized varying of the vertex. enabled
 *     when varyingPos option is used
 *
 * @param {object} options - refer class description
 * @param {string} options.vertexShader - the source for the vertex shader
 * @param {string} options.fragmentShader - the source for the fragment shader
 * @param {boolean} [options.forceShaderBlend=false] - force the use of shader based blending mode
 * @param {string} [options.oututBlendMode="REPLACE"] - the output blending mode.
 * @param {boolean} [options.dynamicBlend=false] - when set to true, blending mode can be changed
 *     at runtime even after shader compilation
 * @param {boolean} [options.swapFrame=false] - if set then a render target swap is done on the 
 *     framebuffermanager, before rendering. This is used
 *     by programs where the previous rendering need to be
 *     sampled
 * @param {boolean} [options.copyOnSwap=false] - if set to true then on swap, a copyOver is done on
 *     the framebuffermanager. This is used to maintain
 *     consistency during shader based blending in shaders
 *     that do not touch all the pixels
 * @param {boolean} [options.varyingPos=false] - if true then a varying called v_position is added
 *     automatically
 * @param {function} [options.draw ] - override the draw function
 * @memberof Webvs
 * @constructor
 */
function ShaderProgram(options) { 
    options = _.defaults(options, {
        forceShaderBlend: false,
        outputBlendMode: Webvs.REPLACE,
        varyingPos: false,
        dynamicBlend: false,
        swapFrame: false,
        copyOnSwap: false
    });
    var fsrc = [
        "precision mediump float;",
        "uniform vec2 u_resolution;",
        "#define PI "+Math.PI
    ];
    var vsrc = _.clone(fsrc);

    if(_.isFunction(options.draw)) {
        this.draw = options.draw;
    }
    this.copyOnSwap = options.copyOnSwap;
    this.varyingPos = options.varyingPos;
    this.dynamicBlend = options.dynamicBlend;

    // select the blend equation
    this.outputBlendMode = options.outputBlendMode;
    if(options.swapFrame || this.dynamicBlend || options.forceShaderBlend || !_.contains(this.glBlendModes, this.outputBlendMode)) {
        this.swapFrame = true;
        this.glBlendMode = false;
        this.varyingPos = true;
    } else {
        this.swapFrame = false;
        this.glBlendMode = true;
    }

    // varying position and macros
    if(this.varyingPos) {
        fsrc.push("varying vec2 v_position;");
        vsrc.push(
            "varying vec2 v_position;",
            "#define setPosition(pos) (v_position = (((pos)+1.0)/2.0),gl_Position = vec4((pos), 0, 1))"
        );
    } else {
        vsrc.push("#define setPosition(pos) (gl_Position = vec4((pos), 0, 1))");
    }

    // source teture uniform variable and macors
    if(this.swapFrame) {
        vsrc.push(
            "uniform sampler2D u_srcTexture;",
            "#define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))"
        );

        fsrc.push(
            "uniform sampler2D u_srcTexture;",
            "#define getSrcColor() (texture2D(u_srcTexture, v_position))",
            "#define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))"
        );
    }

    // color blend macro/function
    if(this.dynamicBlend) {
        fsrc.push(
            "uniform int u_blendMode;",
            "void setFragColor(vec4 color) {"
        );
        _.each(this.blendEqs, function(eq, mode) {
            fsrc.push(
                "   if(u_blendMode == "+mode+") {",
                "       gl_FragColor = ("+eq+");",
                "   }"
            );
        });
        fsrc.push(
            "}"
        );
    } else {
        var blendEq = this.blendEqs[this.glBlendMode?Webvs.REPLACE:this.outputBlendMode];
        if(_.isUndefined(blendEq)) {
            throw new Error("Blend Mode " + this.outputBlendMode + " not supported");
        }
        fsrc.push("#define setFragColor(color) (gl_FragColor = ("+blendEq+"))");
    }

    this.fragmentSrc = fsrc.join("\n") + "\n" + options.fragmentShader.join("\n");
    this.vertexSrc = vsrc.join("\n") + "\n" + options.vertexShader.join("\n");
    this._locations = {};
    this._textureVars = [];
    this._arrBuffers = {};
}

Webvs.ShaderProgram = Webvs.defineClass(ShaderProgram, Object, {
    // these are blend modes supported with gl.BLEND
    // all other modes have to implemented with shaders
    glBlendModes: [
        Webvs.REPLACE,
        Webvs.AVERAGE,
        Webvs.ADDITIVE,
        Webvs.SUBTRACTIVE1,
        Webvs.SUBTRACTIVE2
    ],

    // the blending formulas to be used inside shaders
    blendEqs: _.object([
        [Webvs.REPLACE, "color"],
        [Webvs.MAXIMUM, "max(color, texture2D(u_srcTexture, v_position))"],
        [Webvs.AVERAGE, "(color+texture2D(u_srcTexture, v_position))/2.0"],
        [Webvs.ADDITIVE, "color+texture2D(u_srcTexture, v_position)"],
        [Webvs.SUBTRACTIVE1, "texture2D(u_srcTexture, v_position)-color"],
        [Webvs.SUBTRACTIVE2, "color-texture2D(u_srcTexture, v_position)"]
    ]),

    /**
     * initializes and compiles the shaders
     * @memberof Webvs.ShaderProgram
     */
	init: function(gl) {
		this.gl = gl;
        try {
            this._compileProgram(this.vertexSrc, this.fragmentSrc);
        } catch(e) {
            throw e;
        }
	},

    /**
     * Sets the output blend mode for this shader
     * @param {Webvs.blendModes} mode - the blending mode
     * @memberof Webvs.ShaderProgram
     */
    setOutputBlendMode: function(mode) {
        this.outputBlendMode = mode;
    },

    /**
     * Runs this shader program
     * @param {Webvs.FrameBufferManager} fm - frame manager. pass null, if no fm is required
     * @param {Webvs.blendModes} outputBlendMode - overrides the blendmode. pass null to use default
     * @param {...any} extraParams - remaining parameters are passed to the draw function
     * @memberof Webvs.ShaderProgram
     */
    run: function(fm, outputBlendMode) {
        var gl = this.gl;
        var oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.useProgram(this.program);

        if(fm) {
            this.setUniform("u_resolution", "2f", fm.width, fm.height);
            if(this.swapFrame) {
                this.setUniform("u_srcTexture", "texture2D", fm.getCurrentTexture());
                fm.swapAttachment();
                if(this.copyOnSwap) {
                    fm.copyOver();
                }
            }
        }

        outputBlendMode = outputBlendMode || this.outputBlendMode;
        if(this.dynamicBlend) {
            this.setUniform("u_blendMode", "1i", outputBlendMode);
        }

        if(this.glBlendMode && outputBlendMode != Webvs.REPLACE) {
            gl.enable(gl.BLEND);
            this._setGlBlendMode(gl, outputBlendMode);
        } else {
            gl.disable(gl.BLEND);
        }

        this.draw.apply(this, _.drop(arguments, 2));

        gl.disable(gl.BLEND);
        gl.useProgram(oldProgram);
    },

    /**
     * Performs the actual drawing and any further bindings and calculations if required.
     * @param {...any} extraParams - the extra parameters passed to {@link Webvs.ShaderProgram.run}
     * @abstract
     * @memberof Webvs.ShaderProgram
     */
    draw: function() {},

    _compileProgram: function(vertexSrc, fragmentSrc) {
        var gl = this.gl;
        var vertex = this._compileShader(vertexSrc, gl.VERTEX_SHADER);
        var fragment = this._compileShader(fragmentSrc, gl.FRAGMENT_SHADER);
        var program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);

        if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error("Program link Error: " + gl.getProgramInfoLog(program));
        }

        this.vertex = vertex;
        this.fragment = fragment;
        this.program = program;
    },

    _compileShader: function(shaderSrc, type) {
        var gl = this.gl;
        var shader = gl.createShader(type);
        gl.shaderSource(shader, shaderSrc);
        gl.compileShader(shader);
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            Webvs.logShaderError(shaderSrc, gl.getShaderInfoLog(shader));
            throw new Error("Shader compilation Error: " + gl.getShaderInfoLog(shader));
        }
        return shader;
    },

    _setGlBlendMode: function(gl, mode) {
        switch(mode) {
            case Webvs.ADDITIVE:
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case Webvs.SUBTRACTIVE1:
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
                break;
            case Webvs.SUBTRACTIVE2:
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_SUBTRACT);
                break;
            case Webvs.AVERAGE:
                gl.blendColor(0.5, 0.5, 0.5, 1);
                gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            default: throw new Error("Invalid blend mode");
        }
    },

    /**
     * returns the location of a uniform or attribute. locations are cached.
     * @param {string} name - name of the variable
     * @param {boolean} [attrib] - pass true if variable is attribute
     * @returns {location}
     * @memberof Webvs.ShaderProgram
     */
    getLocation: function(name, attrib) {
        var location = this._locations[name];
        if(_.isUndefined(location)) {
            if(attrib) {
                location = this.gl.getAttribLocation(this.program, name);
            } else {
                location = this.gl.getUniformLocation(this.program, name);
            }
            this._locations[name] = location;
        }
        return location;
    },

    /**
     * returns the index of a texture. assigns id if not already assigned.
     * @param {string} name - name of the varaible
     * @returns {number} index of the texture
     * @memberof Webvs.ShaderProgram
     */
    getTextureId: function(name) {
        var id = _.indexOf(this._textureVars, name);
        if(id === -1) {
            this._textureVars.push(name);
            id = this._textureVars.length-1;
        }
        return id;
    },

    /**
     * binds value of a uniform variable in this program
     * @param {string} name - name of the variable
     * @param {string} type - type of the variable (texture2D, [1234]f, [1234]i, [1234]fv, [1234]iv)
     * @param {...any} values - values to be assigned
     * @memberof Webvs.ShaderProgram
     */
    setUniform: function(name, type, value) {
        var location = this.getLocation(name);
        var gl = this.gl;
        switch(type) {
            case "texture2D":
                var id = this.getTextureId(name);
                gl.activeTexture(gl["TEXTURE"+id]);
                gl.bindTexture(gl.TEXTURE_2D, value);
                gl.uniform1i(location, id);
                break;
            case "1f": case "2f": case "3f": case "4f":
            case "1i": case "2i": case "3i": case "4i":
                var args = [location].concat(_.drop(arguments, 2));
                gl["uniform" + type].apply(gl, args);
                break;
            case "1fv": case "2fv": case "3fv": case "4fv":
            case "1iv": case "2iv": case "3iv": case "4iv":
                gl["uniform" + type].apply(gl, location, value);
                break;
        }
    },

    /**
     * binds the vertex attribute array
     * @param {string} name - name of the variable
     * @param {Array} array - array of vertex data
     * @param {number} [size=2] - size of each item
     * @param [type=gl.FLOAT]
     * @param [normalized=false]
     * @param [stride=0]
     * @param [offset=0]
     * @memberof Webvs.ShaderProgram
     */
    setVertexAttribArray: function(name, array, size, type, normalized, stride, offset) {
        var gl = this.gl;
        size = size || 2;
        type = type || gl.FLOAT;
        normalized = normalized || false;
        stride = stride || 0;
        offset = offset || 0;

        var buffer = this._arrBuffers[name];
        if(_.isUndefined(buffer)) {
            buffer = gl.createBuffer();
            this._arrBuffers[name] = buffer;
        }
        var location = this.getLocation(name, true);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
    },

    setElementArray: function(array) {
        var gl = this.gl;

        var buffer = this._arrBuffers.__indexBuffer;
        if(_.isUndefined(buffer)) {
            buffer = gl.createBuffer();
            this._arrBuffers.__indexBuffer = buffer;
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, gl.STATIC_DRAW);
    },

    /**
     * destroys webgl resources consumed by this program.
     * call in component destroy
     * @memberof Webvs.ShaderProgram
     */
    cleanup: function() {
        var gl = this.gl;
        _.each(this._buffers, function(buffer) {
            gl.deleteBuffer(buffer);
        }, this);
        gl.deleteProgram(this.program);
        gl.deleteShader(this.vertexShader);
        gl.deleteShader(this.fragmentShader);
    },

});


})(Webvs);
