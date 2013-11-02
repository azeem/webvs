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
 * + v - the value of the superscope at current position
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
function SuperScope(options) {
    Webvs.checkRequiredOptions(options, ["code"]);
    options = _.defaults(options, {
        source: "SPECTRUM",
        drawMode: "LINES",
        colors: ["#ffffff"]
    });

    var codeSrc;
    if(_.isObject(options.code)) {
        codeSrc = options.code;
    } else {
        throw new Error("Invalid superscope");
    }
    var codeGen = new Webvs.ExprCodeGenerator(codeSrc, ["n", "v", "i", "x", "y", "b", "w", "h", "red", "green", "blue", "cid"]);
    var genResult = codeGen.generateCode(["init", "onBeat", "perFrame", "perPoint"], [], []);
    this.code = genResult[0];
    this.code.n = 100;

    this.spectrum = options.source == "SPECTRUM";
    this.dots = options.drawMode == "DOTS";

    this.colors = _.map(options.colors, Webvs.parseColorNorm);
    this.currentColor = this.colors[0];
    this.maxStep = 100;

    this.step = this.maxStep; // so that we compute steps, the first time
    this.colorId = 0;
    this.colorStep = [0,0,0];

    this.thickness = options.thickness?options.thickness:1;

    this.inited = false;

    this.program = new SuperScopeShader();

    SuperScope.super.constructor.apply(this, arguments);
}
Webvs.SuperScope = Webvs.defineClass(SuperScope, Webvs.Component, {
    componentName: "SuperScope",

    /**
     * initializes the SuperScope component
     * @memberof Webvs.SuperScope
     */
    init: function(gl, main, parent) {
        SuperScope.super.init.call(this, gl, main, parent);
        this.program.init(gl);
        this.code.setup(main, this);
    },

    /**
     * renders the scope
     * @memberof Webvs.SuperScope
     */
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

        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        code.perFrame();
        if(beat) {
            code.onBeat();
        }

        var nPoints = Math.floor(code.n);
        var data = this.spectrum ? this.main.analyser.getSpectrum() : this.main.analyser.getWaveform();
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

        this.program.run(this.parent.fm, null, pointBufferData, colorData, this.dots, this.thickness);
    },

    /**
     * releases resources
     * @memberof Webvs.SuperScope
     */
    destroy: function() {
        SuperScope.super.destroy.call(this);
        this.program.cleanup();
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

function SuperScopeShader() {
    SuperScopeShader.super.constructor.call(this, {
        copyOnSwap: true,
        vertexShader: [
            "attribute vec2 a_position;",
            "attribute vec3 a_color;",
            "varying vec3 v_color;",
            "uniform float u_pointSize;",
            "void main() {",
            "   gl_PointSize = u_pointSize;",
            "   setPosition(clamp(a_position, vec2(-1,-1), vec2(1,1)));",
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
    draw: function(points, colors, dots, thickness) {
        var gl = this.gl;

        this.setUniform("u_pointSize", "1f", thickness);
        this.setVertexAttribArray("a_position", points, 2, gl.FLOAT, false, 0, 0);
        this.setVertexAttribArray("a_color", colors, 3, gl.FLOAT, false, 0, 0);

        var prevLineWidth;
        if(!dots) {
            prevLineWidth = gl.getParameter(gl.LINE_WIDTH);
            gl.lineWidth(thickness);
        }

        gl.drawArrays(dots?gl.POINTS:gl.LINES, 0, points.length/2);

        if(!dots) {
            gl.lineWidth(prevLineWidth);
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
    }
};


})(Webvs);
