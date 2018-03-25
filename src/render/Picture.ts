import Component, {IContainer} from "../Component";
import IMain from "../IMain";
import { WebGLVarType } from "../utils";
import Buffer from "../webgl/Buffer";
import { squareGeometry } from "../webgl/geometries";
import RenderingContext from "../webgl/RenderingContext";
import ShaderProgram from "../webgl/ShaderProgram";

export interface IPictureOpts {
    src: string;
    x: number;
    y: number;
}

// A component that renders an image onto the screen
export default class Picture extends Component {
    public static componentName: string = "Picture";
    public static componentTag: string = "render";
    protected static optUpdateHandlers = {
        src: "updateImage",
    };
    protected static defaultOptions: IPictureOpts = {
        src: "avsres_texer_circle_edgeonly_19x19.bmp",
        x: 0,
        y: 0,
    };

    protected opts: IPictureOpts;
    private program: ShaderProgram;
    private texture: WebGLTexture;
    private width: number;
    private height: number;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        const gl = this.main.getRctx().getGl();
        this.program = new ShaderProgram(this.main.getRctx(), {
            bindings: {
                attribs: {
                    points: { name: "a_texVertex", drawMode: gl.TRIANGLES },
                },
                uniforms: {
                    image:    { name: "u_image", valueType: WebGLVarType.TEXTURE2D },
                    imageRes: { name: "u_texRes", valueType: WebGLVarType._2FV },
                    position: { name: "u_pos", valueType: WebGLVarType._2FV },
                },
            },
            copyOnSwap: true,
            fragmentShader: `
                uniform sampler2D u_image;
                varying vec2 v_texCoord;
                void main() {
                   setFragColor(texture2D(u_image, v_texCoord));
                }
            `,
            vertexShader: `
                attribute vec2 a_texVertex;
                uniform vec2 u_pos;
                uniform vec2 u_texRes;
                varying vec2 v_texCoord;

                void main() {
                   v_texCoord = a_texVertex;
                   setPosition(a_texVertex*(u_texRes/u_resolution)*vec2(2,-2)+u_pos);
                }
            `,
        });
        this.updateImage();
    }

    public draw() {
        this.program.run(
            this.parent.getFBM(),
            {
                image: this.texture,
                imageRes: [this.width, this.height],
                points: squareGeometry(this.main.getRctx(), true),
                position: [this.opts.x, -this.opts.y],
            },
        );
    }

    public destroy() {
        super.destroy();
        this.program.destroy();
        this.main.getRctx().getGl().deleteTexture(this.texture);
    }

    public updateImage() {
        const gl = this.main.getRctx().getGl();
        this.main.getRsrcMan().getImage(
            this.opts.src,
            (image) => {
                this.width = image.width;
                this.height = image.height;
                if (!this.texture) {
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
            },
        );
    }
}
