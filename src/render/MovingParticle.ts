import Component, {IContainer} from "../Component";
import IMain from "../IMain";
import { BlendModes, Color, parseColorNorm, WebGLVarType } from "../utils";
import Buffer from "../webgl/Buffer";
import { circleGeometry } from "../webgl/geometries";
import RenderingContext from "../webgl/RenderingContext";
import ShaderProgram from "../webgl/ShaderProgram";

export interface IMovingParticleOpts {
    color: string;
    distance: number;
    particleSize: number;
    onBeatSizeChange: boolean;
    onBeatParticleSize: number;
    blendMode: string;
}

// A particle that moves around depending on beat changes
export default class MovingParticle extends Component {
    public static componentName: string = "MovingParticle";
    public static componentTag: string = "render";
    protected static optUpdateHandlers = {
        blendMode: "updateBlendMode",
        color: "updateColor",
    };
    protected static defaultOptions: IMovingParticleOpts = {
        blendMode: "REPLACE",
        color: "#FFFFFF",
        distance: 0.7,
        onBeatParticleSize: 10,
        onBeatSizeChange: false,
        particleSize: 10,
    };

    protected opts: IMovingParticleOpts;
    private centerX: number;
    private centerY: number;
    private velocityX: number;
    private velocityY: number;
    private posX: number;
    private posY: number;
    private program: ShaderProgram;
    private blendMode: BlendModes;
    private color: Color;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.centerX = 0;
        this.centerY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.posX = 0;
        this.posY = 0;

        this.updateBlendMode();
        const gl = this.main.getRctx().getGl();
        this.program = new ShaderProgram(this.main.getRctx(), {
            bindings: {
                attribs: {
                    points: { name: "a_points", drawMode: gl.TRIANGLE_FAN },
                },
                uniforms: {
                    color:    { name: "u_color", valueType: WebGLVarType._3FV },
                    position: { name: "u_position", valueType: WebGLVarType._2FV },
                    scale:    { name: "u_scale", valueType: WebGLVarType._2FV },
                },
            },
            copyOnSwap: true,
            dynamicBlend: true,
            fragmentShader: `
                uniform vec3 u_color;
                void main() {
                   setFragColor(vec4(u_color, 1));
                }
            `,
            vertexShader: `
                attribute vec2 a_point;
                uniform vec2 u_position;
                uniform vec2 u_scale;
                void main() {
                   setPosition((a_point*u_scale)+u_position);
                }
            `,
        });
        this.updateColor();
    }

    public draw() {
        if (this.main.getAnalyser().isBeat()) {
            this.centerX = (Math.random() * 2 - 1) * 0.3;
            this.centerY = (Math.random() * 2 - 1) * 0.3;
        }

        this.velocityX -= 0.004 * (this.posX - this.centerX);
        this.velocityY -= 0.004 * (this.posY - this.centerY);

        this.posX += this.velocityX;
        this.posY += this.velocityY;

        this.velocityX *= 0.991;
        this.velocityY *= 0.991;

        const x = this.posX * this.opts.distance;
        const y = this.posY * this.opts.distance;

        let scaleX;
        let scaleY;
        if (this.opts.onBeatSizeChange && this.main.getAnalyser().isBeat()) {
            scaleX = this.opts.onBeatParticleSize;
            scaleY = this.opts.onBeatParticleSize;
        } else {
            scaleX = this.opts.particleSize;
            scaleY = this.opts.particleSize;
        }
        const gl = this.main.getRctx().getGl();
        scaleX = 2 * scaleX / gl.drawingBufferWidth;
        scaleY = 2 * scaleY / gl.drawingBufferHeight;

        this.program.run(
            this.parent.getFBM(),
            {
                color: this.color,
                points: circleGeometry(this.main.getRctx()),
                position: [x, y],
                scale: [scaleX, scaleY],
            },
            this.blendMode,
        );
    }

    public updateBlendMode() {
        this.blendMode = BlendModes[this.opts.blendMode];
    }

    public updateColor() {
        this.color = parseColorNorm(this.opts.color);
    }

    public destroy() {
        super.destroy();
        this.program.destroy();
    }
}
