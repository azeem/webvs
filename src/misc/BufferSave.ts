import IMain from "../IMain";
import Component, { IContainer } from "../Component";
import { BlendModes } from "../utils";

export interface BufferSaveOpts {
    action: string,
    bufferId: string,
    blendMode: string
}

enum Actions {
    SAVE = 0,
    RESTORE,
    SAVERESTORE,
    RESTORESAVE
};

// A components that saves or restores a copy of the current
// frame buffer.
export default class BufferSave extends Component {
    public static componentName: string = "BufferSave";
    public static componentTag: string = "misc";
    protected static optUpdateHandlers = {
        action: "updateAction",
        bufferId: "updateBuffer",
        blendMode: "updateBlendMode"
    };
    protected static defaultOptions: BufferSaveOpts = {
        action: "SAVE",
        bufferId: "buffer1",
        blendMode: "REPLACE"
    };

    protected opts: BufferSaveOpts;
    private action: Actions;
    private nextAction: Actions;
    private blendMode: BlendModes;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.updateAction();
        this.updateBlendMode();
        this.updateBuffer();
    }

    draw() {
        let currentAction;
        if(this.action == Actions.SAVERESTORE ||
           this.action == Actions.RESTORESAVE) {
            currentAction = this.nextAction;
            // toggle next action
            this.nextAction = (this.nextAction == Actions.SAVE)?Actions.RESTORE:Actions.SAVE;
        } else {
            currentAction = this.action;
        }

        const fm = this.main.tempBuffers;
        switch(currentAction) {
            case Actions.SAVE:
                fm.setRenderTarget(this.opts.bufferId);
                this.main.copier.run(null, null, this.parent.fm.getCurrentTexture());
                fm.restoreRenderTarget();
                break;
            case Actions.RESTORE:
                this.main.copier.run(this.parent.fm, this.blendMode, fm.getTexture(this.opts.bufferId));
                break;
        }
    }

    destroy() {
        super.destroy();
        this.main.tempBuffers.removeTexture(this.opts.bufferId);
    }
    
    updateAction() {
        this.action = Actions[this.opts.action];
        if(this.action == Actions.SAVERESTORE) {
            this.nextAction = Actions.SAVE;
        } else if(this.action == Actions.RESTORESAVE) {
            this.nextAction = Actions.RESTORE;
        }
    }

    updateBuffer(value?, key?, oldValue?) {
        // buffer names in FrameBufferManager have to be string
        // converting to string to maintain backward compatibility
        this.opts.bufferId = this.opts.bufferId + "";
        if(oldValue) {
            this.main.tempBuffers.removeTexture(oldValue);
        }
        this.main.tempBuffers.addTexture(this.opts.bufferId);
    }

    updateBlendMode() {
        this.blendMode = BlendModes[this.opts.blendMode];
    }
}