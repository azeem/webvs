import Component, { IContainer } from "../Component";
import CodeInstance from "../expr/CodeInstance";
import compileExpr from "../expr/compileExpr";
import IMain from "../IMain";

export interface IGlobalVarOpts {
    code: {
        init: string,
        onBeat: string,
        perFrame: string,
    };
}

interface IGlobalVarCodeInstance extends CodeInstance {
    b: number;
    init: () => void;
    perFrame: () => void;
    onBeat: () => void;
}

// A component that simply runs some avs expressions.
// Useful to maintain global state
export default class GlobalVar extends Component {
    public static componentName: string = "GlobalVar";
    public static componentTag: string = "misc";
    protected static optUpdateHandlers = {
        code: "updateCode",
    };
    protected static defaultOptions: IGlobalVarOpts = {
        code: {
            init: "",
            onBeat: "",
            perFrame: "",
        },
    };

    protected opts: IGlobalVarOpts;
    private code: IGlobalVarCodeInstance;
    private inited: boolean;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.updateCode();
        this.listenTo(this.main, "resize", this.handleResize);
    }

    public draw() {
        const code = this.code;
        code.b = this.main.getAnalyser().isBeat() ? 1 : 0;

        if (!this.inited) {
            code.init();
            this.inited = true;
        }

        if (this.main.getAnalyser().isBeat()) {
            code.onBeat();
        }

        code.perFrame();
    }

    public updateCode() {
        this.code = compileExpr(this.opts.code, ["init", "onBeat", "perFrame"]).codeInst as IGlobalVarCodeInstance;
        this.code.setup(this.main);
        this.inited = false;
    }

    public handleResize() {
        this.code.updateDimVars(this.main.getRctx().getGl());
    }
}
