/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that moves pixels according to user code.
function DynamicMovement(gl, main, parent, opts) {
    DynamicMovement.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(DynamicMovement, {
    name: "DynamicMovement",
    menu: "Trans"
});

var CoordModes = {
    "POLAR": 0,
    "RECT": 1
};
DynamicMovement.CoordModes = CoordModes;

Webvs.defineClass(DynamicMovement, Webvs.Component, {
    defaultOptions: {
        code: {
            init: "",
            onBeat: "",
            perFrame: "",
            perPixel: ""
        },
        gridW: 16,
        gridH: 16,
        blend: false,
        noGrid: false,
        compat: false,
        bFilter: true,
        coord: "POLAR"
    },

    onChange: {
        "code": "updateCode",
        "noGrid": ["updateProgram", "updateGrid"],
        "compat": "updateProgram",
        "bFilter": "updateProgram",
        "coord": "updateProgram",
        "blend": "updateProgram",
        "gridW": "updateGrid",
        "gridH": "updateGrid"
    },
    
    init: function() {
        this.updateCode();
        this.updateGrid();
        this.listenTo(this.main, "resize", this.handleResize);
    },

    draw: function() {
        var code = this.code;

        // run init, if required
        if(!this.inited) {
            code.init();
            code.inited = true;
        }

        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        // run per frame
        code.perFrame();
        // run on beat
        if(beat) {
            code.onBeat();
        }

        this.program.run(this.parent.fm, null, this.code);
    },

    destroy: function() {
        DynamicMovement.super.destroy.call(this);
        this.program.destroy();
        if(this.gridVertexBuffer) {
            this.gridVertexBuffer.destroy();
        }
    },

    updateCode: function() {
        var compileResult = Webvs.compileExpr(this.opts.code, ["init", "onBeat", "perFrame"], ["perPixel"], ["x", "y", "d", "r", "alpha"]);

        // js code
        var code = compileResult.codeInst;
        code.setup(this.main, this);
        this.inited = false;
        this.code = code;

        // glsl code
        this.glslCode = compileResult.glslCode;
        this.updateProgram();
    },

    updateProgram: function() {
        var opts = this.opts;
        var program;
        var coordMode = Webvs.getEnumValue(this.opts.coord, CoordModes);
        if(opts.noGrid) {
            program = new Webvs.DMovProgramNG(this.gl, coordMode, opts.bFilter,
                                              opts.compat, this.code.hasRandom,
                                              this.glslCode, opts.blend);
        } else {
            program = new Webvs.DMovProgram(this.gl, coordMode, opts.bFilter,
                                            opts.compat, this.code.hasRandom,
                                            this.glslCode, opts.blend);
        }
        if(this.program) {
            program.copyBuffers(this.program);
            this.program.destroy();
        }
        this.program = program;
    },

    updateGrid: function() {
        var opts = this.opts;
        if(!opts.noGrid) {
            var gridW = Webvs.clamp(opts.gridW, 1, this.gl.drawingBufferWidth);
            var gridH = Webvs.clamp(opts.gridH, 1, this.gl.drawingBufferHeight);
            var nGridW = (gridW/this.gl.drawingBufferWidth)*2;
            var nGridH = (gridH/this.gl.drawingBufferHeight)*2;
            var gridCountAcross = Math.ceil(this.gl.drawingBufferWidth/gridW);
            var gridCountDown = Math.ceil(this.gl.drawingBufferHeight/gridH);
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
            if(!this.gridVertexBuffer) {
                this.gridVertexBuffer = new Webvs.Buffer(this.gl);
            }
            this.gridVertexBuffer.setData(gridVertices);
        }
    },

    handleResize: function() {
        this.code.updateDimVars(this.gl);
    }
});

var GlslHelpers = {
    glslRectToPolar: function(coordMode) {
        if(coordMode === CoordModes.POLAR) {
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
        if(coordMode === CoordModes.POLAR) {
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

function DMovProgramNG(gl, coordMode, bFilter, compat, randSeed, exprCode, blend) {
    var fragmentShader = [
        exprCode,
        this.glslFilter(bFilter, compat),
        "void main() {",
        (randSeed?"__randSeed = v_position;":""),
        "   x = v_position.x*2.0-1.0;",
        "   y = -(v_position.y*2.0-1.0);",
        this.glslRectToPolar(coordMode),
        "   alpha=0.5;",
        "   perPixel();",
        this.glslPolarToRect(coordMode),
        "   setFragColor(vec4(filter(vec2(x, -y)), "+(blend?"alpha":"1.0")+"));",
        "}"
    ];

    DMovProgramNG.super.constructor.call(this, gl, {
        fragmentShader: fragmentShader,
        blendMode: blend?Webvs.ALPHA:Webvs.REPLACE,
        swapFrame: true
    });
}
Webvs.DMovProgramNG = Webvs.defineClass(DMovProgramNG, Webvs.QuadBoxProgram, GlslHelpers, {
    draw: function(code) {
        code.bindUniforms(this);
        DMovProgramNG.super.draw.call(this);
    }
});

function DMovProgram(gl, coordMode, bFilter, compat, randSeed, exprCode, blend) {
    var vertexShader = [
        "attribute vec2 a_position;",
        "varying vec2 v_newPoint;",
        "varying float v_alpha;",
        "uniform int u_coordMode;",
        exprCode,
        "void main() {",
        (randSeed?"__randSeed = a_position;":""),
        "   x = a_position.x;",
        "   y = -a_position.y;",
        this.glslRectToPolar(coordMode),
        "   alpha = 0.5;",
        "   perPixel();",
        "   v_alpha = alpha;",
        this.glslPolarToRect(coordMode),
        "   v_newPoint = vec2(x,-y);",
        "   setPosition(a_position);",
        "}"
    ];

    var fragmentShader = [
        "varying vec2 v_newPoint;",
        "varying float v_alpha;",
        this.glslFilter(bFilter, compat),
        "void main() {",
        "   setFragColor(vec4(filter(v_newPoint), "+(blend?"v_alpha":"1.0")+"));",
        "}"
    ];

    DMovProgram.super.constructor.call(this, gl, {
        blendMode: blend?Webvs.ALPHA:Webvs.REPLACE,
        fragmentShader: fragmentShader,
        vertexShader: vertexShader,
        swapFrame: true
    });
}
Webvs.DMovProgram = Webvs.defineClass(DMovProgram, Webvs.ShaderProgram, GlslHelpers, {
    draw: function(code, grid) {
        code.bindUniforms(this);
        this.setAttrib("a_position", grid);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, grid.length/2);
    }
});

})(Webvs);
