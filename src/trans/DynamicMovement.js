/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that moves pixels according to user code.
 * 
 * #### Code variables
 *
 * The following variables are available in the code
 *
 * + x - x position of the pixel (-1 to +1)
 * + y - y position of the pixel (-1 to +1)
 * + d - length of pixel position vector (0 to 1)
 * + r - angle of the position vector with y axis in clockwise direction in radians
 * + w - width of the screen
 * + h - height of the screen
 * + b - 1 if a beat has occured else 0
 *
 * @param {object} options - options object
 * @param {string} [options.code.init] - code to be run at startup
 * @param {string} [options.code.onBeat] - code to be run when a beat occurs
 * @param {string} [options.code.perFrame] - code to be run on every frame
 * @param {string} [options.code.perPixel] - code that will be run once for every pixel. should set 
 *       `x`, `y` or `d`, `r` variables (depending on coord) to specify point location. Note: state 
 *        of this code does not persist.
 * @param {number} [options.gridW=16] - width of the interpolation grid
 * @param {number} [options.gridH=16] - height of the interpolation grid
 * @param {boolean} [options.noGrid=false] - if true, then interpolation grid is not used
 *      ie. movement will be pixel accurate
 * @param {boolean} [options.compat=false] - if true, then calculations are low precision.
 *      useful to map winamp AVS behaviour more closely
 * @param {boolean} [options.bFilter=true] - use bilinear interpolation for pixel sampling
 * @param {string} [options.coord="POLAR"] - coordinate system to be used viz. `POLAR`, `RECT`
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 * @constructor
 */
