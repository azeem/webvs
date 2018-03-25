import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import ShaderProgram from "../webgl/ShaderProgram";

export default class Invert extends Component {
    public static componentName: string = "Invert";
    public static componentTag: string = "trans";

    private program: ShaderProgram;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.program = new ShaderProgram(this.main.getRctx(), {
            fragmentShader: `
                void main() {
                   setFragColor(vec4(1,1,1,1)-getSrcColor());
                }
            `,
            swapFrame: true,
        });
    }

    public draw() {
        this.program.run(this.parent.getFBM(), null);
    }

    public destroy() {
        super.destroy();
        this.program.destroy();
    }
}
