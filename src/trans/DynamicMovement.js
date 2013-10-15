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
        noGrid: false,
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

    this.noGrid = options.noGrid;
    this.gridW = options.gridW;
    this.gridH = options.gridH;

    this.coordMode = options.coord;

    if(this.noGrid) {
        this.program = new Webvs.DMovNoGrid(this.coordMode, this.code.hasRandom, genResult[1]);
    } else {
        this.program = new Webvs.DynamicMovementProgram(this.coordMode, this.code.hasRandom, genResult[1]);
    }

    DynamicMovement.super.constructor.call(this);
}
Webvs.DynamicMovement = Webvs.defineClass(DynamicMovement, Webvs.Component, {
    componentName: "DynamicMovement",

    init: function(gl, main, parent) {
        DynamicMovement.super.init.call(this, gl, main, parent);

        this.program.init(gl);

        this.code.setup(main, parent);

        // calculate grid vertices
        if(!this.noGrid) {
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
        }
    },

    update: function() {
        var code = this.code;

        // run init, if required
        if(!this.inited) {
            code.init();
            this.inited = true;
        }

        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        // run per frame
        code.perFrame();
        // run on beat
        if(beat) {
            code.onBeat();
        }

        if(this.noGrid) {
            this.program.run(this.parent.fm, null, this.code);
        } else {
            this.program.run(this.parent.fm, null, this.code, this.gridVertices, this.gridVerticesSize);
        }
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

function DMovNoGrid(coordMode, randSeed, exprCode) {
    var rectToPolar = "";
    if(coordMode === "POLAR") {
        rectToPolar = [
            "d = distance(vec2(x, y), vec2(0,0))/sqrt(2.0);",
            "r = mod(atan(y, x)+PI*0.5, 2.0*PI);"
        ].join("\n");
    }
    var polarToRect = "";
    if(coordMode === "POLAR") {
        polarToRect = [
            //"r = mod(r-PI*0.5, 2.0*PI);",
            "x = d*sin(r);",
            "y = -d*cos(r);"
        ].join("\n");
    }

    var fragmentShader = [
        exprCode,

        "vec4 bFilter(vec2 coord) {",
        "   vec2 texelSize = (1.0/u_resolution);",
        "   vec4 q12 = getSrcColorAtPos(coord);",
        "   vec4 q22 = getSrcColorAtPos(coord + vec2(texelSize.x, 0));",
        "   vec4 q11 = getSrcColorAtPos(coord + vec2(0, texelSize.y));",
        "   vec4 q21 = getSrcColorAtPos(coord + texelSize);",

        "   float h = fract(coord.x * u_resolution.x);",
        "   vec4 r2 = mix(q12, q22, h);",
        "   vec4 r1 = mix(q11, q21, h);",

        "   float v = fract(coord.y * u_resolution.y);",
        "   return mix(r2, r1, v);",
        "}",

        "void main() {",
        (randSeed?"__randSeed = v_position;":""),
        "   x = v_position.x*2.0-1.0;",
        "   y = -(v_position.y*2.0-1.0);",
        rectToPolar,
        "   perPixel();",
        polarToRect,
        "   vec2 newPoint = mod((vec2(x,-y)+1.0)/2.0, 1.0);",
        //"   float g = r/(2.0*PI);",
        //"   setFragColor(vec4(g,g,g,1));",
        "   setFragColor(vec4(bFilter(newPoint).rgb, 1));",
        "}"
    ];

    DMovNoGrid.super.constructor.call(this, {
        fragmentShader: fragmentShader,
        swapFrame: true
    });
}
Webvs.DMovNoGrid = Webvs.defineClass(DMovNoGrid, Webvs.QuadBoxProgram, {
    draw: function(code) {
        code.bindUniforms(this);
        DMovNoGrid.super.draw.call(this);
    }
});

function DynamicMovementProgram(coordMode, randSeed, exprCode) {
    var rectToPolar = "";
    if(coordMode === "POLAR") {
        rectToPolar = [
            "d = distance(vec2(x, y), vec2(0,0));",
            "r = mod(atan(x, -y), 2.0*PI);"
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

        "vec4 bFilter(vec2 coord) {",
        "   vec2 texelSize = (1.0/u_resolution);",
        "   vec4 q12 = getSrcColorAtPos(coord);",
        "   vec4 q22 = getSrcColorAtPos(coord + vec2(texelSize.x, 0));",
        "   vec4 q11 = getSrcColorAtPos(coord + vec2(0, texelSize.y));",
        "   vec4 q21 = getSrcColorAtPos(coord + texelSize);",

        "   float h = fract(coord.x * u_resolution.x);",
        "   vec4 r2 = mix(q12, q22, h);",
        "   vec4 r1 = mix(q11, q21, h);",

        "   float v = fract(coord.y * u_resolution.y);",
        "   return mix(r2, r1, v);",
        "}",

        "void main() {",
        "   setFragColor(vec4(bFilter(mod((v_newPoint+1.0)/2.0, 1.0)).rgb, 1));",
        "}"
    ];

    DynamicMovementProgram.super.constructor.call(this, {
        fragmentShader: fragmentShader,
        vertexShader: vertexShader,
        swapFrame: true
    });
}
Webvs.DynamicMovementProgram = Webvs.defineClass(DynamicMovementProgram, Webvs.ShaderProgram, {
    draw: function(code, gridVertices, gridVerticesSize) {
        code.bindUniforms(this);
        this.setVertexAttribArray("a_position", gridVertices, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, gridVerticesSize);
    }
});

})(Webvs);
