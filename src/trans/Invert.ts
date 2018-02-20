import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import QuadBoxProgram from "../webgl/QuadBoxProgram";

export default class Invert extends Component {
    public static componentName: string = "Invert";
    public static componentTag: string = "trans";

    private program: InvertProgram;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.program = new InvertProgram(this.main.rctx);
    }

    draw() {
        this.program.run(this.parent.fm, null);
    }

    destroy() {
        super.destroy();
        this.program.destroy();
    }
}

class InvertProgram extends QuadBoxProgram {
    constructor(rctx) {
        super(rctx, {
            swapFrame: true,
            fragmentShader: [
                "void main() {",
                "   setFragColor(vec4(1,1,1,1)-getSrcColor());",
                "}"
            ]
        });
    }
}