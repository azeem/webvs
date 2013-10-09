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
    Webvs.checkRequiredOptions(options, ["code"]);
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
    var codeGen = new Webvs.ExprCodeGenerator(codeSrc, ["x", "y", "r", "d", "b", "w", "h"]);
    var genResult = codeGen.generateCode(["init", "onBeat", "perFrame"], ["perPixel"], ["x", "y", "d", "r"]);
    this.code = genResult[0];
    this.inited = false;

    this.gridW = options.gridW;
    this.gridH = options.gridH;

    this.coordMode = options.coord;

    this.program = new Webvs.DynamicMovementProgram(this.coordMode, this.code.hasRandom, genResult[1]);

    DynamicMovement.super.constructor.call(this);
}
Webvs.DynamicMovement = Webvs.defineClass(DynamicMovement, Webvs.Component, {
    componentName: "DynamicMovement",

    init: function(gl, main, parent) {
        DynamicMovement.super.init.call(this, gl, main, parent);

        this.program.init(gl);

        this.code.setup(main, parent);

        // calculate grid vertices
        var nGridW = (this.gridW/this.main.canvas.width)*2;
        var nGridH = (this.gridH/this.main.canvas.height)*2;
        var gridCountAcross = Math.ceil(this.main.canvas.width/this.gridW);
        var gridCountDown = Math.ceil(this.main.canvas.height/this.gridH);
        var gridVertices = new Float32Array(gridCountAcross*gridCountDown*6*2);
        var pbi = 0;
        var curx = -1;
        var cury = -1;
        for(var i = 0;i < gridCountDown;i++) {
            for(var j = 0;j < gridCountAcross;j++) {
                var cornx = Math.min(curx+nGridW, 1);
                var corny = Math.min(cury+nGridH, 1);

                gridVertices[pbi++] = curx;
                gridVertices[pbi++] = cury;
                gridVertices[pbi++] = cornx;
                gridVertices[pbi++] = cury;
                gridVertices[pbi++] = curx;
                gridVertices[pbi++] = corny;

                gridVertices[pbi++] = cornx;
                gridVertices[pbi++] = cury;
                gridVertices[pbi++] = cornx;
                gridVertices[pbi++] = corny;
                gridVertices[pbi++] = curx;
                gridVertices[pbi++] = corny;

                curx += nGridW;
            }
            curx = -1;
            cury += nGridH;
        }
        this.gridVertices = gridVertices;
        this.gridVerticesSize = pbi/2;
    },

    update: function() {
        var code = this.code;

        // run init, if required
        if(!this.inited) {
            code.init();
            this.inited = true;
        }

        // run on beat
        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        code.perFrame();
        if(beat) {
            code.onBeat();
        }

        this.code.bindUniforms(this.program);
        this.program.run(this.parent.fm, null, this.gridVertices, this.gridVerticesSize);
    },

    destroyComponent: function() {
        DynamicMovement.super.destroyComponent.call(this);
        this.program.destroy();
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

function DynamicMovementProgram(coordMode, randSeed, exprCode) {
    var rectToPolar = "";
    if(coordMode === "POLAR") {
        rectToPolar = [
            "d = distance(a_position, vec2(0,0));",
            "r = atan(a_position.x, a_position.y);"
        ].join("\n");
    }
    var polarToRect = "";
    if(coordMode === "POLAR") {
        polarToRect = [
            "x = d*sin(r);",
            "y = -d*cos(r);"
        ].join("\n");
    }

    var vertexShader = [
        "attribute vec2 a_position;",
        "varying vec2 v_newPoint;",
        "uniform int u_coordMode;",
        exprCode,
        "void main() {",
        (randSeed?"__randSeed = a_position;":""),
        "   x = a_position.x;",
        "   y = -a_position.y;",
        rectToPolar,
        "   perPixel();",
        polarToRect,
        "   v_newPoint = vec2(x,-y);",
        "   setPosition(a_position);",
        "}"
    ];

    var fragmentShader = [
        "varying vec2 v_newPoint;",
        "void main() {",
        "   setFragColor(vec4(getSrcColorAtPos(mod((v_newPoint+1.0)/2.0, 1.0)).rgb, 1));",
        "}"
    ];

    DynamicMovementProgram.super.constructor.call(this, {
        fragmentShader: fragmentShader,
        vertexShader: vertexShader,
        swapFrame: true
    });
}
Webvs.DynamicMovementProgram = Webvs.defineClass(DynamicMovementProgram, Webvs.ShaderProgram, {
    draw: function(gridVertices, gridVerticesSize) {
        this.setVertexAttribArray("a_position", gridVertices, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, gridVerticesSize);
    }
});

})(Webvs);
