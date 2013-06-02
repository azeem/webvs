window.Webvs = (function() {

    // Main Webvs object
    function Webvs(options) {
        checkRequiredOptions(options, ["canvas", "components"]);
        this.canvas = options.canvas;

        this._initGl();
        this._initComponents(options.components);
        //this._initFrameBuffer();
    }
    Webvs.prototype = {
        // Initializes the webgl
        _initGl: function() {
            try {
                this.gl = this.canvas.getContext("experimental-webgl");
                this.resolution = {
                    width: this.canvas.width,
                    height: this.canvas.height
                }
            } catch(e) {
                throw new Error("Couldnt get webgl context");
            }
        },
        _initComponents: function(componentOpts) {
            var components = [];
            for(var i = 0;i < componentOpts.length;i++) {
                components.push(new Component(this.gl, this.resolution, componentOpts[i]));
            }
            this.components = components;
        },
        _initFrameBuffer: function() {
            var gl = this.gl;
            //var frameBuffer = gl.createFrameBuffer();
            var textures = [];
            for(var i = 0;i < 2;i++) {
                var texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.resolution.width, this.resolution.height,
                              0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                textures[i] = texture;
            }
            //this.frameBuffer = frameBuffer;
            this.frameTextures = textures;
            this.curFrameTexture = 0;
        },

        start: function() {
            var gl = this.gl;
            var components = this.components;

            gl.viewport(0, 0, this.resolution.width, this.resolution.height);

            // initialize all the components
            for(var i = 0;i < components.length;i++) {
                components[i].init();
            }

            var drawFrame = function() {
                // bind the framebuffer
                //this.bindFrameBuffer(this.frameBuffer);
                //gl.frameBufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frameTextures[this.curFrameTexture]);

                for(var i = 0;i < components.length;i++) {
                    var component = components[i];
                    gl.useProgram(component.program);
                    //if(component.swapFrame) {
                        //var oldTexture = this.curFrameTexture;
                        //this.curFrameTexture = (++this.curFrameTexture) % 2;
                        //gl.frameBufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frameTextures[this.curFrameTexture]);
                        //component.update(this.frameTextures[oldTexture]);
                    //} else {
                        component.update();
                    //}
                }
                requestAnimationFrame(drawFrame);
            }
            requestAnimationFrame(drawFrame);
            drawFrame();
        }
    }

    function Component(gl, resolution, options) {
        checkRequiredOptions(options, ["vertex", "fragment"]);
        this.gl = gl;
        this.userInit = options.init || noop;
        this.userUpdate = options.update || noop;
        this.resolution = resolution;
        this.swapFrame = options.swapFrame || false;
        this._compileProgram(options.vertex, options.fragment);
    }
    Component.prototype = {
        _compileProgram: function(vertexSrc, fragmentSrc) {
            var gl = this.gl;
            var vertex = this._compileShader(vertexSrc, gl.VERTEX_SHADER);
            var fragment = this._compileShader(fragmentSrc, gl.FRAGMENT_SHADER);
            var program = gl.createProgram();
            gl.attachShader(program, vertex);
            gl.attachShader(program, fragment);
            gl.linkProgram(program);

            if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error("Program link program");
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

        init: function() {
            this.resolutionLocation = this.gl.getUniformLocation(this.program, "u_resolution");
            this.userInit();
        },

        update: function() {
            this.gl.uniform2f(this.resolutionLocation, this.resolution.width, this.resolution.height);
            this.userUpdate();
        }
    }

    function noop() {}

    function checkRequiredOptions(options, requiredOptions) {
        for(var i in requiredOptions) {
            var key =  requiredOptions[i];
            if(!(key in options)) {
                throw new Error("Required option " + key + "not found");
            }
        }
    }

    var requestAnimationFrame = (
        window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        }
    );


    return Webvs;
})();