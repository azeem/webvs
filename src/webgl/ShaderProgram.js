/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function Buffer(gl, isElemArray, data, arrayType) {
    this.type = isElemArray?gl.ELEMENT_ARRAY_BUFFER:gl.ARRAY_BUFFER;
    this.gl = gl;
    this.glBuffer = gl.createBuffer();
    this.length = 0;
    if(data) {
        this.setData(data);
    }
}
Webvs.Buffer = Webvs.defineClass(Buffer, Object, {
    setData: function(array) {
        if(!Webvs.isTypedArray(array)) {
            array = new Float32Array(array);
        }
        this.length = array.length;
        this.gl.bindBuffer(this.type, this.glBuffer);
        this.gl.bufferData(this.type, array, this.gl.STATIC_DRAW);
    },

    destroy: function() {
        this.gl.deleteBuffer(this.glBuffer);
    }
});

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
function ShaderProgram(gl, opts) {
    opts = _.defaults(opts, {
        blendMode: Webvs.REPLACE,
        swapFrame: false,
        copyOnSwap: false,
        dynamicBlend: false,
        blendValue: 0.5
    });

    var vsrc = [
        "precision mediump float;",
        "varying vec2 v_position;",
        "uniform vec2 u_resolution;",
        "uniform sampler2D u_srcTexture;",

        "#define PI "+Math.PI,
        "#define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))",
        "#define setPosition(pos) (v_position = (((pos)+1.0)/2.0),gl_Position = vec4((pos), 0, 1))",
        "#define setPosition4(pos) (v_position = (((pos).xy+1.0)/2.0),gl_Position = (pos))"
    ];

    var fsrc = [
        "precision mediump float;",
        "varying vec2 v_position;",
        "uniform vec2 u_resolution;",
        "uniform sampler2D u_srcTexture;",

        "#define PI "+Math.PI,
        "#define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))",
        "#define getSrcColor() (texture2D(u_srcTexture, v_position))"
    ];

    this.gl = gl;
    this.swapFrame = opts.swapFrame;
    this.copyOnSwap = opts.copyOnSwap;
    this.blendValue = opts.blendValue;
    this.blendMode = opts.blendMode;
    this.dynamicBlend = opts.dynamicBlend;

    if(this.dynamicBlend) {
        fsrc.push(
            "uniform int u_blendMode;",
            "void setFragColor(vec4 color) {"
        );
        _.each(ShaderProgram.shaderBlendEq, function(eq, mode) {
            fsrc.push(
                "   if(u_blendMode == "+mode+") {",
                "       gl_FragColor = ("+eq+");",
                "   }",
                "   else"
            );
        }, this);
        fsrc.push(
            "   {",
            "       gl_FragColor = color;",
            "   }",
            "}"
        );
    } else {
        if(this._isShaderBlend(this.blendMode)) {
            var eq = ShaderProgram.shaderBlendEq[this.blendMode];
            fsrc.push("#define setFragColor(color) (gl_FragColor = ("+eq+"))");
        } else {
            fsrc.push("#define setFragColor(color) (gl_FragColor = color)");
        }
    }

    var fragmentShader = opts.fragmentShader;
    var vertexShader = opts.vertexShader;
    fragmentShader = _.isArray(fragmentShader)?(fragmentShader.join("\n")):fragmentShader;
    vertexShader = _.isArray(vertexShader)?(vertexShader.join("\n")):vertexShader;

    this.fragmentSrc = fsrc.join("\n") + "\n" + fragmentShader;
    this.vertexSrc = vsrc.join("\n") + "\n" + vertexShader;
    this._locations = {};
    this._textureVars = [];
    this._arrBuffers = {};
    this._enabledAttribs = [];

    this._compile();
    this.init();
}

// these are blend modes not supported with gl.BLEND
// and the formula to be used inside shader
ShaderProgram.shaderBlendEq = _.object([
    [Webvs.MAXIMUM, "max(color, texture2D(u_srcTexture, v_position))"],
    [Webvs.MULTIPLY, "clamp(color * texture2D(u_srcTexture, v_position) * 256.0, 0.0, 1.0)"]
]);

