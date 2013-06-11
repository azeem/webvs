/**
 * Main Webvs class
 * @param options
 * @constructor
 */
function Webvs(options) {
    checkRequiredOptions(options, ["canvas", "components"]);
    this.canvas = options.canvas;
    this.components = options.components;

    this._initGl();
    this._initFrameBuffer();
}
extend(Webvs, Object, {
    _initGl: function() {
        try {
            this.gl = this.canvas.getContext("experimental-webgl");
            this.resolution = {
                width: this.canvas.width,
                height: this.canvas.height
            };
            this.canvas.addEventListener("webglcontextlost", function(event) {
                console.log("Webvs: lost webgl context");
            });
        } catch(e) {
            throw new Error("Couldnt get webgl context");
        }
    },
    _initFrameBuffer: function() {
        var gl = this.gl;
        var framebuffer = gl.createFramebuffer();
        var attachments = [];
        for(var i = 0;i < 2;i++) {
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.resolution.width, this.resolution.height,
                          0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            var renderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.resolution.width, this.resolution.height);

            attachments[i] = {
                texture: texture,
                renderbuffer: renderbuffer
            };
        }
        this.framebuffer = framebuffer;
        this.frameAttachments = attachments;
        this.currAttachment = 0;
    },

    _setFBAttachment: function() {
        var gl = this.gl;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frameAttachments[this.currAttachment].texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.frameAttachments[this.currAttachment].renderbuffer);
    },

    _getCurrentTextrue: function() {
        return this.frameAttachments[this.currAttachment].texture;
    },

    _swapFBAttachment: function() {
        this.currAttachment = (this.currAttachment + 1) % 2;
        this._setFBAttachment();
    },

    /**
     * Starts the animation
     */
    start: function() {
        var gl = this.gl;
        var components = this.components;
        var copyComponent = new Copy();

        // initialize all the components
        var initPromises = [];
        for(var i = 0;i < components.length;i++) {
            var res = components[i].initComponent(gl, this.resolution);
            if(res) {
                initPromises.push(res);
            }
        }
        copyComponent.initComponent(gl, this.resolution);

        var self = this;
        var drawFrame = function() {
            // draw everything the temporary framebuffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, self.framebuffer);
            gl.viewport(0, 0, self.resolution.width, self.resolution.height);
            self._setFBAttachment();

            gl.clear(gl.COLOR_BUFFER_BIT);

            for(var i = 0;i < components.length;i++) {
                var component = components[i];
                gl.useProgram(component.program);
                if(component.swapFrame) {
                    var oldTexture = self._getCurrentTextrue();
                    self._swapFBAttachment();
                    component.updateComponent(oldTexture);
                } else {
                    component.updateComponent();
                }
            }

            // flip and copy the current texture to the screen
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.useProgram(copyComponent.program);
            gl.viewport(0, 0, self.resolution.width, self.resolution.height);
            copyComponent.updateComponent(self.frameAttachments[self.currAttachment].texture);

            requestAnimationFrame(drawFrame);
        };

        // start rendering when all the init promises are done
        D.all(initPromises).then(function() {
            requestAnimationFrame(drawFrame);
        });
    }
});

/**
 * Component base class
 * @param gl gl context
 * @param resolution resolution of the canvas
 * @param options
 * @constructor
 */
function Component(vertexSrc, fragmentSrc) {
    this.vertexSrc = vertexSrc;
    this.fragmentSrc = fragmentSrc;
}
extend(Component, Object, {
    swapFrame: false,

    /**
     * Initialize the component. Called once before animation starts
     */
    initComponent: function(gl, resolution) {
        this.gl = gl;
        this.resolution = resolution;
        this._compileProgram(this.vertexSrc, this.fragmentSrc);
        this.resolutionLocation = this.gl.getUniformLocation(this.program, "u_resolution");
        this.init();
    },

    /**
     * Update the screen. Called for every frame of the animation
     */
    updateComponent: function(texture) {
        this.gl.uniform2f(this.resolutionLocation, this.resolution.width, this.resolution.height);
        this.update(texture);
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
extend(Trans, Component, {
    swapFrame: true,

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




/**
 * Utility component that copies a texture to the screen
 * @constructor
 */
function Copy() {
    var fragmentSrc = [
        "precision mediump float;",
        "uniform sampler2D u_curRender;",
        "varying vec2 v_texCoord;",
        "void main() {",
        "   gl_FragColor = texture2D(u_curRender, v_texCoord);",
        "}"
    ].join("\n");
    Copy.super.constructor.call(this, fragmentSrc);
}
extend(Copy, Trans);

window.Webvs = Webvs;