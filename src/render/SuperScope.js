/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A generic scope, that can draw points or lines based on user code
 *
 * #### Code variables
 *
 * The following variables are available in the code
 *
 * + n (default: 100) - the number of points.
 * + i - 0-1 normalized loop counter
 * + v - the value of the superscope at current position (-1 to +1)
 * + x - x position of the dot (-1 to +1)
 * + y - y position of the dot (-1 to +1)
 * + w - width of the screen
 * + h - height of the screen
 * + b - 1 if a beat has occured else 0
 * + red (default: set from colors option) - red component of color (0-1)
 * + green (default: set from colors option) - green component of color (0-1)
 * + blue (default: set from colors option) - blue component of color (0-1)
 * + cid - the clone id of this component. if it is a clone
 *
 * @param {object} options - options object
 * @param {string} [options.code.init] - code to be run at startup
 * @param {string} [options.code.onBeat] - code to be run when a beat occurs
 * @param {string} [options.code.perFrame] - code to be run on every frame
 * @param {string} [options.code.perPoint] - code that will be run once for every point. should set 
 *       `x`, `y` variables to specify point location. set `red`, `green` or `blue` variables
 *       to specify point color
 * @param {string} [options.source="SPECTRUM"] - the scope data source viz. `SPECTRUM`, `WAVEFORM`
 * @param {string} [options.drawMode="LINES"] - switch between drawing `LINES` or `DOTS`
 * @param {Array.<String>} [options.colors=["#FFFFFF"]] - rendering color cycles through these colors
 * @param {number} [options.thickness] - thickenss of line or dot
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
function SuperScope(gl, main, parent, opts) {
    SuperScope.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.SuperScope = Webvs.defineClass(SuperScope, Webvs.Component, {
    defaultOptions: {
        code: {
            init: "n=800",
            perFrame: "t=t-0.05",
            onBeat: "",
            perPoint: "d=i+v*0.2; r=t+i*$PI*4; x=cos(r)*d; y=sin(r)*d"
        },
        blendMode: "REPLACE",
        channel: "CENTER",
        source: "SPECTRUM",
        drawMode: "LINES",
        thickness: 1,
        clone: 1,
        colors: ["#ffffff"],
        cycleSpeed: 0.01
    },

    onChange: {
        code: ["updateCode", "updateClones"],
        colors: "updateColors",
        cycleSpeed: "updateSpeed",
        clone: "updateClones",
        channel: "updateChannel",
        thickness: "updateThickness",
        blendMode: "updateProgram"
    },

    init: function() {
        this.updateProgram();
        this.updateCode();
        this.updateClones();
        this.updateSpeed();
        this.updateColor();
        this.updateChannel();
        this.updateThickness();
    },

    draw: function() {
        var color = this._makeColor();
        _.each(this.code, function(code) {
            this.drawScope(code, color, !this.inited);
        }, this);
        this.inited = true;
    },

    destroy: function() {
        this.program.destroy();
    },

    /**
     * renders the scope
     * @memberof Webvs.SuperScope#
     */
    drawScope: function(code, color, runInit) {
        var gl = this.gl;

        code.red = color[0];
        code.green = color[1];
        code.blue = color[2];

        if(runInit) {
            code.init();
        }

        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        code.perFrame();
        if(beat) {
            code.onBeat();
        }

        var nPoints = Math.floor(code.n);
        var data;
        if(this.opts.source == "SPECTRUM") {
            data = this.main.analyser.getSpectrum(this.channel);
        } else {
            data = this.main.analyser.getWaveform(this.channel);
        }
        var dots = this.opts.drawMode == "DOTS";
        var bucketSize = data.length/nPoints;
        var pbi = 0;
        var cdi = 0;

        var bufferSize, thickX, thickY;
        var lastX, lastY, lastR, lastG, lastB;
        if(this.veryThick) {
            bufferSize = (dots?(nPoints*6):(nPoints*6-6));
            thickX = this.opts.thickness/this.main.canvas.width;
            thickY = this.opts.thickness/this.main.canvas.height;
        } else {
            bufferSize = (dots?nPoints:(nPoints*2-2));
        }

        var pointBufferData = new Float32Array(bufferSize * 2);
        var colorData = new Float32Array(bufferSize * 3);
        for(var i = 0;i < nPoints;i++) {
            var value = 0;
            var size = 0;
            var j;
            for(j = Math.floor(i*bucketSize);j < (i+1)*bucketSize;j++,size++) {
                value += data[j];
            }
            value = value/size;

            var pos = i/((nPoints > 1)?(nPoints-1):1);
            code.i = pos;
            code.v = value;
            code.perPoint();
            code.y *= -1;
            if(this.veryThick) {
                if(dots) {
                    // just a box at current point
                    pointBufferData[pbi++] = code.x-thickX;
                    pointBufferData[pbi++] = code.y-thickY;

                    pointBufferData[pbi++] = code.x+thickX;
                    pointBufferData[pbi++] = code.y-thickY;

                    pointBufferData[pbi++] = code.x-thickX;
                    pointBufferData[pbi++] = code.y+thickY;

                    pointBufferData[pbi++] = code.x+thickX;
                    pointBufferData[pbi++] = code.y-thickY;

                    pointBufferData[pbi++] = code.x-thickX;
                    pointBufferData[pbi++] = code.y+thickY;

                    pointBufferData[pbi++] = code.x+thickX;
                    pointBufferData[pbi++] = code.y+thickY;

                    for(j = 0;j < 6;j++) {
                        colorData[cdi++] = code.red;
                        colorData[cdi++] = code.green;
                        colorData[cdi++] = code.blue;
                    }
                } else {
                    if(i !== 0) {
                        var xdiff = Math.abs(lastX-code.x);
                        var ydiff = Math.abs(lastY-code.y);
                        var xoff = (xdiff <= ydiff)?thickX:0;
                        var yoff = (xdiff >  ydiff)?thickY:0;

                        // a rectangle from last point to the current point
                        pointBufferData[pbi++] = lastX+xoff;
                        pointBufferData[pbi++] = lastY+yoff;

                        pointBufferData[pbi++] = code.x+xoff;
                        pointBufferData[pbi++] = code.y+yoff;

                        pointBufferData[pbi++] = lastX-xoff;
                        pointBufferData[pbi++] = lastY-yoff;

                        pointBufferData[pbi++] = code.x+xoff;
                        pointBufferData[pbi++] = code.y+yoff;

                        pointBufferData[pbi++] = lastX-xoff;
                        pointBufferData[pbi++] = lastY-yoff;

                        pointBufferData[pbi++] = code.x-xoff;
                        pointBufferData[pbi++] = code.y-yoff;

                        for(j = 0;j < 6;j++) {
                            colorData[cdi++] = code.red;
                            colorData[cdi++] = code.green;
                            colorData[cdi++] = code.blue;
                        }
                    }
                    lastX = code.x;
                    lastY = code.y;
                    lastR = code.red;
                    lastG = code.green;
                    lastB = code.blue;
                }
            } else {
                if(dots) {
                    // just a point at the current point
                    pointBufferData[pbi++] = code.x;
                    pointBufferData[pbi++] = code.y;

                    colorData[cdi++] = code.red;
                    colorData[cdi++] = code.green;
                    colorData[cdi++] = code.blue;
                } else {
                    if(i !== 0) {
                        // lines from last point to current point
                        pointBufferData[pbi++] = lastX;
                        pointBufferData[pbi++] = lastY;

                        pointBufferData[pbi++] = code.x;
                        pointBufferData[pbi++] = code.y;

                        for(j = 0;j < 2;j++) {
                            // use current color for both points because
                            // we dont want color interpolation between points
                            colorData[cdi++] = code.red;
                            colorData[cdi++] = code.green;
                            colorData[cdi++] = code.blue;
                        }
                    }
                    lastX = code.x;
                    lastY = code.y;
                    lastR = code.red;
                    lastG = code.green;
                    lastB = code.blue;
                }
            }
        }

        this.program.run(this.parent.fm, null, pointBufferData, colorData, dots, this.veryThick?1:this.opts.thickness, this.veryThick);
    },

    updateProgram: function() {
        var blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
        var program = new SuperScopeShader(this.gl, blendMode);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    },

    updateCode: function() {
        var code = Webvs.compileExpr(this.opts.code, ["init", "onBeat", "perFrame", "perPoint"]).codeInst;
        code.n = 100;
        code.setup(this.main, this);
        this.inited = false;
        this.code = [code];
    },

    updateClones: function() {
        this.code = Webvs.CodeInstance.clone(this.code, this.opts.clone);
    },

    updateColor: function() {
        this.colors = _.map(this.opts.colors, Webvs.parseColorNorm);
        this.curColorId = 0;
    },

    updateSpeed: function() {
        var oldMaxStep = this.maxStep;
        this.maxStep = Math.floor(1/this.opts.cycleSpeed);
        if(this.curStep) {
            // curStep adjustment when speed changes
            this.curStep = Math.floor((this.curStep/oldMaxStep)*this.maxStep);
        } else {
            this.curStep = 0;
        }
    },

    updateChannel: function() {
        this.channel = Webvs.getEnumValue(this.opts.channel, Webvs.Channels);
    },

    updateThickness: function() {
        var range;
        if(this.opts.drawMode == "DOTS") {
            range = this.gl.getParameter(this.gl.ALIASED_POINT_SIZE_RANGE);
        } else {
            range = this.gl.getParameter(this.gl.ALIASED_LINE_WIDTH_RANGE);
        }
        if(this.opts.thickness < range[0] || this.opts.thickness > range[1]) {
            this.veryThick = true;
        } else {
            this.veryThick = false;
        }
    },

    _makeColor: function() {
        if(this.colors.length == 1) {
            return this.colors[0];
        } else {
            var color = [];
            var currentColor = this.colors[this.curColorId];
            var nextColor = this.colors[(this.curColorId+1)%this.colors.length];
            var mix = this.curStep/this.maxStep;
            for(var i = 0;i < 3;i++) {
                color[i] = currentColor[i]*(1-mix) + nextColor[i]*mix;
            }
            this.curStep = (this.curStep+1)%this.maxStep;
            if(this.curStep === 0) {
                this.curColorId = (this.curColorId+1)%this.colors.length;
            }
        }
    }
});

function SuperScopeShader(gl, blendMode) {
    SuperScopeShader.super.constructor.call(this, gl, {
        copyOnSwap: true,
        blendMode: blendMode,
        vertexShader: [
            "attribute vec2 a_position;",
            "attribute vec3 a_color;",
            "varying vec3 v_color;",
            "uniform float u_pointSize;",
            "void main() {",
            "   gl_PointSize = u_pointSize;",
            "   setPosition(a_position);",
            "   v_color = a_color;",
            "}"
        ],
        fragmentShader: [
            "varying vec3 v_color;",
            "void main() {",
            "   setFragColor(vec4(v_color, 1));",
            "}"
        ]
    });
}
Webvs.SuperScopeShader = Webvs.defineClass(SuperScopeShader, Webvs.ShaderProgram, {
    draw: function(points, colors, dots, thickness, triangles) {
        var gl = this.gl;

        this.setUniform("u_pointSize", "1f", thickness);
        this.setVertexAttribArray("a_position", points, 2, gl.FLOAT, false, 0, 0);
        this.setVertexAttribArray("a_color", colors, 3, gl.FLOAT, false, 0, 0);

        var prevLineWidth;
        if(!dots) {
            prevLineWidth = gl.getParameter(gl.LINE_WIDTH);
            gl.lineWidth(thickness);
        }

        var mode;
        if(triangles) {
            mode = gl.TRIANGLES;
        } else if(dots) {
            mode = gl.POINTS;
        } else {
            mode = gl.LINES;
        }
        gl.drawArrays(mode, 0, points.length/2);

        if(!dots) {
            gl.lineWidth(prevLineWidth);
        }
    }
});

})(Webvs);
