/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// FrameBufferManager maintains a set of render targets
// and can switch between them.
function FrameBufferManager(gl, copier, textureOnly, texCount) {
    this.gl = gl;
    this.copier = copier;
    this.initTexCount = _.isNumber(texCount)?texCount:2;
    this.textureOnly = textureOnly;
    this._initFrameBuffers();
}
Webvs.FrameBufferManager = Webvs.defineClass(FrameBufferManager, Object, {
    _initFrameBuffers: function() {
        var gl = this.gl;

        if(!this.textureOnly) {
            this.framebuffer = gl.createFramebuffer();
        }

        this.names = {};
        this.textures = [];
        for(var i = 0;i < this.initTexCount;i++) {
            this.addTexture();
        }
        this.curTex = 0;
        this.isRenderTarget = false;
    },

    addTexture: function(name) {
        if(name && name in this.names) {
            this.names[name].refCount++;
            return this.names[name];
        }
        var gl = this.gl;
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth,
                      gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        this.textures.push(texture);
        if(name) {
            this.names[name] = {
                refCount: 1,
                index: this.textures.length-1
            };
        }
        return this.textures.length-1;
    },

    removeTexture: function(arg) {
        if(_.isString(arg) && arg in this.names) {
            if(this.names[arg].refCount > 1) {
                this.names[arg].refCount--;
                return;
            }
        }
        var index = this._findIndex(arg);
        if(index == this.curTex && (this.oldTexture || this.oldFrameBuffer)) {
            throw new Error("Cannot remove current texture when set as render target");
        }
        var gl = this.gl;
        gl.deleteTexture(this.textures[index]);
        this.textures.splice(index, 1);
        if(this.curTex >= this.textures.length) {
            this.curTex = this.textures.lenght-1;
        }
        delete this.names[arg];
    },

    // Saves the current render target and sets this
    // as the render target
    setRenderTarget: function(texName) {
        var gl = this.gl;
        var curFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        if(this.textureOnly) {
            if(!curFrameBuffer) {
                throw new Error("Cannot use textureOnly when current rendertarget is the default FrameBuffer");
            }
            this.oldTexture = gl.getFramebufferAttachmentParameter(
                                  gl.FRAMEBUFFER,
                                  gl.COLOR_ATTACHMENT0,
                                  gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
        } else {
            this.oldFrameBuffer = curFrameBuffer;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        }
        this.isRenderTarget = true;
        if(!_.isUndefined(texName)) {
            this.switchTexture(texName);
        } else {
            var texture = this.textures[this.curTex];
            gl.framebufferTexture2D(gl.FRAMEBUFFER,
                                    gl.COLOR_ATTACHMENT0,
                                    gl.TEXTURE_2D,
                                    texture, 0);
        }
    },

    // Restores the render target previously saved with
    // a Webvs.FrameBufferManager.setRenderTarget call
    restoreRenderTarget: function() {
        var gl = this.gl;
        if(this.textureOnly) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER,
                                    gl.COLOR_ATTACHMENT0,
                                    gl.TEXTURE_2D,
                                    this.oldTexture, 0);
            this.oldTexture = null;
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.oldFrameBuffer);
            this.oldFrameBuffer = null;
        }
        this.isRenderTarget = false;
    },

    // Returns the texture that is currently being used
    getCurrentTexture: function() {
        return this.textures[this.curTex];
    },

    getTexture: function(arg) {
        var index = this._findIndex(arg);
        return this.textures[index];
    },

    // Copies the previous texture into the current texture
    copyOver: function() {
        var texCount = this.textures.length;
        var prevTexture = this.textures[(texCount+this.curTex-1)%texCount];
        this.copier.run(null, null, prevTexture);
    },

    // Swaps the current texture
    switchTexture: function(arg) {
        if(!this.isRenderTarget) {
            throw new Error("Cannot switch texture when not set as rendertarget");
        }
        var gl = this.gl;
        this.curTex = _.isUndefined(arg)?(this.curTex+1):this._findIndex(arg);
        this.curTex %= this.textures.length;
        var texture = this.textures[this.curTex];
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
                                gl.COLOR_ATTACHMENT0,
                                gl.TEXTURE_2D, texture, 0);
    },

    resize: function() {
        // TODO: investigate chrome warning: INVALID_OPERATION: no texture
        var gl = this.gl;
        for(var i = 0;i < this.textures.length;i++) {
            gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth,
                          gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
    },

    // cleans up all webgl resources
    destroy: function() {
        var gl = this.gl;
        for(var i = 0;i < this.textures.length;i++) {
            gl.deleteTexture(this.textures[i]);
        }
        if(!this.textureOnly) {
            gl.deleteFramebuffer(this.frameBuffer);
        }
    },

    _findIndex: function(arg) {
        var index;
        if(_.isString(arg) && arg in this.names) {
            index = this.names[arg].index;
        } else if(_.isNumber(arg) && arg >=0 && arg < this.textures.length) {
            index = arg;
        } else {
            throw new Error("Unknown texture '" + arg + "'");
        }
        return index;
    }
});

})(Webvs);
