import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import { BlendModes } from "../utils";

export interface IBufferSaveOpts {
    action: string;
    bufferId: string;
    blendMode: string;
}

enum Actions {
    SAVE = 0,
    RESTORE,
    SAVERESTORE,
    RESTORESAVE,
}

// A components that saves or restores a copy of the current
// frame buffer.
export default class BufferSave extends Component {
    public static componentName: string = "BufferSave";
    public static componentTag: string = "misc";
    protected static optUpdateHandlers = {
        action: "updateAction",
        blendMode: "updateBlendMode",
        bufferId: "updateBuffer",
    };
    protected static defaultOptions: IBufferSaveOpts = {
        action: "SAVE",
        blendMode: "REPLACE",
        bufferId: "buffer1",
    };

    protected opts: IBufferSaveOpts;
    private action: Actions;
    private nextAction: Actions;
    private blendMode: BlendModes;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.updateAction();
        this.updateBlendMode();
        this.updateBuffer();
    }

    public draw() {
        let currentAction;
        if (this.action === Actions.SAVERESTORE ||
           this.action === Actions.RESTORESAVE) {
            currentAction = this.nextAction;
            // toggle next action
            this.nextAction = (this.nextAction === Actions.SAVE) ? Actions.RESTORE : Actions.SAVE;
        } else {
            currentAction = this.action;
        }

        const fm = this.main.getTempFBM();
        switch (currentAction) {
            case Actions.SAVE:
                fm.setRenderTarget(this.opts.bufferId);
                this.main.getCopier().run(null, { srcTexture: this.parent.getFBM().getCurrentTexture() });
                fm.restoreRenderTarget();
                break;
            case Actions.RESTORE:
                this.main.getCopier().run(
                    this.parent.getFBM(), { srcTexture: fm.getTexture(this.opts.bufferId) }, this.blendMode);
                break;
        }
    }

    public destroy() {
        super.destroy();
        this.main.getTempFBM().removeTexture(this.opts.bufferId);
    }

    public updateAction() {
        this.action = Actions[this.opts.action];
        if (this.action === Actions.SAVERESTORE) {
            this.nextAction = Actions.SAVE;
        } else if (this.action === Actions.RESTORESAVE) {
            this.nextAction = Actions.RESTORE;
        }
    }

    public updateBuffer(value?, key?, oldValue?) {
        // buffer names in FrameBufferManager have to be string
        // converting to string to maintain backward compatibility
        this.opts.bufferId = this.opts.bufferId + "";
        if (oldValue) {
            this.main.getTempFBM().removeTexture(oldValue);
        }
        this.main.getTempFBM().addTexture(this.opts.bufferId);
    }

    public updateBlendMode() {
        this.blendMode = BlendModes[this.opts.blendMode];
    }
}
