import * as _ from 'lodash';
import RenderingContext from "../webgl/RenderingContext";
import IMain from "../IMain";
import Component, { IContainer } from "../Component";
import ShaderProgram from "../webgl/ShaderProgram";
import Buffer from "../webgl/Buffer";
import compileExpr from '../expr/compileExpr';
import { WebGLVarType, Source } from "../utils";
import CodeInstance from "../expr/CodeInstance";


export interface TexerOpts {
    code: {
        init: string,
        onBeat: string,
        perFrame: string,
        perPoint: string
    },
    imageSrc: string
    source: string,
    resizing: boolean,
    wrapAround: boolean,
    clone: number,
    colorFiltering: boolean
}

interface TexerCodeInstance extends CodeInstance {
    n: number;
    b: number;
    i: number;
    v: number;
    x: number;
    y: number;
    sizex: number;
    sizey: number;
    red: number;
    green: number;
    blue: number;
    init: () => void;
    perFrame: () => void;
    perPoint: () => void;
    onBeat: () => void;
}

// A SuperScope like component that places images at points.
export default class Texer extends Component {
    public static componentName: string = "Texer";
    public static componentTag: string = "render";
    protected static optUpdateHandlers = {
        code: "updateCode",
        clone: "updateClone",
        imageSrc: "updateImage",
        source: "updateSource"
    };
    protected static defaultOptions: TexerOpts = {
        code: {
            init: "",
            onBeat: "",
            perFrame: "",
            perPoint: ""
        },
        imageSrc: "avsres_texer_circle_edgeonly_19x19.bmp",
        source: "SPECTRUM",
        resizing: false,
        wrapAround: false,
        clone: 1,
        colorFiltering: true
    };

    protected opts: TexerOpts;
    private program: ShaderProgram;
    private vertexBuffer: Buffer;
    private texVertexBuffer: Buffer;
    private colorBuffer: Buffer;
    private indexBuffer: Buffer;
    private code: TexerCodeInstance[];
    private inited: boolean;
    private texture: WebGLTexture;
    private imageWidth: number;
    private imageHeight: number;
    private source: Source;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        const rctx = this.main.rctx;
        const gl = this.main.rctx.gl;
        this.program = new ShaderProgram(rctx, {
            copyOnSwap: true,
            bindings: {
                uniforms: {
                    image:       { name: 'u_image', valueType: WebGLVarType.TEXTURE2D },
                    colorFilter: { name: 'u_colorFilter', valueType: WebGLVarType._1I },
                },
                attribs: {
                    vertices:    { name: 'a_vertex' },
                    texVertices: { name: 'a_texVertex' },
                    colors:      { name: 'a_color' },
                },
                index: {
                    valueName: 'indices',
                    drawMode: gl.TRIANGLES
                }
            },
            vertexShader: `
                uniform bool u_colorFilter;
                attribute vec2 a_texVertex;
                attribute vec2 a_vertex;
                attribute vec3 a_color;
                varying vec2 v_texVertex;
                varying vec3 v_color;
                void main() {
                   if(u_colorFilter) {
                       v_color = a_color;
                   }
                   v_texVertex = a_texVertex;
                   setPosition(a_vertex);
                }
            `,
            fragmentShader: `
                uniform bool u_colorFilter;
                uniform sampler2D u_image;
                varying vec2 v_texVertex;
                varying vec3 v_color;
                void main() {
                   vec3 outColor = texture2D(u_image, v_texVertex).rgb;
                   if(u_colorFilter) {
                       outColor = outColor*v_color;
                   }
                   setFragColor(vec4(outColor, 1));
                }
            `
        });
        this.updateCode();
        this.updateClone();
        this.updateImage();
        this.updateSource();
        this.listenTo(this.main, "resize", this.handleResize);

