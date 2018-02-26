import IMain from "../IMain";
import Component, { IContainer } from "../Component";
import QuadBoxProgram from "../webgl/QuadBoxProgram";
import RenderingContext from "../webgl/RenderingContext";
import { BlendModes, clamp } from "../utils";
import CodeInstance from '../expr/CodeInstance';
import compileExpr from '../expr/compileExpr';
import Buffer from "../webgl/Buffer";

enum CoordModes {
    POLAR = 0,
    RECT
};

export interface DynamicMovementOpts {
    code: {
        init: string,
        onBeat: string,
        perFrame: string,
        perPixel: string
    },
    gridW: number;
    gridH: number;
    blend: boolean;
    noGrid: boolean;
    compat: boolean;
    bFilter: boolean;
    coord: string;
}

interface DMovCodeInstance extends CodeInstance {
    x: number;
    y: number;
    d: number;
    r: number;
    b: number;
    alpha: number;
    init: () => void;
    perFrame: () => void;
    onBeat: () => void;
}

// A component that moves pixels according to user code.
export default class DynamicMovement extends Component {
    public static componentName: string = "DynamicMovement";
    public static componentTag: string = "trans";
    protected static optUpdateHandlers = {
        "code": "updateCode",
        "noGrid": ["updateProgram", "updateGrid"],
        "compat": "updateProgram",
        "bFilter": "updateProgram",
        "coord": "updateProgram",
        "blend": "updateProgram",
        "gridW": "updateGrid",
        "gridH": "updateGrid"
    };
    protected static defaultOptions: DynamicMovementOpts = {
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
    };

    protected opts: DynamicMovementOpts;
    private code: DMovCodeInstance;
    private glslCode: string;
    private inited: boolean;
    private program: DMovProgram | DMovProgramNG;
    private gridVertexBuffer: Buffer;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }
    
    init() {
        this.updateCode();
        this.updateGrid();
        this.listenTo(this.main, "resize", this.handleResize);
    }

    draw() {
        const code = this.code;

        // run init, if required
        if(!this.inited) {
            code.init();
            this.inited = true;
        }

        const beat = this.main.analyser.beat;
        code.b = beat?1:0;
        // run per frame
        code.perFrame();
        // run on beat
        if(beat) {
            code.onBeat();
        }

        this.program.run(this.parent.fm, null, this.code, this.gridVertexBuffer);
    }

    destroy() {
        super.destroy();
        this.program.destroy();
        if(this.gridVertexBuffer) {
            this.gridVertexBuffer.destroy();
        }
    }

    private updateCode() {
        const compileResult = compileExpr(this.opts.code, ["init", "onBeat", "perFrame"], ["perPixel"], ["x", "y", "d", "r", "b", "alpha"]);

        // js code
        const code = compileResult.codeInst;
        code.setup(this.main);
        this.inited = false;
        this.code = code as DMovCodeInstance;

        // glsl code
        this.glslCode = compileResult.glslCode;
        this.updateProgram();
    }

    private updateProgram() {
        const opts = this.opts;
        let program;
        const coordMode = CoordModes[this.opts.coord];
        const rctx = this.main.rctx;
        if(opts.noGrid) {
            program = new DMovProgramNG(rctx, coordMode, opts.bFilter,
                                        opts.compat, this.code._hasRandom,
                                        this.glslCode, opts.blend);
        } else {
            program = new DMovProgram(rctx, coordMode, opts.bFilter,
                                      opts.compat, this.code._hasRandom,
                                      this.glslCode, opts.blend);
        }
        if(this.program) {
            program.copyBuffers(this.program);
            this.program.destroy();
        }
        this.program = program;
    }

    private updateGrid() {
        const opts = this.opts;
        const gl = this.main.rctx.gl;
        if(!opts.noGrid) {
            const gridW = clamp(opts.gridW, 1, gl.drawingBufferWidth);
            const gridH = clamp(opts.gridH, 1, gl.drawingBufferHeight);
            const nGridW = (gridW/gl.drawingBufferWidth)*2;
            const nGridH = (gridH/gl.drawingBufferHeight)*2;
            const gridCountAcross = Math.ceil(gl.drawingBufferWidth/gridW);
            const gridCountDown = Math.ceil(gl.drawingBufferHeight/gridH);
            const gridVertices = new Float32Array(gridCountAcross*gridCountDown*6*2);
            let pbi = 0;
            let curx = -1;
            let cury = -1;
            for(let i = 0;i < gridCountDown;i++) {
                for(let j = 0;j < gridCountAcross;j++) {
                    const cornx = Math.min(curx+nGridW, 1);
                    const corny = Math.min(cury+nGridH, 1);

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
                this.gridVertexBuffer = new Buffer(this.main.rctx);
            }
            this.gridVertexBuffer.setData(gridVertices);
        }
    }

    private handleResize() {
        this.code.updateDimVars(this.main.rctx.gl);
    }
}

