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
    //this.loadPreset({clearFrame:true, components: []});
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

    loadPreset: function(preset) {
        this.preset = preset;
        this.stop();
        if(this.rootComponent) {
            this.rootComponent.destroyComponent();
        }
        this.rootComponent = new EffectList(preset);
    },

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

    stop: function() {
        if(typeof this.animReqId !== "undefined") {
            cancelAnimationFrame(this.animReqId);
        }
    }
});

function Component() {}
extend(Component, Object, {
    initComponent: function(gl, resolution, analyser) {
        this.gl = gl;
        this.resolution = resolution;
        this.analyser = analyser;
    },
    updateComponent: function() {},
    destroyComponent: function() {}
});

/**
 * ShaderComponent base class
 * @param gl gl context
 * @param resolution resolution of the canvas
 * @param options
 * @constructor
 */
function ShaderComponent(vertexSrc, fragmentSrc) {
    this.vertexSrc = vertexSrc;
    this.fragmentSrc = fragmentSrc;
}
extend(ShaderComponent, Component, {
    swapFrame: false,

    /**
     * Initialize the component. Called once before animation starts
     */
    initComponent: function(gl, resolution, analyser) {
        ShaderComponent.super.initComponent.call(this, gl, resolution, analyser);
        this._compileProgram(this.vertexSrc, this.fragmentSrc);
        this.resolutionLocation = this.gl.getUniformLocation(this.program, "u_resolution");
        this.init();
    },

    /**
     * Update the screen. Called for every frame of the animation
     */
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
    }
});

/**
 * Trans component base class
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
var constants = {
    REPLACE: 1,
    MAXIMUM: 2,
    ADDITIVE: 3
};

//put all constants into the global variable
for(var key in constants) {
    Webvs[key] = constants[key];
}

function setBlendMode(gl, mode) {
    switch(mode) {
        case constants.BLEND_REPLACE:
            gl.blendFunc(gl.ONE, gl.ZERO);
            gl.blendEquation(gl.FUNC_ADD);
            break;
        case constants.BLEND_MAXIMUM:
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.blendEquation(gl.MAX);
            break;
        default: throw new Error("Invalid blend mode");
    }
}
Webvs.rand = rand;
window.Webvs = Webvs;