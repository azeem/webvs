/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

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
Webvs.ShaderComponent = Webvs.defineClass(ShaderComponent, Webvs.Component, {
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

})(Webvs);
