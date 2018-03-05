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

    init() {
        this.program = new ShaderProgram(this.main.rctx, {
            swapFrame: true,
            fragmentShader: `
                void main() {
                   setFragColor(vec4(1,1,1,1)-getSrcColor());
                }
            `
        });
    }

    draw() {
        this.program.run(this.parent.fm, null);
    }

    destroy() {
        super.destroy();
        this.program.destroy();
    }
}