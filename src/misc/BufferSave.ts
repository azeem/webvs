import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import { BlendMode } from "../utils";

/**
 * Options for BufferSave
 */
export interface IBufferSaveOpts {
    /**
     * Action to be taken see [[BufferSaveAction]]
     */
    action: string;
    /**
     * A unique name for the buffer
     */
    bufferId: string;
    /**
     * BlendMode when restoring
     */
    blendMode: string;
}

/**
 * Actions for BufferSave
 */
enum BufferSaveAction {
    SAVE = 0,
    RESTORE,
    SAVERESTORE,
    RESTORESAVE,
}

/**
 * A component that saves or restores a copy of the current
 * frame buffer
 */
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
    private action: BufferSaveAction;
    private nextAction: BufferSaveAction;
    private blendMode: BlendMode;

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
        if (this.action === BufferSaveAction.SAVERESTORE ||
           this.action === BufferSaveAction.RESTORESAVE) {
            currentAction = this.nextAction;
            // toggle next action
            this.nextAction =
                (this.nextAction === BufferSaveAction.SAVE) ? BufferSaveAction.RESTORE : BufferSaveAction.SAVE;
        } else {
            currentAction = this.action;
        }

        const tempTSM = this.main.getTempTSM();
        switch (currentAction) {
            case BufferSaveAction.SAVE:
                tempTSM.setAsRenderTarget(this.opts.bufferId);
                this.main.getCopier().run(null, { srcTexture: this.parent.getTSM().getCurrentTexture() });
                tempTSM.unsetAsRenderTarget();
                break;
            case BufferSaveAction.RESTORE:
                this.main.getCopier().run(
                    this.parent.getTSM(), { srcTexture: tempTSM.getTexture(this.opts.bufferId) }, this.blendMode);
                break;
        }
    }

    public destroy() {
        super.destroy();
        this.main.getTempTSM().removeTexture(this.opts.bufferId);
    }

    public updateAction() {
        this.action = BufferSaveAction[this.opts.action];
        if (this.action === BufferSaveAction.SAVERESTORE) {
            this.nextAction = BufferSaveAction.SAVE;
        } else if (this.action === BufferSaveAction.RESTORESAVE) {
            this.nextAction = BufferSaveAction.RESTORE;
        }
    }

    public updateBuffer(value?, key?, oldValue?) {
        // buffer names in TextureSetManager have to be string
        // converting to string to maintain backward compatibility
        this.opts.bufferId = this.opts.bufferId + "";
        if (oldValue) {
            this.main.getTempTSM().removeTexture(oldValue);
        }
        this.main.getTempTSM().addTexture(this.opts.bufferId);
    }

    public updateBlendMode() {
        this.blendMode = BlendMode[this.opts.blendMode];
    }
}
