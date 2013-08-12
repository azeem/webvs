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
    options = _.defaults(options, {
        showStat: false
    });
    this.canvas = options.canvas;
    this.analyser = options.analyser;
    if(options.showStat) {
        var stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.right = '5px';
        stats.domElement.style.bottom = '5px';
        document.body.appendChild(stats.domElement);
        this.stats = stats;
    }
    this._initGl();
}
extend(Webvs, Object, {
    _initGl: function() {
        try {
            this.gl = this.canvas.getContext("experimental-webgl", {alpha: false});
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
        var newRoot = new EffectList(preset);
        this.stop();
        this.preset = preset;
        if(this.rootComponent) {
            this.rootComponent.destroyComponent();
        }
        this.rootComponent = newRoot;
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

        this.registerBank = {};
        var rootComponent = this.rootComponent;
        var bootTime = (new Date()).getTime();
        var promise = rootComponent.initComponent(this.gl, this.resolution, this.analyser, this.registerBank, bootTime);

        var _this = this;
        var drawFrame = function() {
            if(_this.analyser.isPlaying()) {
                rootComponent.updateComponent();
            }
            _this.animReqId = requestAnimationFrame(drawFrame);
        };

        // wrap drawframe in stats collection if required
        if(this.stats) {
            var oldDrawFrame = drawFrame;
            drawFrame = function() {
                _this.stats.begin();
                oldDrawFrame.call(this, arguments);
                _this.stats.end();
            };
        }

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

Webvs.ui = {
    leaf: false,
    disp: "Main",
    schema: {
        name: {
            type: "string",
            title: "Name"
        },
        author: {
            type: "string",
            title: "Author"
        },
        description: {
            type: "string",
            title: "Description"
        },
        clearFrame: {
            type: "boolean",
            title: "Clear every frame",
            default: false,
            required: true
        }
    },
    form: [
        "clearFrame",
        "name",
        "author",
        { key: "description", type: "textarea" }
    ]
};

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
    initComponent: function(gl, resolution, analyser, registerBank, bootTime) {
        this.gl = gl;
        this.resolution = resolution;
        this.analyser = analyser;
        this.registerBank = registerBank;
        this.bootTime = bootTime;
    },

    /**
     * Render a frame. Called once for every frame
     */
    updateComponent: function() {},

    /**
     * Release any Webgl resources. Called during
     * reinitialization
     */
    destroyComponent: function() {},

    getIdString: function() {
        if(!_.isUndefined(this.parent) && !_.isUndefined(this.id)) {
            return this.parent.getIdString() + "/" + this.componentName + "#" + this.id;
        } else {
            return this.componentName + "#Main";
        }
    }
});


// Webvs constants
var blendModes = {
    REPLACE: 1,
    MAXIMUM: 2,
    AVERAGE: 3,
    ADDITIVE: 4,
    SUBTRACTIVE1: 5,
    SUBTRACTIVE2: 6
};

function setBlendMode(gl, mode) {
    switch(mode) {
        case blendModes.ADDITIVE:
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.blendEquation(gl.FUNC_ADD);
            break;
        case blendModes.SUBTRACTIVE1:
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
            break;
        case blendModes.SUBTRACTIVE2:
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.blendEquation(gl.FUNC_SUBTRACT);
            break;
        case blendModes.AVERAGE:
            gl.blendColor(0.5, 0.5, 0.5, 1);
            gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);
            gl.blendEquation(gl.FUNC_ADD);
            break;
        default: throw new Error("Invalid blend mode");
    }
}

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

    var fragmentExtraSrc = ["precision mediump float;", "uniform vec2 u_resolution;"];
    var vertexExtraSrc= ["precision mediump float;", "uniform vec2 u_resolution;"];

    var blendEq = "color";

    if(this.swapFrame || this.forceShaderBlend || !_.contains(this.glBlendModes, this.outputBlendMode)) {
        // shader based blending: used for components with swapFrame=true
        // or for blends not supported with gl BlendMode
        this._glBlendMode = false;
        this.swapFrame = true;

        switch(this.outputBlendMode) {
            case blendModes.REPLACE:
                blendEq = "color";
                break;
            case blendModes.MAXIMUM:
                blendEq = "max(color, texture2D(u_srcTexture, v_position))";
                break;
            case blendModes.AVERAGE:
                blendEq = "(color+texture2D(u_srcTexture, v_position))/2.0";
                break;
            case blendModes.ADDITIVE:
                blendEq = "color+texture2D(u_srcTexture, v_position)";
                break;
            case blendModes.SUBTRACTIVE1:
                blendEq = "texture2D(u_srcTexture, v_position)-color";
                break;
            case blendModes.SUBTRACTIVE2:
                blendEq = "color-texture2D(u_srcTexture, v_position)";
                break;
            default:
                throw new Error("Blend Mode "+this.outputBlendMode+" not supported");
        }
    } else {
        this._glBlendMode = true;
    }

    // color blend macro
    fragmentExtraSrc.push("#define setFragColor(color) (gl_FragColor = ("+blendEq+"))");

    // insert varying position variable and macros
    if(this.swapFrame || this.varyingPos) {
        fragmentExtraSrc.push("varying vec2 v_position;");
        vertexExtraSrc.push("varying vec2 v_position;");
        vertexExtraSrc.push("#define setPosition(pos) (v_position = (((pos)+1.0)/2.0),gl_Position = vec4((pos), 0, 1))");
    } else {
        vertexExtraSrc.push("#define setPosition(pos) (gl_Position = vec4((pos), 0, 1))");
    }

    // insert srctexture uniform variable and macros
    if(this.swapFrame) {
        vertexExtraSrc.push("uniform sampler2D u_srcTexture;");
        vertexExtraSrc.push("#define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))");

        fragmentExtraSrc.push("uniform sampler2D u_srcTexture;");
        fragmentExtraSrc.push("#define getSrcColor() (texture2D(u_srcTexture, v_position))");
        fragmentExtraSrc.push("#define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))");
    }

    this.fragmentSrc = fragmentExtraSrc.join("\n") + "\n" + fragmentSrc;
    this.vertexSrc = vertexExtraSrc.join("\n") + "\n" + vertexSrc;
}
extend(ShaderComponent, Component, {
    swapFrame: false,
    outputBlendMode: blendModes.REPLACE,
    forceShaderBlend: false,
    varyingPos: false,
    copyOnSwap: false,
    glBlendModes: [blendModes.REPLACE, blendModes.AVERAGE, blendModes.ADDITIVE, blendModes.SUBTRACTIVE1, blendModes.SUBTRACTIVE2],

    initComponent: function(gl, resolution, analyser, registerBank) {
        ShaderComponent.super.initComponent.call(this, gl, resolution, analyser, registerBank);
        try {
            this._compileProgram(this.vertexSrc, this.fragmentSrc);
        } catch(e) {
            console.log("Shader Compilation error:");
            console.log("Vertex Shader:\n"+this.vertexSrc);
            console.log("Fragment Shader:\n"+this.fragmentSrc);
            throw e;
        }
        this.resolutionLocation = this.gl.getUniformLocation(this.program, "u_resolution");
        this.srcTextureLocation = this.gl.getUniformLocation(this.program, "u_srcTexture");
        this.init();
    },

    updateComponent: function(texture) {
        ShaderComponent.super.updateComponent.apply(this, arguments);
        var gl = this.gl;
        gl.useProgram(this.program);
        gl.uniform2f(this.resolutionLocation, this.resolution.width, this.resolution.height);
        if(this.swapFrame && texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(this.srcTextureLocation, 0);
        }

        if(this._glBlendMode && this.outputBlendMode != blendModes.REPLACE){
            gl.enable(gl.BLEND);
            setBlendMode(gl, this.outputBlendMode);
        } else {
            gl.disable(gl.BLEND);
        }
        this.update.apply(this, arguments);
        gl.disable(gl.BLEND);
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
 * QuadBoxComponent component base class. This component has a
 * fixed vertex shader that draws a frame sized quad.
 *
 * @param fragmentSrc
 * @constructor
 */
function QuadBoxComponent(fragmentSrc) {
    var vertexSrc = [
        "attribute vec2 a_position;",
        "void main() {",
        "   setPosition(a_position);",
        "}"
    ].join("\n");
    QuadBoxComponent.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(QuadBoxComponent, ShaderComponent, {
    varyingPos: true,

    destroyComponent: function() {
        QuadBoxComponent.super.destroyComponent.call(this);
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
                -1,  -1,
                1,  -1,
                -1,  1,
                -1,  1,
                1,  -1,
                1,  1
            ]),
            gl.STATIC_DRAW
        );

        this.vertexPositionLocation = gl.getAttribLocation(this.program, "a_position");
    },

    update: function(texture) {
        var gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.vertexPositionLocation);
        gl.vertexAttribPointer(this.vertexPositionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
});

window.Webvs = Webvs;
window.Webvs.Component = Component;