function glslRectToPolar(coordMode: CoordModes): string {
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
}

function glslPolarToRect(coordMode: CoordModes): string {
    if(coordMode === CoordModes.POLAR) {
        return [
            "d = d*sqrt(2.0);",
            "x = d*sin(r)/ar;",
            "y = -d*cos(r);"
        ].join("\n");
    } else {
        return "";
    }
}

function glslFilter(bFilter: boolean, compat: boolean): string {
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

class DMovProgramNG extends QuadBoxProgram {
    constructor(
        rctx: RenderingContext, 
        coordMode: CoordModes, 
        bFilter: boolean, 
        compat: boolean,
        randSeed: boolean,
        exprCode: string,
        blend: boolean
    ) {
        const fragmentShader = [
            exprCode,
            glslFilter(bFilter, compat),
            "void main() {",
            (randSeed?"__randSeed = v_position;":""),
            "   x = v_position.x*2.0-1.0;",
            "   y = -(v_position.y*2.0-1.0);",
            glslRectToPolar(coordMode),
            "   alpha=0.5;",
            "   perPixel();",
            glslPolarToRect(coordMode),
            "   setFragColor(vec4(filter(vec2(x, -y)), "+(blend?"alpha":"1.0")+"));",
            "}"
        ];

        super(rctx, {
            fragmentShader: fragmentShader,
            blendMode: blend?BlendModes.ALPHA:BlendModes.REPLACE,
            swapFrame: true
        });
    }

    draw(code) {
        code.bindUniforms(this);
        super.draw();
    }
}

class DMovProgram extends QuadBoxProgram {
    constructor(
        rctx: RenderingContext, 
        coordMode: CoordModes, 
        bFilter: boolean, 
        compat: boolean, 
        randSeed: boolean,
        exprCode: string, 
        blend: boolean
    ) {
        const vertexShader = [
            "attribute vec2 a_position;",
            "varying vec2 v_newPoint;",
            "varying float v_alpha;",
            "uniform int u_coordMode;",
            exprCode,
            "void main() {",
            (randSeed?"__randSeed = a_position;":""),
            "   x = a_position.x;",
            "   y = -a_position.y;",
            glslRectToPolar(coordMode),
            "   alpha = 0.5;",
            "   perPixel();",
            "   v_alpha = alpha;",
            glslPolarToRect(coordMode),
            "   v_newPoint = vec2(x,-y);",
            "   setPosition(a_position);",
            "}"
        ];

        const fragmentShader = [
            "varying vec2 v_newPoint;",
            "varying float v_alpha;",
            glslFilter(bFilter, compat),
            "void main() {",
            "   setFragColor(vec4(filter(v_newPoint), "+(blend?"v_alpha":"1.0")+"));",
            "}"
        ];

        super(rctx, {
            blendMode: blend?BlendModes.ALPHA:BlendModes.REPLACE,
            fragmentShader: fragmentShader,
            vertexShader: vertexShader,
            swapFrame: true
        });
    }

    draw(code: CodeInstance, grid) {
        const gl = this.rctx.gl;
        code.bindUniforms(this);
        this.setAttrib("a_position", grid);
        gl.drawArrays(gl.TRIANGLES, 0, grid.length/2);
    }
}