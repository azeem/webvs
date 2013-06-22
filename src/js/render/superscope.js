/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/11/13
 * Time: 2:03 AM
 * To change this template use File | Settings | File Templates.
 */

function SuperScope(options) {
    checkRequiredOptions(options, ["code"]);

    var codeSrc;
    if(options.code in SuperScope.examples) {
        codeSrc = SuperScope.examples[options.code]();
    } else if(typeof(options.code) === 'object') {
        codeSrc = options.code;
    } else {
        throw new Error("Invalid superscope");
    }
    var codeGen = new ExprCodeGenerator(codeSrc, ["n", "v", "i", "x", "y", "b", "red", "green", "blue"]);
    this.code = codeGen.generateJs(["init", "onBeat", "perFrame", "perPoint"]);
    console.log(_.functions(this.code));
    this.code.n = 100;

    this.spectrum = options.spectrum?options.spectrum:false;
    this.dots = options.dots?options.dots:false;

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

    this.thickness = options.thickness?options.thickness:1;

    this.inited = false;

    var vertexSrc = [
        "attribute vec2 a_position;",
        "attribute vec3 a_color;",
        "varying vec3 v_color;",
        "uniform float u_pointSize;",
        "void main() {",
        "   gl_PointSize = u_pointSize;",
        "   gl_Position = vec4(clamp(a_position, vec2(-1,-1), vec2(1,1)), 0, 1);",
        "   v_color = a_color;",
        "}"
    ].join("\n");

    var fragmentSrc = [
        "precision mediump float;",
        "varying vec3 v_color;",
        "void main() {",
        "   gl_FragColor = vec4(v_color, 1);",
        "}"
    ].join("\n");

    SuperScope.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(SuperScope, ShaderComponent, {
    init: function() {
        var gl = this.gl;

        this.code.w = this.resolution.width;
        this.code.h = this.resolution.height;

        this.pointBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();
        this.vertexPositionLocation = gl.getAttribLocation(this.program, "a_position");
        this.vertexColorLocation = gl.getAttribLocation(this.program, "a_color");
        this.pointSizeLocation = gl.getUniformLocation(this.program, "u_pointSize");
    },

    update: function() {
        var gl = this.gl;
        var code = this.code;

        this._stepColor();
        code.red = this.currentColor[0];
        code.green = this.currentColor[1];
        code.blue = this.currentColor[2];

        if(!this.inited) {
            code.init();
            this.inited = true;
        }

        var beat = this.analyser.beat;
        code.b = beat?1:0;
        code.perFrame();
        if(beat) {
            code.onBeat();
        }

        var nPoints = Math.floor(code.n);
        var data = this.spectrum ? this.analyser.getSpectrum() : this.analyser.getWaveform();
        var bucketSize = data.length/nPoints;
        var pbi = 0;
        var cdi = 0;

        var pointBufferData = new Float32Array((this.dots?nPoints:(nPoints*2-2)) * 2);
        var colorData = new Float32Array((this.dots?nPoints:(nPoints*2-2)) * 3);
        for(var i = 0;i < nPoints;i++) {
            var value = 0;
            var size = 0;
            for(var j = Math.floor(i*bucketSize);j < (i+1)*bucketSize;j++,size++) {
                value += data[j];
            }
            value = value/size;

            var pos = i/(nPoints-1);
            code.i = pos;
            code.v = value;
            code.perPoint();
            pointBufferData[pbi++] = code.x;
            pointBufferData[pbi++] = code.y*-1;
            colorData[cdi++] = code.red;
            colorData[cdi++] = code.green;
            colorData[cdi++] = code.blue;
            if(i !== 0 && i != nPoints-1 && !this.dots) {
                pointBufferData[pbi++] = code.x;
                pointBufferData[pbi++] = code.y*-1;
                colorData[cdi++] = code.red;
                colorData[cdi++] = code.green;
                colorData[cdi++] = code.blue;
            }
        }

        gl.uniform1f(this.pointSizeLocation, this.thickness);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, pointBufferData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.vertexPositionLocation);
        gl.vertexAttribPointer(this.vertexPositionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.vertexColorLocation);
        gl.vertexAttribPointer(this.vertexColorLocation, 3, gl.FLOAT, false, 0, 0);

        var prevLineWidth;
        if(!this.dots) {
            prevLineWidth = gl.getParameter(gl.LINE_WIDTH);
            gl.lineWidth(this.thickness);
        }

        gl.drawArrays(this.dots?gl.POINTS:gl.LINES, 0, pbi/2);

        if(!this.dots) {
            gl.lineWidth(prevLineWidth);
        }
    },

    destroyComponent: function() {
        SuperScope.super.destroyComponent.call(this);
        var gl = this.gl;

        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.colorBuffer);
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
    diagonalScope: {
        init: "n=64; t=1;",
        onBeat: "t=-t;",
        perPoint: "sc=0.4*sin(i*$PI); x=2*(i-0.5-v*sc)*t; y=2*(i-0.5+v*sc);"
    }
//
//    diagonalScope: function() {
//        var t;
//        return {
//            n: 100,
//            init: function() {
//                t = 1;
//            },
//            onBeat: function() {
//                t = -t;
//            },
//            perPoint: function() {
//                var sc = 0.4*Math.sin(this.i*Math.PI);
//                this.x = 2*(this.i-0.5-this.v*sc)*t;
//                this.y = 2*(this.i-0.5+this.v*sc);
//            }
//        };
//    },
//    spiralGraphFun: function() {
//        var t = 0;
//        return {
//            n: 100,
//            perFrame: function() {
//                t = t + 0.01;
//            },
//            onBeat: function() {
//                this.n = 80+rand(120.0);
//            },
//            perPoint: function() {
//                var r = this.i*Math.PI*128+t;
//                this.x = Math.cos(r/64)*0.7+Math.sin(r)*0.3;
//                this.y = Math.sin(r/64)*0.7+Math.cos(r)*0.3;
//            }
//        };
//    },
//    threeDScopeDish: function() {
//        return {
//            n: 200,
//            perPoint: function() {
//                var iz = 1.3+Math.sin(this.i*Math.PI*2)*(this.v+0.5)*0.88;
//                var ix = Math.cos(this.i*Math.PI*2)*(this.v+0.5)*0.88;
//                var iy = -0.3+Math.abs(Math.cos(this.v*3.14159));
//                this.x=ix/iz;
//                this.y=iy/iz;
//            }
//        };
//    },
//    vibratingWorm: function() {
//        var dt = 0.01;
//        var t = 0;
//        var sc = 1;
//        return {
//            init: function() {
//                this.n = this.w;
//            },
//            perFrame: function() {
//                t=t+dt;
//                dt=0.9*dt+0.001;
//                if(t > 2*Math.PI) {
//                    t = t-2*Math.PI;
//                }
//            },
//            perPoint: function(i, v) {
//                this.x=Math.cos(2*this.i+t)*0.9*(this.v*0.5+0.5);
//                this.y=Math.sin(this.i*2+t)*0.9*(this.v*0.5+0.5);
//            }
//        };
//    }
};

window.Webvs.SuperScope = SuperScope;