function DynamicMovement(options) {
    Webvs.checkRequiredOptions(options, ["code"]);
    options = _.defaults(options, {
        gridW: 16,
        gridH: 16,
        noGrid: false,
        bFilter: true,
        compat: false,
        coord: "POLAR"
    });

    var codeSrc;
    if(_.isObject(options.code)) {
        codeSrc = options.code;
    } else {
        throw new Error("Invalid Dynamic movement code");
    }
    var codeGen = new Webvs.ExprCodeGenerator(codeSrc, ["x", "y", "r", "d", "b"]);
    var genResult = codeGen.generateCode(["init", "onBeat", "perFrame"], ["perPixel"], ["x", "y", "d", "r"]);
    this.code = genResult[0];
    this.inited = false;

    this.noGrid = options.noGrid;
    this.gridW = options.gridW;
    this.gridH = options.gridH;

    this.coordMode = options.coord;
    this.bFilter = options.bFilter;
    this.compat = options.compat;

    if(this.noGrid) {
        this.program = new Webvs.DMovProgramNG(this.coordMode, this.bFilter,
                                               this.compat, this.code.hasRandom,
                                               genResult[1]);
    } else {
        this.program = new Webvs.DMovProgram(this.coordMode, this.bFilter,
                                             this.compat, this.code.hasRandom,
                                             genResult[1]);
    }

    DynamicMovement.super.constructor.apply(this, arguments);
}
Webvs.DynamicMovement = Webvs.defineClass(DynamicMovement, Webvs.Component, {
    componentName: "DynamicMovement",

    /**
     * initializes the DynamicMovement component
     * @memberof Webvs.DynamicMovement#
     */
    init: function(gl, main, parent) {
        DynamicMovement.super.init.call(this, gl, main, parent);

        this.program.init(gl);

        this.code.setup(main, parent);

        // calculate grid vertices
        if(!this.noGrid) {
            var gridW = Webvs.clamp(this.gridW, 1, this.main.canvas.width);
            var gridH = Webvs.clamp(this.gridH, 1, this.main.canvas.height);
            var nGridW = (gridW/this.main.canvas.width)*2;
            var nGridH = (gridH/this.main.canvas.height)*2;
            var gridCountAcross = Math.ceil(this.main.canvas.width/gridW);
            var gridCountDown = Math.ceil(this.main.canvas.height/gridH);
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

    /**
     * moves the pixels
     * @memberof Webvs.DynamicMovement#
     */
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

    /**
     * releases resources
     * @memberof Webvs.DynamicMovement#
     */
    destroy: function() {
        DynamicMovement.super.destroy.call(this);
        this.program.cleanup();
    }
});

var GlslHelpers = {
    glslRectToPolar: function(coordMode) {
        if(coordMode === "POLAR") {
            return [
                "float ar = u_resolution.x/u_resolution.y;",
                "x=x*ar;",
                "d = distance(vec2(x, y), vec2(0,0))/sqrt(2.0);",
                "r = mod(atan(y, x)+PI*0.5, 2.0*PI);"
            ].join("\n");
        } else {
            return "";
        }
    },

    glslPolarToRect: function(coordMode) {
        if(coordMode === "POLAR") {
            return [
                "d = d*sqrt(2.0);",
                "x = d*sin(r)/ar;",
                "y = -d*cos(r);"
            ].join("\n");
        } else {
            return "";
        }
    },

    glslFilter: function(bFilter, compat) {
        if(bFilter && !compat) {
            return [
                "vec3 filter(vec2 point) {",
                "   vec2 texel = 1.0/(u_resolution-vec2(1,1));",
                "   vec2 coord = (point+1.0)/2.0;",
                "   vec2 cornoff = fract(coord/texel);",
                "   vec2 corn = floor(coord/texel)*texel;",

                "   vec3 tl = getSrcColorAtPos(corn).rgb;",
                "   vec3 tr = getSrcColorAtPos(corn + vec2(texel.x, 0)).rgb;",
                "   vec3 bl = getSrcColorAtPos(corn + vec2(0, texel.y)).rgb;",
                "   vec3 br = getSrcColorAtPos(corn + texel).rgb;",

                "   vec3 pt = mix(tl, tr, cornoff.x);",
                "   vec3 pb = mix(bl, br, cornoff.x);",
                "   return mix(pt, pb, cornoff.y);",
                "}"
            ].join("\n");
        } else if(bFilter && compat) {
            return [
                "vec3 filter(vec2 point) {",
                "   vec2 texel = 1.0/(u_resolution-vec2(1,1));",
                "   vec2 coord = (point+1.0)/2.0;",
                "   vec2 corn = floor(coord/texel)*texel;",

                "   ivec2 cornoff = (ivec2(fract(coord/texel)*255.0));",

                "   ivec3 tl = ivec3(255.0 * getSrcColorAtPos(corn).rgb);",
                "   ivec3 tr = ivec3(255.0 * getSrcColorAtPos(corn + vec2(texel.x, 0)).rgb);",
                "   ivec3 bl = ivec3(255.0 * getSrcColorAtPos(corn + vec2(0, texel.y)).rgb);",
                "   ivec3 br = ivec3(255.0 * getSrcColorAtPos(corn + texel).rgb);",

                "   #define bt(i, j) int((float(i)/255.0)*float(j))",

                "   int a1 = bt(255-cornoff.x,255-cornoff.y);",
                "   int a2 = bt(cornoff.x    ,255-cornoff.y);",
                "   int a3 = bt(255-cornoff.x,cornoff.y);",
                "   int a4 = bt(cornoff.x    ,cornoff.y);",
                "   float r = float(bt(a1,tl.r) + bt(a2,tr.r) + bt(a3,bl.r) + bt(a4,br.r))/255.0;",
                "   float g = float(bt(a1,tl.g) + bt(a2,tr.g) + bt(a3,bl.g) + bt(a4,br.g))/255.0;",
                "   float b = float(bt(a1,tl.b) + bt(a2,tr.b) + bt(a3,bl.b) + bt(a4,br.b))/255.0;",
                "   return vec3(r,g,b);",
                "}"
            ].join("\n");
        } else {
            return [
                "vec3 filter(vec2 point) {",
                "   return getSrcColorAtPos((point+1.0)/2.0).rgb;",
                "}"
            ].join("\n");
        }
    }
};

function DMovProgramNG(coordMode, bFilter, compat, randSeed, exprCode) {
    var fragmentShader = [
        exprCode,
        this.glslFilter(bFilter, compat),
        "void main() {",
        (randSeed?"__randSeed = v_position;":""),
        "   x = v_position.x*2.0-1.0;",
        "   y = -(v_position.y*2.0-1.0);",
        this.glslRectToPolar(coordMode),
        "   perPixel();",
        this.glslPolarToRect(coordMode),
        "   setFragColor(vec4(filter(vec2(x, -y)), 1));",
        "}"
    ];

    DMovProgramNG.super.constructor.call(this, {
        fragmentShader: fragmentShader,
        swapFrame: true
    });
}
Webvs.DMovProgramNG = Webvs.defineClass(DMovProgramNG, Webvs.QuadBoxProgram, GlslHelpers, {
    draw: function(code) {
        code.bindUniforms(this);
        DMovProgramNG.super.draw.call(this);
    }
});

function DMovProgram(coordMode, bFilter, compat, randSeed, exprCode) {
    var vertexShader = [
        "attribute vec2 a_position;",
        "varying vec2 v_newPoint;",
        "uniform int u_coordMode;",
        exprCode,
        "void main() {",
        (randSeed?"__randSeed = a_position;":""),
        "   x = a_position.x;",
        "   y = -a_position.y;",
        this.glslRectToPolar(coordMode),
        "   perPixel();",
        this.glslPolarToRect(coordMode),
        "   v_newPoint = vec2(x,-y);",
        "   setPosition(a_position);",
        "}"
    ];

    var fragmentShader = [
        "varying vec2 v_newPoint;",
        this.glslFilter(bFilter, compat),
        "void main() {",
        "   setFragColor(vec4(filter(v_newPoint), 1));",
        "}"
    ];

    DMovProgram.super.constructor.call(this, {
        fragmentShader: fragmentShader,
        vertexShader: vertexShader,
        swapFrame: true
    });
}
Webvs.DMovProgram = Webvs.defineClass(DMovProgram, Webvs.ShaderProgram, GlslHelpers, {
    draw: function(code, gridVertices, gridVerticesSize) {
        code.bindUniforms(this);
        this.setVertexAttribArray("a_position", gridVertices, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, gridVerticesSize);
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

})(Webvs);
