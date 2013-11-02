/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A components that saves or restores a copy of the current
 * frame buffer.
 *
 * @param {object} options - options object
 * @param {string} [options.action="SAVE"] - the action to be performed. viz. "SAVE",
 *     "RESTORE", "RESTORESAVE", "SAVERESTORE"
 * @param {number} [options.bufferId=1] - an identifying number for the buffer. This number
 *     is used to share buffer between different instances of BufferSave
 * @param {string} [options.blendMode="REPLACE"] - blending mode when restoring buffers
 * @constructor
 * @augments Webvs.Component
 * @memberof Webvs
 */
function BufferSave(options) {
    options = _.defaults(options, {
        action: "SAVE",
        bufferId: 1,
        blendMode: "REPLACE"
    });
    this.blendMode = Webvs.blendModes[options.blendMode];
    this.action = this.actions[options.action];
    if(!this.action) {
        throw new Error("Unknown BufferSave action " + options.action);
    }

    if(this.action == this.actions.SAVERESTORE) {
        this._nextAction = this.actions.SAVE;
    } else if(this.action == this.actions.RESTORESAVE) {
        this._nextAction = this.actions.RESTORE;
    }
    this._bufferId = "__BUFFERSAVE_" + options.bufferId;
    BufferSave.super.constructor.apply(this, arguments);
}
Webvs.BufferSave  = Webvs.defineClass(BufferSave, Webvs.Component, {
    actions: {
        SAVE: 1,
        RESTORE: 2,
        SAVERESTORE: 3,
        RESTORESAVE: 4
    },

    /**
     * Initializes the BufferSave component
     * @memberof Webvs.BufferSave
     */
    init: function(gl, main, parent) {
        BufferSave.super.init.call(this, gl, main, parent);

        // create frame buffer manager
        if(!main.registerBank[this._bufferId]) {
            var fm = new Webvs.FrameBufferManager(main.canvas.width, main.canvas.height, gl, main.copier, 1);
            main.registerBank[this._bufferId] = fm;
        }
    },

    /**
     * Saves or Renders the current frame
     * @memberof Webvs.BufferSave
     */
    update: function() {
        var gl = this.gl;
        var fm = this.main.registerBank[this._bufferId];

        // find the current action
        var currentAction;
        if(this.action == this.actions.SAVERESTORE || this.action == this.RESTORESAVE) {
            currentAction = this._nextAction;
            // set the next action
            if(this._nextAction == this.actions.SAVE) {
                this._nextAction = this.actions.RESTORE;
            } else {
                this._nextAction = this.actions.SAVE;
            }
        } else {
            currentAction = this.action;
        }

        switch(currentAction) {
            case this.actions.SAVE:
                fm.setRenderTarget();
                this.main.copier.run(null, null, this.parent.fm.getCurrentTexture());
                fm.restoreRenderTarget();
                break;
            case this.actions.RESTORE:
                this.main.copier.run(this.parent.fm, this.blendMode, fm.getCurrentTexture());
                break;
        }
    },

    /**
     * Releases resources.
     * @memberof Webgl.BufferSave
     */
    destroy: function() {
        BufferSave.super.destroy.call(this);
        // destroy the framebuffermanager
        this.main.registerBank[this._bufferId].destroy();
    }
});

BufferSave.ui = {
    disp: "Buffer Save",
    type: "BufferSave",
    schema: {
        action: {
            type: "string",
            title: "Buffer save action",
            enum: ["SAVE", "RESTORE", "SAVERESTORE", "RESTORESAVE"]
        },
        bufferId: {
            type: "number",
            title: "Buffer Id",
            enum: [1,2,3,4,5,6,7,8]
        },
        blendMode: {
            type: "string",
            title: "Blend mode",
            enum: _.keys(Webvs.blendModes)
        }
    }
};

})(Webvs);
