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
        if(this.opts.action == "SAVERESTORE" || this.opts.action == "RESTORESAVE") {
            currentAction = this.nextAction;
            // toggle next action
            this.nextAction = (this.nextAction == "SAVE")?"RESTORE":"SAVE";
        } else {
            currentAction = this.opts.action;
        }

        switch(currentAction) {
            case "SAVE":
                fm.setRenderTarget();
                this.main.copier.run(null, null, this.parent.fm.getCurrentTexture());
                fm.restoreRenderTarget();
                break;
            case "RESTORE":
                this.main.copier.run(this.parent.fm, this.blendMode, fm.getCurrentTexture());
                break;
        }
    },

    updateAction: function() {
        if(!_.contains(["SAVE", "RESTORE", "SAVERESTORE", "RESTORESAVE"], this.opts.action)) {
            throw new Error("Unknow action " + this.opts.action);
        }

        if(this.opts.action == "SAVERESTORE") {
            this.nextAction = "SAVE";
        } else if(this.opts.action == "RESTORESAVE") {
            this.nextAction = "RESTORE";
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
        this.blendMode = Webvs.getBlendMode(this.opts.blendMode);
    }
});

})(Webvs);
