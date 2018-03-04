import IMain from '../IMain';
import RenderingContext from "../webgl/RenderingContext";
import Component, {IContainer} from '../Component';
import ShaderProgram from '../webgl/ShaderProgram';
import Buffer from '../webgl/Buffer';
import { WebGLVarType } from '../utils';
import { squareGeometry } from '../webgl/geometries';

export interface PictureOpts {
    src: string;
    x: number;
    y: number;
}

// A component that renders an image onto the screen
export default class Picture extends Component {
    public static componentName: string = "Picture";
    public static componentTag: string = "render";
    protected static optUpdateHandlers = {
        src: "updateImage"
    };
    protected static defaultOptions: PictureOpts = {
        src: "avsres_texer_circle_edgeonly_19x19.bmp",
        x: 0,
        y: 0
    };

    protected opts: PictureOpts;
    private program: PictureProgram;
    private texture: WebGLTexture;
    private width: number;
    private height: number;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.program = new PictureProgram(this.main.rctx);
        this.updateImage();
    }

    draw() {
        this.program.run(this.parent.fm, null, 
                         this.opts.x, this.opts.y,
                         this.texture, this.width, this.height);
    }

    destroy() {
        super.destroy();
        this.program.destroy();
        this.main.rctx.gl.deleteTexture(this.texture);
    }

    updateImage() {
        const gl = this.main.rctx.gl;
        this.main.rsrcMan.getImage(
            this.opts.src, 
            (image) => {
                this.width = image.width;
                this.height = image.height;
                if(!this.texture) {
                    this.texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                }
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            }
        );
    }
}

class PictureProgram extends ShaderProgram {
    private points: Buffer;
    constructor(rctx: RenderingContext) {
        super(rctx, {
            copyOnSwap: true,
            vertexShader: [
                "attribute vec2 a_texVertex;",
                "uniform vec2 u_pos;",
                "uniform vec2 u_texRes;",
                "varying vec2 v_texCoord;",

                "void main() {",
                "   v_texCoord = a_texVertex;",
                "   setPosition(a_texVertex*(u_texRes/u_resolution)*vec2(2,-2)+u_pos);",
                "}"
            ],
            fragmentShader: [
                "uniform sampler2D u_image;",
                "varying vec2 v_texCoord;",
                "void main() {",
                "   setFragColor(texture2D(u_image, v_texCoord));",
                "}"
            ]
        });
    }

    draw(x, y, image, imgw, imgh) {
        this.setUniform("u_pos", WebGLVarType._2F, x, -y);
        this.setUniform("u_texRes", WebGLVarType._2F, imgw, imgh);
        this.setUniform("u_image", WebGLVarType.TEXTURE2D, image);
        this.setAttrib("a_texVertex", squareGeometry(this.rctx, true));
        const gl = this.rctx.gl;
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}