import Component, { IContainer } from "../Component";
import IMain from "../IMain";

export interface ICommentOpts {
    text: string;
}

// A component containing free text
export default class Comment extends Component {
    public static componentName: string = "Comment";
    public static componentTag: string = "misc";
    protected static optUpdateHandlers = {
        text: "updateText",
    };
    protected static defaultOptions: ICommentOpts = {
        text: "",
    };

    protected opts: ICommentOpts;
    private text: string;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {}
    public draw() {}

    public updateText() {
        this.text = this.opts.text;
    }
}