        this.vertexBuffer = new Buffer(rctx);
        this.texVertexBuffer = new Buffer(rctx);
        this.colorBuffer = new Buffer(rctx);
        this.indexBuffer = new Buffer(rctx, true);
    }

    draw() {
        _.each(this.code, (code) => {
            this._drawScope(code, !this.inited);
        });
        this.inited = true;
    }

    destroy() {
        const gl = this.main.rctx.gl;
        super.destroy();
        this.program.destroy();
        gl.deleteTexture(this.texture);
        this.vertexBuffer.destroy();
        this.texVertexBuffer.destroy();
        this.colorBuffer.destroy();
        this.indexBuffer.destroy();
    }

    private updateCode() {
        const code = compileExpr(this.opts.code, ["init", "onBeat", "perFrame", "perPoint"]).codeInst as TexerCodeInstance;
        code.n = 100;
        code.setup(this.main);
        this.inited = false;
        this.code = [code];
    }

    private updateClone() {
        this.code = CodeInstance.clone(this.code, this.opts.clone) as TexerCodeInstance[];
    }

    private updateImage() {
        const gl = this.main.rctx.gl;
        this.main.rsrcMan.getImage(
            this.opts.imageSrc,
            (image) => {
                this.imageWidth = image.width;
                this.imageHeight = image.height;
                if(!this.texture) {
                    this.texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                }
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            }
        );
    }

    private updateSource() {
        this.source = Source[this.opts.source];
    }

    private _drawScope(code: TexerCodeInstance, runInit: boolean) {
        const gl = this.main.rctx.gl;
        if(runInit) {
            code.init();
        }

        const beat = this.main.analyser.beat;
        code.b = beat?1:0;
        code.perFrame();
        if(beat) {
            code.onBeat();
        }

        const nPoints = Math.floor(code.n);
        let data;
        if(this.source == Source.SPECTRUM) {
            data = this.main.analyser.getSpectrum();
        } else {
            data = this.main.analyser.getWaveform();
        }
        const bucketSize = data.length/nPoints;

        const vertexData = [];
        const texVertexData = [];
        const vertexIndices = [];
        const colorData = this.opts.colorFiltering?[]:null;
        let index = 0;
        const addRect = (cornx, corny, sizex, sizey, red, green, blue) => {
            if(cornx < -1-sizex || cornx > 1||
               corny < -1-sizey || corny > 1) {
                return;
            }
            // screen coordinates
            vertexData.push(
                cornx,       corny,
                cornx+sizex, corny,
                cornx+sizex, corny+sizey,
                cornx,       corny+sizey
            );

            // texture coordinates
            texVertexData.push(
                0, 0,
                1, 0,
                1, 1,
                0, 1
            );

            if(colorData) {
                // color data
                colorData.push(
                    red, green, blue,
                    red, green, blue,
                    red, green, blue,
                    red, green, blue
                );
            }

            // indices
            vertexIndices.push(
                index+0, index+1, index+2,
                index+0, index+2, index+3
            );
            index += 4;
        };

        const imageSizex = (this.imageWidth/gl.drawingBufferWidth)*2;
        const imageSizey = (this.imageHeight/gl.drawingBufferHeight)*2;

        for(let i = 0;i < nPoints;i++) {
            let value = 0;
            let size = 0;
            for(let j = Math.floor(i*bucketSize);j < (i+1)*bucketSize;j++,size++) {
                value += data[j];
            }
            value = value/size;

            const pos = i/(nPoints-1);
            code.i = pos;
            code.v = value;
            code.sizex = 1;
            code.sizey = 1;
            code.red = 1;
            code.green = 1;
            code.blue = 1;
            code.perPoint();

            var sizex = imageSizex;
            var sizey = imageSizey;
            if(this.opts.resizing) {
                sizex *= code.sizex;
                sizey *= code.sizey;
            }
            var cornx = code.x-sizex/2;
            var corny = (-code.y)-sizey/2;
            
            addRect(cornx, corny, sizex, sizey, code.red, code.green, code.blue);
            if(this.opts.wrapAround) {
                // wrapped around x value is 1-(-1-cornx) or -1-(1-cornx)
                // depending on the edge
                // ie. 2+cornx or -2+cornx
                var xwrap = (cornx < -1)?2:((cornx > (1-sizex))?-2:0);
                var ywrap = (corny < -1)?2:((corny > (1-sizey))?-2:0);
                if(xwrap) {
                    addRect(xwrap+cornx, corny, sizex, sizey, code.red, code.green, code.blue);
                }
                if(ywrap) {
                    addRect(cornx, ywrap+corny, sizex, sizey, code.red, code.green, code.blue);
                }
                if(xwrap && ywrap) {
                    addRect(xwrap+cornx, ywrap+corny, sizex, sizey, code.red, code.green, code.blue);
                }
            }
        }

        this.vertexBuffer.setData(vertexData);
        this.texVertexBuffer.setData(texVertexData);
        this.indexBuffer.setData(new Uint16Array(vertexIndices));
        if(colorData) {
            this.colorBuffer.setData(colorData);
        }
        this.program.run(
            this.parent.fm,
            {
                image: this.texture,
                colorFilter: colorData ? 1 : 0,
                vertices: this.vertexBuffer,
                texVertices: this.texVertexBuffer,
                colors: colorData ? this.colorBuffer : null
            }
        );
    }

    handleResize() {
        for(const codeInst of this.code) {
            codeInst.updateDimVars(this.main.rctx.gl);
        }
    }
}