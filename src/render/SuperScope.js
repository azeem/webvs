/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * The-Superscope component
 * @param options
 * @constructor
 */
function SuperScope(options) {
    checkRequiredOptions(options, ["code"]);
    options = _.defaults(options, {
        source: "SPECTRUM",
        drawMode: "LINES",
        colors: ["#ffffff"]
    });

    var codeSrc;
    if(options.code in SuperScope.examples) {
        codeSrc = SuperScope.examples[options.code]();
    } else if(typeof(options.code) === 'object') {
        codeSrc = options.code;
    } else {
        throw new Error("Invalid superscope");
    }
    var codeGen = new ExprCodeGenerator(codeSrc, ["n", "v", "i", "x", "y", "b", "w", "h", "red", "green", "blue", "cid"]);
    var genResult = codeGen.generateCode(["init", "onBeat", "perFrame", "perPoint"], [], []);
    this.code = genResult[0];
    this.code.n = 100;

    this.spectrum = options.source == "SPECTRUM";
    this.dots = options.drawMode == "DOTS";

    this.colors = _.map(options.colors, parseColorNorm);
    this.currentColor = this.colors[0];
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
        "   setPosition(clamp(a_position, vec2(-1,-1), vec2(1,1)));",
        "   v_color = a_color;",
        "}"
    ].join("\n");

    var fragmentSrc = [
        "varying vec3 v_color;",
        "void main() {",
        "   setFragColor(vec4(v_color, 1));",
        "}"
    ].join("\n");

    SuperScope.super.constructor.call(this, vertexSrc, fragmentSrc);
}
Webvs.SuperScope = Webvs.defineClass(SuperScope, Webvs.ShaderComponent, {
    componentName: "SuperScope",

    copyOnSwap: true,

    init: function() {
        var gl = this.gl;

        this.code.setup(this.registerBank, this.bootTime, this.analyser);
        this.code.w = this.resolution.width;
        this.code.h = this.resolution.height;
        this.code.cid = this.cloneId;

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
            if(i !== 0 && i != nPoints-1 && !this.dots) {
                pointBufferData[pbi++] = code.x;
                pointBufferData[pbi++] = code.y*-1;
            }
            if(this.dots) {
                colorData[cdi++] = code.red;
                colorData[cdi++] = code.green;
                colorData[cdi++] = code.blue;
            } else if(i !== 0) {
                colorData[cdi++] = code.red;
                colorData[cdi++] = code.green;
                colorData[cdi++] = code.blue;
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

SuperScope.ui = {
    disp: "SuperScope",
    type: "SuperScope",
    schema: {
        code: {
            type: "object",
            title: "Code",
            default: {},
            properties: {
                init: {
                    type: "string",
                    title: "Init",
                },
                onBeat: {
                    type: "string",
                    title: "On Beat",
                },
                perFrame: {
                    type: "string",
                    title: "Per Frame",
                },
                perPoint: {
                    type: "string",
                    title: "Per Point",
                }
            },
        },
        source: {
            type: "string",
            title: "Source",
            default: "WAVEFORM",
            enum: ["WAVEFORM", "SPECTRUM"]
        },
        drawMode: {
            type: "string",
            title: "Draw Mode",
            default: "LINES",
            enum: ["DOTS", "LINES"]
        },
        colors: {
            type: "array",
            title: "Cycle Colors",
            items: {
                type: "string",
                format: "color",
                default: "#FFFFFF"
            }
        }
    },
    form: [
        { key: "code.init", type: "textarea" },
        { key: "code.onBeat", type: "textarea" },
        { key: "code.perFrame", type: "textarea" },
        { key: "code.perPoint", type: "textarea" },
        "colors",
        "source",
        "drawMode"
    ]
};

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

})(Webvs);
