/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * Webgl Shader program abstraction
 * with support for blended output and stuff
 *
 * vertexSrc - the source for the vertex shader
 * fragmentSrc - the source for the fragment shader
 * fm - the frame manager
 * forceShaderBlend - force the use of shader based blending mode
 * oututBlendMode - the output blending mode
 * varyingPos - if true then a varying called v_position is added
 *              automatically
 */
function ShaderProgram(options) { 
    options = _.defaults(options, {
        forceShaderBlend: false,
        outputBlendMode: Webvs.REPLACE,
        varyingPos: false,
        dynamicBlend: false,
        swapFrame: false
    });
    var fsrc = [
        "precision mediump float;",
        "uniform vec2 u_resolution;"
    ];
    var vsrc = _.clone(fragmentExtraSrc);

    this.fm = options.fm;
    this.varyingPos = options.varyingPos;
    this.swapFrame = options.swapFrame;
    this.dynamicBlend = options.dynamicBlend;

    // select the blend equation
    this.outputBlendMode = options.outputBlendMode;
    if(this.dynamicBlend || options.forceShaderBlend || !_.contains(this.glBlendModes, this.outputBlendMode)) {
        this.swapFrame = true;
        this.glBlendMode = false;
        this.varyingPos = true;
    } else {
        this.glBlendMode = true;
    }

    // color blend macro/function
    if(this.dynamicBlend) {
        fsrc.push(
            "uniform int u_blendMode;",
            "void setFragColor(vec3 color) {",
            "   switch(u_blendMode) {"
        );
        _.each(this.blendEqs, function(eq, mode) {
            fsrc.push("case " + mode + ":gl_FragColor = ("+blendEq+"); break;");
        });
        fsrc.push(
            "   }",
            "}"
        );
    } else {
        var blendEq = this.blendEqs[this.outputBlendMode];
        if(_.isUndefined(blendEq)) {
            throw new Error("Blend Mode " + this.outputBlendMode + " not supported");
        }
        fsrc.push("#define setFragColor(color) (gl_FragColor = ("+blendEq+"))");
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

    this.fragmentSrc = options.fragmentSrc.join("\n") + "\n" + fragmentSrc;
    this.vertexSrc = options.vertexSrc.join("\n") + "\n" + vertexSrc;
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

    blendEqs: _.object(
        [Webvs.REPLACE, "color"],
        [Webvs.MAXIMUM, "max(color, texture2D(u_srcTexture, v_position))"],
        [Webvs.AVERAGE, "(color+texture2D(u_srcTexture, v_position))/2.0"],
        [Webvs.ADDITIVE, "color+texture2D(u_srcTexture, v_position)"],
        [Webvs.SUBTRACTIVE1, "texture2D(u_srcTexture, v_position)-color"],
        [Webvs.SUBTRACTIVE2, "color-texture2D(u_srcTexture, v_position)"]
    ),

	init: function(gl) {
		this.gl = gl;
        try {
            this._compileProgram(this.vertexSrc, this.fragmentSrc);
        } catch(e) {
            console.log("Shader Compilation error:");
            console.log("Vertex Shader:\n"+this.vertexSrc);
            console.log("Fragment Shader:\n"+this.fragmentSrc);
            throw e;
        }
	},

    setOutputBlendMode: function(mode) {
        this.outputBlendMode = mode;
    },

    run: function() {
        var gl = this.gl;

        this.setUniform("u_resolution", "2f", this.fm.width, this.fm.height);
        if(this.swapFrame) {
            this.setUniform("u_srcTexture", "texture2D", this.fm.getCurrentTexture());
            if(this.copyOnSwap) {
                this.fm.copyCurrentTexture();
            }
            this.fm.swapTexture();
        }

        if(this.dynamicBlend) {
            this.setUniform("u_blendMode", "1i", this.outputBlendMode);
        }

        if(this.glBlendMode && this.outputBlendMode != Webvs.REPLACE) {
            gl.enable(gl.BLEND);
            this._setGlBlendMode(gl, this.outputBlendMode);
        } else {
            gl.disable(gl.BLEND);
        }

        var oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.useProgram(this.program);
        gl.drawArrays.apply(gl, arguments);
        gl.disable(gl.BLEND);
        gl.useProgram(oldProgram);
    },

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
            throw new Error("Shader compilation Error: " + gl.getShaderInfoLog(shader));
        }
        return shader;
    },

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

    getTextureId: function(name) {
        var id = _.indexOf(this._textureVars, name);
        if(id === -1) {
            this._textureVars.push(name);
            id = this._textureVars.length-1;
        }
        return id;
    },

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
                gl["uniform" + type].apply(gl, value);
                break;
        }
    },

    setVertexAttribArray: function(name, array) {
        var gl = this.gl;
        var buffer = this._arrBuffers[name];
        if(_.isUndefined(buffer)) {
            buffer = gl.createBuffer();
            this._arrBuffers[name] = buffer;
        }
        var location = this.getLocation(name, true);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer.apply(gl, [location].concat(_.drop(arguments, 2)));
    },

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
