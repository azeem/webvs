/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

function BufferSave(options) {
    options = _.defaults(options, {
        action: "SAVE",
        bufferId: 1,
        blendMode: "REPLACE"
    });
    this.blendMode = blendModes[options.blendMode];
    this.action = this.actions[options.action];
    if(!this.action) {
        throw new Error("Unknown BufferSave action " + options.action);
    }

    if(this.action == this.actions.SAVERESTORE || this.action == this.RESTORESAVE) {
        this._nextAction = this.action == this.actions.RESTORESAVE?this.actions.RESTORE:this.actions.SAVE;
    }
    this._bufferId = "__BUFFERSAVE_" + options.bufferId;
}
extend(BufferSave, Component, {
    actions: {
        SAVE: 1,
        RESTORE: 2,
        SAVERESTORE: 3,
        RESTORESAVE: 4
    },
    initComponent: function(gl, resolution, analyser, registerBank, bootTime) {
        BufferSave.super.initComponent.apply(this, arguments);

        // create copy components
        if(this.action != this.actions.RESTORE) {
            var saveCopyComponent = new Copy();
            saveCopyComponent.initComponent.apply(saveCopyComponent, arguments);
            this.saveCopyComponent = saveCopyComponent;
        }
        if(this.action != this.action.SAVE) {
            var restoreCopyComponent = new Copy(this.blendMode);
            restoreCopyComponent.initComponent.apply(restoreCopyComponent, arguments);
            this.restoreCopyComponent = restoreCopyComponent;
            // set swapFrame based on restoreCopyComponent's behaviour
            if(this.action == this.actions.RESTORE || 
               this._nextAction == this.actions.RESTORE
              ) {
                this.swapFrame = restoreCopyComponent.swapFrame;
            } else {
                this.swapFrame = false;
            }
        }

        // create frame buffer
        if(!registerBank[this._bufferId]) {
            var framebuffer = gl.createFramebuffer();
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, resolution.width, resolution.height,
                          0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            var renderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, resolution.width, resolution.height);

            registerBank[this._bufferId] = {
                framebuffer: framebuffer,
                texture: texture,
                renderbuffer: renderbuffer
            };
        }
    },
    updateComponent: function(texture) {
        BufferSave.super.updateComponent.apply(this, arguments);
        var gl = this.gl;
        var buffer = this.registerBank[this._bufferId];

        // find the current action
        var currentAction;
        if(this.action == this.actions.SAVERESTORE || this.action == this.RESTORESAVE) {
            currentAction = this._nextAction;
            // set the next action
            if(this._nextAction == this.actions.SAVE) {
                this._nextAction = this.actions.RESTORE;
                this.swapFrame = this.restoreCopyComponent.swapFrame;
            } else {
                this._nextAction = this.actions.SAVE;
                this.swapFrame = false;
            }
        } else {
            currentAction = this.action;
        }

        switch(currentAction) {
            case this.actions.SAVE:
                // save the current framebuffer
                var targetFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

                // switch to the framebuffer
                gl.bindFramebuffer(gl.FRAMEBUFFER, buffer.framebuffer);
                gl.viewport(0, 0, this.resolution.width, this.resolution.height);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, buffer.texture, 0);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, buffer.renderbuffer);

                // save the current texture onto the buffer
                this.saveCopyComponent.setCopy(texture);
                this.saveCopyComponent.updateComponent();

                // switch to old framebuffer
                gl.bindFramebuffer(gl.FRAMEBUFFER, targetFrameBuffer);
                gl.viewport(0, 0, this.resolution.width, this.resolution.height);
                break;
            case this.actions.RESTORE:
                this.restoreCopyComponent.setCopy(buffer.texture);
                this.restoreCopyComponent.updateComponent(texture);
                break;
        }
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
            enum: _.keys(blendModes)
        }
    }
};

window.Webvs.BufferSave = BufferSave;