Webvs.ShaderProgram = Webvs.defineClass(ShaderProgram, Object, {
    _isShaderBlend: function(mode) {
        return (mode in ShaderProgram.shaderBlendEq);
    },

    _compile: function() {
        var gl = this.gl;
        var vertex = this._compileShader(this.vertexSrc, gl.VERTEX_SHADER);
        var fragment = this._compileShader(this.fragmentSrc, gl.FRAGMENT_SHADER);
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

    init: function() {},

    // Performs the actual drawing and any further bindings and calculations if required.
    draw: function() {
        throw new Error("draw not implemented");
    },

    // Runs this shader program
    run: function(fm, blendMode) {
        var i;
        var gl = this.gl;
        var oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.useProgram(this.program);

        if(blendMode && !this.dynamicBlend) {
            throw new Error("Cannot set blendmode at runtime. Use dynamicBlend");
        }
        blendMode = blendMode || this.blendMode;

        if(fm) {
            this.setUniform("u_resolution", "2f", gl.drawingBufferWidth, gl.drawingBufferHeight);
            if(this.swapFrame || this._isShaderBlend(blendMode)) {
                this.setUniform("u_srcTexture", "texture2D", fm.getCurrentTexture());
                fm.switchTexture();
                if(this.copyOnSwap) {
                    fm.copyOver();
                }
            } else if(this.dynamicBlend) {
                this.setUniform("u_srcTexture", "texture2D", null);
            }
        }

        if(this.dynamicBlend) {
            this.setUniform("u_blendMode", "1i", blendMode);
        }

        this._setGlBlendMode(blendMode);
        this.draw.apply(this, _.drop(arguments, 2));
        // disable all enabled attributes
        while(this._enabledAttribs.length) {
            gl.disableVertexAttribArray(this._enabledAttribs.shift());
        }
        gl.disable(gl.BLEND);
        gl.useProgram(oldProgram);
    },

    _setGlBlendMode: function(mode) {
        var gl = this.gl;
        switch(mode) {
            case Webvs.ADDITIVE:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case Webvs.SUBTRACTIVE1:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
                break;
            case Webvs.SUBTRACTIVE2:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_SUBTRACT);
                break;
            case Webvs.ALPHA:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case Webvs.MULTIPLY2:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.DST_COLOR, gl.ZERO);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case Webvs.ADJUSTABLE:
                gl.enable(gl.BLEND);
                gl.blendColor(0, 0, 0, this.blendValue);
                gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case Webvs.AVERAGE:
                gl.enable(gl.BLEND);
                gl.blendColor(0.5, 0.5, 0.5, 1);
                gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            // shader blending cases
            case Webvs.REPLACE:
            case Webvs.MULTIPLY:
            case Webvs.MAXIMUM:
                gl.disable(gl.BLEND);
                break;
            default:
                throw new Error("Unknown blend mode " + mode + " in shader");
        }
    },

    // returns the location of a uniform or attribute. locations are cached.
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

    // returns the index of a texture. assigns id if not already assigned.
    getTextureId: function(name) {
        var id = _.indexOf(this._textureVars, name);
        if(id === -1) {
            this._textureVars.push(name);
            id = this._textureVars.length-1;
        }
        return id;
    },

    // binds value of a uniform variable in this program
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
                gl["uniform" + type].apply(gl, [location].concat(_.rest(arguments, 2)));
                break;
            case "1fv": case "2fv": case "3fv": case "4fv":
            case "1iv": case "2iv": case "3iv": case "4iv":
                if(!(value instanceof Float32Array)) {
                    value = new Float32Array(value);
                }
                gl["uniform" + type].call(gl, location, value);
                break;
            case "Matrix2fv": case "Matrix3fv": case "Matrix4fv":
                var transpose = arguments[2];
                value = arguments[3];
                gl["uniform" + type].call(gl, location, transpose, value);
                break;
        }
    },

    setIndex: function(buffer) {
        var gl = this.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.glBuffer);
    },

    setAttrib: function(name, buffer, size, type, normalized, stride, offset) {
        var gl = this.gl;
        size = size || 2;
        type = type || gl.FLOAT;
        normalized = normalized || false;
        stride = stride || 0;
        offset = offset || 0;

        var location = this.getLocation(name, true);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.glBuffer);
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
        gl.enableVertexAttribArray(location);
        this._enabledAttribs.push(location);
    },

    disableAttrib: function(name) {
        var location = this.getLocation(name, true);
        this.gl.disableVertexAttribArray(location);
    },

    // destroys webgl resources consumed by this program.
    // call in component destroy
    destroy: function() {
        var gl = this.gl;
        gl.deleteProgram(this.program);
        gl.deleteShader(this.vertexShader);
        gl.deleteShader(this.fragmentShader);
    }

});

})(Webvs);
