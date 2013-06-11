(function() {
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

function rand(max) {
    return Math.random()*max;
}

var requestAnimationFrame = (
    window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    function( callback ){
        window.setTimeout(callback, 1000 / 60);
    }
);

function Color(rgba) {
    this.r = rgba[0];
    this.g = rgba[1];
    this.b = rgba[2];
    this.a = typeof(rgba[3]) === "undefined"?255:rgba[3];
}
extend(Color, Object, {
    getNormalized: function() {
        return [this.r/256, this.g/256, this.b/256, this.a/256];
    }
});
function Webvs(options) {
    checkRequiredOptions(options, ["canvas", "components", "analyser"]);
    this.canvas = options.canvas;
    this.components = options.components;
    this.analyser = options.analyser;

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
            var res = components[i].initComponent(gl, this.resolution, this.analyser);
            if(res) {
                initPromises.push(res);
            }
        }
        copyComponent.initComponent(gl, this.resolution);

        var self = this;
        var first = true;
        var drawFrame = function() {
            if(!self.analyser.isPlaying()) {
                requestAnimationFrame(drawFrame);
                return;
            }
            // draw everything the temporary framebuffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, self.framebuffer);
            gl.viewport(0, 0, self.resolution.width, self.resolution.height);
            self._setFBAttachment();

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

function Component() {}
extend(Component, Object, {
    initComponent: function(gl, resolution, analyser) {
        this.gl = gl;
        this.resolution = resolution;
        this.analyser = analyser;
    },
    updateComponent: function() {}
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
    updateComponent: function(texture) {
        ShaderComponent.super.updateComponent.call(this, texture);
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
extend(Trans, ShaderComponent, {
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
function DancerAdapter(dancer) {
    this.dancer = dancer;
    this.beat = false;

    var _this = this;
    this.kick = dancer.createKick({
        onKick: function(mag) {
            _this.beat = true;
        },

        offKick: function() {
            _this.beat = false;
        }
    });
    this.kick.on();
}
extend(DancerAdapter, Object, {
    isPlaying: function() {
        return this.dancer.isPlaying();
    },

    getWaveform: function() {
        return this.dancer.getWaveform();
    },

    getSpectrum: function() {
        return this.dancer.getSpectrum();
    }
});

window.Webvs.DancerAdapter = DancerAdapter;
function OnBeatClear(options) {
    options = options?options:{};
    this.n = options.n?options.n:1;
    this.color = options.color?options.color:[0,0,0];

    if(this.color.length != 3) {
        throw new Error("Invalid clear color, must be an array of 3");
    }
    for(var i = 0;i < this.color.length;i++) {
        this.color[i] = this.color[i]/255;
    }

    if(options.blend) {
        this.color[3] = 0.5;
    }
    this.prevBeat = false;
    this.beatCount = 0;

    var vertexSrc = [
        "attribute vec2 a_position;",
        "void main() {",
        "   gl_Position = vec4(a_position, 0, 1);",
        "}"
    ].join("\n");

    var fragmentSrc = [
        "precision mediump float;",
        "uniform vec4 u_color;",
        "void main() {",
        "   gl_FragColor = u_color;",
        "}"
    ].join("\n");


    OnBeatClear.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(OnBeatClear, ShaderComponent, {
    init: function() {
        var gl = this.gl;

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
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

        this.positionLocation = gl.getAttribLocation(this.program, "a_position");
        this.colorLocation = gl.getUniformLocation(this.program, "u_color");
    },

    update: function() {
        var gl = this.gl;

        var clear = false;
        if(this.analyser.beat && !this.prevBeat) {
            this.beatCount++;
            if(this.beatCount == this.n) {
                clear = true;
                this.beatCount = 0;
            }
        }
        this.prevBeat = this.analyser.beat;

        if(clear) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.SRC_ALPHA);
            gl.uniform4fv(this.colorLocation, this.color);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.enableVertexAttribArray(this.vertexPositionLocation);
            gl.vertexAttribPointer(this.vertexPositionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disable(gl.BLEND);
        }
    }
});

window.Webvs.OnBeatClear = OnBeatClear;
function Picture(src, x, y) {
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
    Picture.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(Picture, ShaderComponent, {
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
});

window.Webvs.Picture = Picture;
function SuperScope(options) {
    checkRequiredOptions(options, ["code"]);

    if(options.code in SuperScope.examples) {
        this.code = SuperScope.examples[options.code]();
    } else if(typeOf(options.code) === 'function') {
        this.code = options.code();
    } else {
        throw new Error("Invalid superscope");
    }

    var colors = options.colors?options.colors:[[255,255,255]];
    for(var i = 0;i < colors.length;i++) {
        if(colors[i].length != 3) {
            throw new Error("Invalid color, must be an array of 3");
        }
        for(var j = 0;j < 3;j++) {
            colors[i][j] = colors[i][j]/255;
        }
    }
    this.colors = colors;
    this.currentColor = colors[0];
    this.maxStep = 100;

    this.step = this.maxStep; // so that we compute steps, the first time
    this.colorId = 0;
    this.colorStep = [0,0,0];

    this.code.init = this.code.init?this.code.init:noop;
    this.code.onBeat = this.code.onBeat?this.code.onBeat:noop;
    this.code.perFrame = this.code.perFrame?this.code.perFrame:noop;
    this.code.perPoint = this.code.perPoint?this.code.perPoint:noop;

    var vertexSrc = [
        "attribute vec2 a_position;",
        "void main() {",
        "   gl_Position = vec4(a_position, 0, 1);",
        "}"
    ].join("\n");

    var fragmentSrc = [
        "precision mediump float;",
        "uniform vec3 u_color;",
        "void main() {",
        "   gl_FragColor = vec4(u_color, 1);",
        "}"
    ].join("\n");

    SuperScope.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(SuperScope, ShaderComponent, {
    init: function() {
        var gl = this.gl;

        this.code.init(this.resolution.width, this.resolution.height);

        this.pointBuffer = gl.createBuffer();
        this.vertexPositionLocation = gl.getAttribLocation(this.program, "a_position");
        this.colorLocation = gl.getUniformLocation(this.program, "u_color");
    },

    update: function() {
        var gl = this.gl;

        var beat = this.analyser.beat;
        this.code.perFrame(beat, this.resolution.width, this.resolution.height);
        if(beat) {
            this.code.onBeat(beat, this.resolution.width, this.resolution.height);
        }

        var nPoints = Math.floor(this.code.n);
        var data = this.analyser.getWaveform();

        var bucketSize = data.length/nPoints;
        var pbi = 0;
        var pointBufferData = new Float32Array((nPoints*2-2)*2);
        for(var i = 0;i < nPoints;i++) {
            var value = 0;
            var size = 0;
            for(var j = Math.floor(i*bucketSize);j < (i+1)*bucketSize;j++,size++) {
                value += data[j];
            }
            value = value/size;

            var pos = i/nPoints;
            var points = this.code.perPoint(pos, value, beat, this.resolution.width, this.resolution.height);
            pointBufferData[pbi++] = points[0];
            pointBufferData[pbi++] = points[1]*-1;
            if(i !== 0 && i != nPoints-1) {
                pointBufferData[pbi++] = points[0];
                pointBufferData[pbi++] = points[1]*-1;
            }
        }

        this._stepColor();
        gl.uniform3fv(this.colorLocation, this.currentColor);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, pointBufferData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.vertexPositionLocation);
        gl.vertexAttribPointer(this.vertexPositionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINES, 0, pbi/2);
    },

    _stepColor: function() {
        var i;
        if(this.colors.length > 1) {
            if(this.step == this.maxStep) {
                var curColor = this.colors[this.colorId];
                this.colorId = (this.colorId+1)%this.colors.length;
                var nextColor = this.colors[this.colorId];
                for(i = 0;i < 3;i++) {
                    this.colorStep[i] = (nextColor[i]-curColor[i])/this.maxStep;
                }
                this.step = 0;
                this.currentColor = curColor;
            } else {
                for(i = 0;i < 3;i++) {
                    this.currentColor[i] += this.colorStep[i];
                }
                this.step++;
            }
        }
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
            onBeat: function() {
                t = -t;
            },
            perPoint: function(i, v) {
                var sc = 0.4*Math.sin(i*Math.PI);
                var x = 2*(i-0.5-v*sc)*t;
                var y = 2*(i-0.5+v*sc);
                return [x,y];
            }
        };
    },
    spiralGraphFun: function() {
        var t = 0;
        return {
            n: 100,
            perFrame: function() {
                t = t + 0.01;
            },
            onBeat: function() {
                this.n = 80+rand(120.0);
            },
            perPoint: function(i, v) {
                var r = i*Math.PI*128+t;
                var x = Math.cos(r/64)*0.7+Math.sin(r)*0.3;
                var y = Math.sin(r/64)*0.7+Math.cos(r)*0.3;
                return [x, y];
            }
        };
    },
    threeDScopeDish: function() {
        return {
            n: 200,
            perPoint: function(i, v) {
                var iz = 1.3+Math.sin(i*Math.PI*2)*(v+0.5)*0.88;
                var ix = Math.cos(i*Math.PI*2)*(v+0.5)*0.88;
                var iy = -0.3+Math.abs(Math.cos(v*3.14159));
                var x=ix/iz;
                var y=iy/iz;
                return [x, y];
            }
        };
    },
    vibratingWorm: function() {
        var dt = 0.01;
        var t = 0;
        var sc = 1;
        return {
            init: function(b, w, h) {
                this.n = w;
            },
            perFrame: function() {
                t=t+dt;
                dt=0.9*dt+0.001;
                if(t > 2*Math.PI) {
                    t = t-2*Math.PI;
                }
            },
            perPoint: function(i, v) {
                var x=Math.cos(2*i+t)*0.9*(v*0.5+0.5);
                var y=Math.sin(i*2+t)*0.9*(v*0.5+0.5);
                return [x, y];
            }
        };
    }
};

window.Webvs.SuperScope = SuperScope;
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

window.Webvs.Convolution = Convolution;
})();