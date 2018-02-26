import IMain from "../IMain";
import Component, { IContainer } from "../Component";
import CodeInstance from "../expr/CodeInstance";
import compileExpr from "../expr/compileExpr";

export interface GlobalVarOpts {
    code: {
        init: string,
        onBeat: string,
        perFrame: string
    }
}

interface GlobalVarCodeInstance extends CodeInstance {
    b: number;
    init: () => void;
    perFrame: () => void;
    onBeat: () => void;
};

// A component that simply runs some avs expressions.
// Useful to maintain global state
export default class GlobalVar extends Component {
    public static componentName: string = "GlobalVar";
    public static componentTag: string = "misc";
    protected static optUpdateHandlers = {
        "code": "updateCode"
    };
    protected static defaultOptions: GlobalVarOpts = {
        code: {
            init: "",
            onBeat: "",
            perFrame: ""
        }
    };

    protected opts: GlobalVarOpts;
    private code: GlobalVarCodeInstance;
    private inited: boolean;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.updateCode();
        this.listenTo(this.main, "resize", this.handleResize);
    }

    draw() {
		const code = this.code;
		code.b = this.main.analyser.beat?1:0;

		if(!this.inited) {
			code.init();
			this.inited = true;
		}

		if(this.main.analyser.beat) {
			code.onBeat();
		}

		code.perFrame();
    }

    updateCode() {
        this.code = compileExpr(this.opts.code, ["init", "onBeat", "perFrame"]).codeInst as GlobalVarCodeInstance;
        this.code.setup(this.main);
        this.inited = false;
    }

    handleResize() {
        this.code.updateDimVars(this.main.rctx.gl);
    }
}