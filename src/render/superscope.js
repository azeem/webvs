/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/11/13
 * Time: 2:03 AM
 * To change this template use File | Settings | File Templates.
 */

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

    SuperScope.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(SuperScope, Component, {
    init: function() {
        var gl = this.gl;

        this.code.init(this.resolution.width, this.resolution.height);

        this.pointBuffer = gl.createBuffer();
        this.vertexPositionLocation = gl.getAttribLocation(this.program, "a_position");
    },

    update: function() {
        var gl = this.gl;

        this.code.perFrame(this.resolution.width, this.resolution.height);
        var nPoints = this.code.n;
        var data = new Uint8Array(this.analyser.frequencyBinCount);

        this.analyser.getByteTimeDomainData(data);
        var bucketSize = this.analyser.frequencyBinCount/nPoints;
        var pbi = 0;
        var pointBufferData = new Float32Array((nPoints*2-2)*2);
        for(var i = 0;i < nPoints;i++) {
            var value = 0;
            var size = 0;
            for(var j = Math.floor(i*bucketSize);j < (i+1)*bucketSize;j++,size++) {
                value += data[j];
            }
            value = (((value/size)/256)*2)-1;

            var pos = i/nPoints;
            var points = this.code.perPoint(pos, value, this.resolution.width, this.resolution.height);
            pointBufferData[pbi++] = points[0];
            pointBufferData[pbi++] = points[1]*-1;
            if(i !== 0 && i != nPoints-1) {
                pointBufferData[pbi++] = points[0];
                pointBufferData[pbi++] = points[1]*-1;
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
            n: 63,
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
    },
    spiralGraphFun: function() {
        var t = 0;
        return {
            n: 100,
            perFrame: function() {
                t = t + 0.01;
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
            init: function(w) {
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