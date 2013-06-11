/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/11/13
 * Time: 2:03 AM
 * To change this template use File | Settings | File Templates.
 */

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