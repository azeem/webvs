/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * Dynamic movement component
 * @param options
 * @constructor
 */
function DynamicMovement(options) {
    checkRequiredOptions(options, ["code"]);
    options = _.defaults(options, {
        gridW: 16,
        gridH: 16,
        coord: "POLAR"
    });

    var codeSrc;
    if(options.code in DynamicMovement.examples) {
        codeSrc = DynamicMovement.examples[options.code];
    } else if(typeof(options.code) === "object") {
        codeSrc = options.code;
    } else {
        throw new Error("Invalid Dynamic movement code");
    }
    var codeGen = new ExprCodeGenerator(codeSrc, ["x", "y", "r", "d", "b", "w", "h"]);
    var genResult = codeGen.generateCode(["init", "onBeat", "perFrame"], ["perPixel"], ["x", "y", "d", "r"]);
    this.code = genResult[0];
    this.inited = false;

    this.gridW = options.gridW;
    this.gridH = options.gridH;

    this.coordMode = options.coord;

    var rectToPolar = "";
    if(this.coordMode === "POLAR") {
        rectToPolar = [
            "d = distance(a_position, vec2(0,0));",
            "r = atan(a_position.x, a_position.y);"
        ].join("\n");
    }
    var polarToRect = "";
    if(this.coordMode === "POLAR") {
        polarToRect = [
            "x = d*sin(r);",
            "y = -d*cos(r);"
        ].join("\n");
    }

    var vertexSrc = [
        "attribute vec2 a_position;",
        "varying vec2 v_newPoint;",
        "uniform int u_coordMode;",
        genResult[1],
        "void main() {",
        (this.code.hasRandom?"__randSeed = a_position;":""),
        "   x = a_position.x;",
        "   y = -a_position.y;",
        rectToPolar,
        "   perPixel();",
        polarToRect,
        "   v_newPoint = vec2(x,-y);",
        "   setPosition(a_position);",
        "}"
    ].join("\n");

    var fragmentSrc = [
        "varying vec2 v_newPoint;",
        "void main() {",
        "   setFragColor(vec4(getSrcColorAtPos(mod((v_newPoint+1.0)/2.0, 1.0)).rgb, 1));",
        "}"
    ].join("\n");

    DynamicMovement.super.constructor.call(this, vertexSrc, fragmentSrc);
}
Webvs.DynamicMovement = Webvs.defineClass(DynamicMovement, Webvs.ShaderComponent, {
    componentName: "DynamicMovement",

    swapFrame: true,

    init: function() {
        var gl = this.gl;

        this.code.setup(this.registerBank, this.bootTime, this.analyser);
        this.code.w = this.resolution.width;
        this.code.h = this.resolution.height;

        this.pointBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);

        // calculate grid vertices
        var nGridW = (this.gridW/this.resolution.width)*2;
        var nGridH = (this.gridH/this.resolution.height)*2;
        var gridCountAcross = Math.ceil(this.resolution.width/this.gridW);
        var gridCountDown = Math.ceil(this.resolution.height/this.gridH);
        var pointBufferData = new Float32Array(gridCountAcross*gridCountDown*6*2);
        var pbi = 0;
        var curx = -1;
        var cury = -1;
        for(var i = 0;i < gridCountDown;i++) {
            for(var j = 0;j < gridCountAcross;j++) {
                var cornx = Math.min(curx+nGridW, 1);
                var corny = Math.min(cury+nGridH, 1);

                pointBufferData[pbi++] = curx;
                pointBufferData[pbi++] = cury;
                pointBufferData[pbi++] = cornx;
                pointBufferData[pbi++] = cury;
                pointBufferData[pbi++] = curx;
                pointBufferData[pbi++] = corny;

                pointBufferData[pbi++] = cornx;
                pointBufferData[pbi++] = cury;
                pointBufferData[pbi++] = cornx;
                pointBufferData[pbi++] = corny;
                pointBufferData[pbi++] = curx;
                pointBufferData[pbi++] = corny;

                curx += nGridW;
            }
            curx = -1;
            cury += nGridH;
        }
        gl.bufferData(gl.ARRAY_BUFFER, pointBufferData, gl.STATIC_DRAW);
        this.pointBufferSize = pbi/2;

        this.vertexPositionLocation = gl.getAttribLocation(this.program, "a_position");
        this.curRenderLocation = gl.getUniformLocation(this.program, "u_curRender");
    },

    update: function(texture) {
        var gl = this.gl;

        var code = this.code;
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

        this.code.bindUniforms(gl, this.program, ["x", "y", "d", "r"]);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.curRenderLocation, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
        gl.enableVertexAttribArray(this.vertexPositionLocation);
        gl.vertexAttribPointer(this.vertexPositionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, this.pointBufferSize);
    },

    destroyComponent: function() {
        DynamicMovement.super.destroyComponent.call(this);
        this.gl.deleteBuffer(this.pointBuffer);
    }
});
DynamicMovement.ui = {
    type: "DynamicMovement",
    disp: "Dynamic Movement",
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
                perPixel: {
                    type: "string",
                    title: "Per Point",
                }
            },
        },
        gridW: {
            type: "number",
            title: "Grid Width",
            default: 16,
        },
        gridH: {
            type: "number",
            title: "Grid Height",
            default: 16,
        },
        coord: {
            type: "string",
            title: "Coordinate System",
            enum: ["POLAR", "RECT"],
            default: "POLAR"
        }
    },
    form: [
        { key: "code.init", type: "textarea" },
        { key: "code.onBeat", type: "textarea" },
        { key: "code.perFrame", type: "textarea" },
        { key: "code.perPixel", type: "textarea" },
        "gridW",
        "gridH",
        "coord"
    ]
};

DynamicMovement.examples = {
    inAndOut: {
        init: "speed=.2;c=0;",
        onBeat: [
            "c = c + ($PI/2);",
            "dd = 1 - (sin(c) * speed);"
        ].join("\n"),
        perPixel: "d = d * dd;"
    },

    randomDirection: {
        init: "speed=.05;dr = (rand(200) / 100) * $PI;",
        perFrame: [
            "dx = cos(dr) * speed;",
            "dy = sin(dr) * speed;"
        ].join("\n"),
        onBeat: "dr = (rand(200) / 100) * $PI;",
        perPixel: [
            "x = x + dx;",
            "y = y + dy;"
        ].join("\n")
    },

    rollingGridley: {
        init: "c=200;f=0;dt=0;dl=0;beatdiv=8",
        perFrame: [
            "f = f + 1;",
            "t = ((f * $PI * 2)/c)/beatdiv;",
            "dt = dl + t;",
            "dx = 14+(cos(dt)*8);",
            "dy = 10+(sin(dt*2)*4);"
        ].join("\n"),
        onBeat: "c=f;f=0;dl=dt",
        perPixel: "x=x+(sin(y*dx)*.03); y=y-(cos(x*dy)*.03);"
    }
};

})(Webvs);
