/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

/**
 * Main Webvs class
 * @param options
 * @constructor
 */
function Webvs(options) {
    checkRequiredOptions(options, ["canvas", "analyser"]);
    this.canvas = options.canvas;
    this.analyser = options.analyser;

    this._initGl();
}
extend(Webvs, Object, {
    _initGl: function() {
        try {
            this.gl = this.canvas.getContext("experimental-webgl");
            this.resolution = {
                width: this.canvas.width,
                height: this.canvas.height
            };
        } catch(e) {
            throw new Error("Couldnt get webgl context" + e);
        }
    },

    /**
     * Loads a preset JSON
     * @param preset JSON representation of the preset
     */
    loadPreset: function(preset) {
        this.preset = preset;
        this.stop();
        if(this.rootComponent) {
            this.rootComponent.destroyComponent();
        }
        this.rootComponent = new EffectList(preset);
    },

    /**
     * Reset all the components, call this when canvas
     * dimensions changes
     */
    resetCanvas: function() {
        this.stop();
        if(this.rootComponent) {
            this.rootComponent.destroyComponent();
            this.rootComponent = null;
        }
        this._initGl();
        if(this.preset) {
            this.rootComponent = new EffectList(this.preset);
        }
    },

    /**
     * Starts the animation
     */
    start: function() {
        if(!this.rootComponent) {
            return; // no preset loaded yet. cannot start!
        }

        var rootComponent = this.rootComponent;
        var promise = rootComponent.initComponent(this.gl, this.resolution, this.analyser);

        var _this = this;
        var drawFrame = function() {
            if(_this.analyser.isPlaying()) {
                rootComponent.updateComponent();
            }
            _this.animReqId = requestAnimationFrame(drawFrame);
        };

        // start rendering when the promise is  done
        promise.then(function() {
            _this.animReqId = requestAnimationFrame(drawFrame);
        });
    },

    /**
     * Stops the animation
     */
    stop: function() {
        if(typeof this.animReqId !== "undefined") {
            cancelAnimationFrame(this.animReqId);
        }
    }
});

/**
 * Components base class.
 * @constructor
 */
function Component() {}
extend(Component, Object, {
    /**
     * this determines whether current render target should be swapped out
     * before updating this component. if set to true then the updateComponent
     * call will receive swapped out texture. Used when current rendering
     * depends on what has been rendered so far
     */
    swapFrame: false,

    /**
     * Initialize component. Called once before animation starts
     * @param gl
     * @param resolution
     * @param analyser
     */
    initComponent: function(gl, resolution, analyser) {
        this.gl = gl;
        this.resolution = resolution;
        this.analyser = analyser;
    },

    /**
     * Render a frame. Called once for every frame
     */
    updateComponent: function() {},

    /**
     * Release any Webgl resources. Called during
     * reinitialization
     */
    destroyComponent: function() {}
});


/**
 * ShaderComponent base class. Any Component that
 * has shader code, extends from this. A uniform containing
 * frame resolution is bound automatically.
 *
 * @param vertexSrc   glsl code for vertex shader
 * @param fragmentSrc glsl code for fragment shader
 * @constructor
 */
function ShaderComponent(vertexSrc, fragmentSrc) {
    this.vertexSrc = vertexSrc;
    this.fragmentSrc = fragmentSrc;
}
extend(ShaderComponent, Component, {
    swapFrame: false,

    initComponent: function(gl, resolution, analyser) {
        ShaderComponent.super.initComponent.call(this, gl, resolution, analyser);
        this._compileProgram(this.vertexSrc, this.fragmentSrc);
        this.resolutionLocation = this.gl.getUniformLocation(this.program, "u_resolution");
        this.init();
    },

    updateComponent: function() {
        ShaderComponent.super.updateComponent.apply(this, arguments);
        this.gl.uniform2f(this.resolutionLocation, this.resolution.width, this.resolution.height);
        this.update.apply(this, arguments);
    },

    destroyComponent: function() {
        var gl = this.gl;
        gl.deleteShader(this.vertex);
        gl.deleteShader(this.fragment);
        gl.deleteProgram(this.program);
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

    /**
     * Override and implement initialization
     */
    init: function() {},

    /**
     * Called for updating the frame. override and implement updating code.
     * @param texture texture containing what is rendered so far.
     *                passed only if swapFrame is true
     */
    update: function(texture) {}
});

/**
 * Trans component base class. This component has a
 * fixed vertex shader that draws a frame sized quad.
 * the shaders get a uniform sampler2D u_curRender
 * containing the swapped out frame
 *
 * @param fragmentSrc
 * @constructor
 */
function Trans(fragmentSrc) {
    var vertexSrc = [
        "attribute vec2 a_texCoord;",
        "varying vec2 v_texCoord;",
        "void main() {",
        "    v_texCoord = a_texCoord;",
        "    gl_Position = vec4((a_texCoord*2.0)-1.0, 0, 1);",
        "}"
    ].join("\n");
    Trans.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(Trans, ShaderComponent, {
    swapFrame: true,

    destroyComponent: function() {
        Trans.super.destroyComponent.call(this);
        var gl = this.gl;

        gl.deleteBuffer(this.texCoordBuffer);
    },

    init: function() {
        var gl = this.gl;
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                0.0,  0.0,
                1.0,  0.0,
                0.0,  1.0,
                0.0,  1.0,
                1.0,  0.0,
                1.0,  1.0
            ]),
            gl.STATIC_DRAW
        );

        this.vertexPositionLocation = gl.getAttribLocation(this.program, "a_texCoord");
        this.curRenderLocation = gl.getUniformLocation(this.program, "u_curRender");
    },

    update: function(texture) {
        var gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.curRenderLocation, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.vertexPositionLocation);
        gl.vertexAttribPointer(this.vertexPositionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
});

// Webvs constants
var blendModes = {
    REPLACE: 1,
    MAXIMUM: 2,
    ADDITIVE: 3
};

function setBlendMode(gl, mode) {
    switch(mode) {
        case blendModes.BLEND_REPLACE:
            gl.blendFunc(gl.ONE, gl.ZERO);
            gl.blendEquation(gl.FUNC_ADD);
            break;
        case blendModes.BLEND_MAXIMUM:
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.blendEquation(gl.MAX);
            break;
        default: throw new Error("Invalid blend mode");
    }
}

window.Webvs = Webvs;