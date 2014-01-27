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
function BufferSave(gl, main, parent, opts) {
    BufferSave.super.constructor.call(this, gl, main, parent, opts);
}
var Actions = {
    "SAVE": 0,
    "RESTORE": 1,
    "SAVERESTORE": 2,
    "RESTORESAVE": 3
};
BufferSave.Actions = Actions;
Webvs.BufferSave = Webvs.defineClass(BufferSave, Webvs.Component, {
    defaultOptions: {
        action: "SAVE",
        bufferId: 1,
        blendMode: "REPLACE"
    },

    onChange: {
        "action": "updateAction",
        "bufferId": "updateBuffer",
        "blendMode": "updateBlendMode"
    },

    init: function() {
        this.updateAction();
        this.updateBlendMode();
        this.updateBuffer();
    },

    draw: function() {
        var fm = this.main.registerBank[this.bufferId];

        var currentAction;
        if(this.action == Actions.SAVERESTORE ||
           this.action == Actions.RESTORESAVE) {
            currentAction = this.nextAction;
            // toggle next action
            this.nextAction = (this.nextAction == Actions.SAVE)?Actions.RESTORE:Actions.SAVE;
        } else {
            currentAction = this.action;
        }

        switch(currentAction) {
            case Actions.SAVE:
                fm.setRenderTarget();
                this.main.copier.run(null, null, this.parent.fm.getCurrentTexture());
                fm.restoreRenderTarget();
                break;
            case Actions.RESTORE:
                this.main.copier.run(this.parent.fm, this.blendMode, fm.getCurrentTexture());
                break;
        }
    },

    updateAction: function() {
        this.action = Webvs.getEnumValue(this.opts.action, Actions);
        if(this.action == Actions.SAVERESTORE) {
            this.nextAction = Actions.SAVE;
        } else if(this.action == Actions.RESTORESAVE) {
            this.nextAction = Actions.RESTORE;
        }
    },

    updateBuffer: function() {
        // create frame buffer manager
        this.bufferId = "__BUFFERSAVE_" + this.opts.bufferId;
        if(!this.main.registerBank[this.bufferId]) {
            var fm = new Webvs.FrameBufferManager(this.main.canvas.width, this.main.canvas.height,
                                                  this.gl, this.main.copier, true, 1);
            this.main.registerBank[this.bufferId] = fm;
        }
    },

    updateBlendMode: function() {
        this.blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
    }
});

})(Webvs);
