window.Webvs = (function() {

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
                }
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
            }

            // start rendering when all the init promises are done
            D.all(initPromises).then(function() {
                requestAnimationFrame(drawFrame);;
            })
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

    function DrawImage(src, x, y) {
        this.src = src;
        this.x = x;
        this.y = y;
        var vertexSrc = [
            "attribute vec2 a_texCoord;",
            "varying vec2 v_texCoord;",
            "uniform vec2 u_resolution;",
            "uniform vec2 u_imageResolution;",
            "uniform vec2 u_imagePos;",

            "void main() {",
            "    v_texCoord = a_texCoord*vec2(1,-1);",
            "    vec2 clipSpace = ((a_texCoord*u_imageResolution+u_imagePos)/u_resolution)*2.0-1.0;",
            "    gl_Position = vec4(clipSpace*vec2(1, -1), 0, 1);",
            "}"
        ].join("\n");

        var fragmentSrc = [
            "precision mediump float;",
            "uniform sampler2D u_image;",
            "varying vec2 v_texCoord;",

            "void main() {",
            "   gl_FragColor = texture2D(u_image, v_texCoord);",
            "}"
        ].join("\n");
        DrawImage.super.constructor.call(this, vertexSrc, fragmentSrc);
    }
    extend(DrawImage, Component, {
        init: function() {
            var gl = this.gl;

            var imageTexture = gl.createTexture();
            var deferred = D();
            var image = new Image();
            image.src = this.src;
            this.imageTexture = imageTexture;
            var self = this;
            image.onload = function() {
                self.imageResolution = [image.width, image.height];
                gl.bindTexture(gl.TEXTURE_2D, imageTexture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                deferred.resolve();
            };

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

            this.imageLocation = gl.getUniformLocation(this.program, "u_image");
            this.imagePosLocation = gl.getUniformLocation(this.program, "u_imagePos");
            this.imageResLocation = gl.getUniformLocation(this.program, "u_imageResolution");
            this.texCoordLocation = gl.getAttribLocation(this.program, "a_texCoord");
            return deferred.promise;
        },

        update: function() {
            var gl = this.gl;
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
            gl.uniform1i(this.imageLocation, 0);

            gl.uniform2f(this.imagePosLocation, this.x, this.y);
            gl.uniform2f(this.imageResLocation, this.imageResolution[0], this.imageResolution[1]);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
            gl.enableVertexAttribArray(this.texCoordLocation);
            gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    })

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

    function Invert() {
        var fragmentSrc = [
            "precision mediump float;",
            "uniform vec2 u_resolution;",
            "uniform sampler2D u_curRender;",
            "varying vec2 v_texCoord;",
            "void main() {",
            "   vec4 texColor = texture2D(u_curRender, v_texCoord); ",
            "   gl_FragColor = texColor.rbga;",
            "}"
        ].join("\n");
        Invert.super.constructor.call(this, fragmentSrc);
    }
    extend(Invert, Trans);

    /**
     * Applies a 3x3 convolution kernel
     * @param kernel
     * @constructor
     */
    function Convolution(kernelName) {
        var fragmentSrc = [
            "precision mediump float;",
            "uniform vec2 u_resolution;",
            "uniform sampler2D u_curRender;",
            "varying vec2 v_texCoord;",

            "uniform float u_kernel[9];",
            "uniform float u_kernelWeight;",
            "void main() {",
            "   vec2 onePixel = vec2(1.0, 1.0)/u_resolution;",
            "   vec4 colorSum = texture2D(u_curRender, v_texCoord + onePixel * vec2(-1, 1)) * u_kernel[0] + ",
            "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(0, -1)) * u_kernel[1] + ",
            "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(1, -1)) * u_kernel[2] + ",
            "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(-1, 0)) * u_kernel[3] + ",
            "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(0, 0))  * u_kernel[4] + ",
            "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(1, 0))  * u_kernel[5] + ",
            "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(-1, 1)) * u_kernel[6] + ",
            "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(0, 1))  * u_kernel[7] + ",
            "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(1, 1))  * u_kernel[8];",
            "   gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1.0);",
            "}"
        ].join("\n");

        if(kernelName in Convolution.kernels) {
            this.kernel = Convolution.kernels[kernelName];
        } else if(isArray(kernelName) && kernelName.length == 9) {
            this.kernel = kernelName;
        } else {
            throw new Error("Invalid convolution kernel");
        }


        var kernelWeight = 0;
        for(var i = 0;i < this.kernel.length;i++) {
            kernelWeight += this.kernel[i];
        }
        this.kernelWeight = kernelWeight;
        Convolution.super.constructor.call(this, fragmentSrc);
    }
    Convolution.kernels = {
        normal: [
            0, 0, 0,
            0, 1, 0,
            0, 0, 0
        ],
        gaussianBlur: [
            0.045, 0.122, 0.045,
            0.122, 0.332, 0.122,
            0.045, 0.122, 0.045
        ],
        unsharpen: [
            -1, -1, -1,
            -1,  9, -1,
            -1, -1, -1
        ],
        emboss: [
            -2, -1,  0,
            -1,  1,  1,
             0,  1,  2
        ]
    };
    extend(Convolution, Trans, {
        init: function() {
            var gl = this.gl;

            this.kernelLocation = gl.getUniformLocation(this.program, "u_kernel[0]");
            this.kernelWeightLocation = gl.getUniformLocation(this.program, "u_kernelWeight");
            Convolution.super.init.call(this);
        },

        update: function(texture) {
            var gl = this.gl;

            gl.uniform1fv(this.kernelLocation, this.kernel);
            gl.uniform1f(this.kernelWeightLocation, this.kernelWeight);
            Convolution.super.update.call(this, texture);
        }

    });

    function SuperScope(analyser, codeName) {
        this.analyser = analyser;

        if(codeName in SuperScope.examples) {
            this.code = SuperScope.examples[codeName]();
        } else if(typeOf(codeName) === 'function') {
            this.code = codeName();
        } else {
            throw new Error("Invalid superscope");
        }

        this.code.init = this.code.init?this.code.init:noop;
        this.code.perFrame = this.code.perFrame?this.code.perFrame:noop;
        this.code.perPoint = this.code.perPoint?this.code.perPoint:noop;
        this.nPoints = this.code.n?this.code.n:100;

        var vertexSrc = [
            "attribute vec2 a_position;",
            "void main() {",
            "   gl_Position = vec4(a_position, 0, 1);",
            "}"
        ].join("\n");

        var fragmentSrc = [
            "void main() {",
            "   gl_FragColor = vec4(1, 1, 1, 1);",
            "}"
        ].join("\n");

        SuperScope.super.constructor.call(this, vertexSrc, fragmentSrc)
    }
    extend(SuperScope, Component, {
        init: function() {
            var gl = this.gl;

            this.code.init();

            this.pointBuffer = gl.createBuffer();
            this.vertexPositionLocation = gl.getAttribLocation(this.program, "a_position");
        },

        update: function() {
            var gl = this.gl;

            this.code.perFrame();

            var data = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteTimeDomainData(data);
            var bucketSize = this.analyser.frequencyBinCount/this.nPoints;
            var pbi = 0;
            var pointBufferData = new Float32Array((this.nPoints*2-2)*2);
            for(var i = 0;i < this.nPoints;i++) {
                var value = 0;
                for(var j = Math.floor(i*bucketSize);j < (i+1)*bucketSize;j++) {
                    value += data[j];
                }
                value = (((value/bucketSize)/256)*2)-1;

                var pos = i/this.nPoints;
                var points = this.code.perPoint(pos, value);
                pointBufferData[pbi++] = points[0];
                pointBufferData[pbi++] = points[1];
                if(i != 0 && i != this.nPoints-1) {
                    pointBufferData[pbi++] = points[0];
                    pointBufferData[pbi++] = points[1];
                }
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, pointBufferData, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(this.vertexPositionLocation);
            gl.vertexAttribPointer(this.vertexPositionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, pbi/2);
        }
    });
    SuperScope.examples = {
        diagonalScope: function() {
            var t;
            return {
                n: 64,
                init: function() {
                    t = 1;
                },
                perPoint: function(i, v) {
                    var sc = 0.4*Math.sin(i*Math.PI);
                    var x = 2*(i-0.5-v*sc)*t;
                    var y = 2*(i-0.5+v*sc);
                    return [x,y];
                }
            };
        }
    };


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

    /** Utility stuff **/

    function extend(C, P, members) {
        var F = function() {};
        F.prototype = P.prototype;
        C.prototype = new F();
        C.super = P.prototype;
        C.prototype.constructor = C;
        if(members) {
            for(var key in members) {
                C.prototype[key] = members[key];
            }
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

    function isArray(value) {
        return Object.prototype.toString.call( value ) === '[object Array]';
    }

    var requestAnimationFrame = (
        window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        }
    );

    Webvs.extend = extend;
    Webvs.Component = Component;
    Webvs.DrawImage = DrawImage;
    Webvs.Trans = Trans;
    Webvs.Invert = Invert;
    Webvs.Convolution = Convolution;
    Webvs.SuperScope = SuperScope;
    return Webvs;
})();