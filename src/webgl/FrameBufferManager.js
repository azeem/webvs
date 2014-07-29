/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * FrameBufferManager maintains a set of render targets
 * and can switch between them.
 *
 * @param {number} width - the width of the textures to be initialized
 * @param {number} height - the height of the textures to be initialized
 * @param {WebGLRenderingContext} gl - the webgl context to be used
 * @param {Webvs.CopyProgram} copier - an instance of a CopyProgram that should be used
 *                                     when a frame copyOver is required
 * @param {boolean} textureOnly - if set then only textures maintained
 * @constructor
 * @memberof Webvs
 */
function FrameBufferManager(width, height, gl, copier, textureOnly, attachCount) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.copier = copier;
    this.attachCount = _.isUndefined(attachCount)?2:attachCount;
    this.textureOnly = textureOnly;
    this._initFrameBuffers();
}
Webvs.FrameBufferManager = Webvs.defineClass(FrameBufferManager, Object, {
    _initFrameBuffers: function() {
        var gl = this.gl;
        if(!this.textureOnly) {
            this.framebuffer = gl.createFramebuffer();
        }
        this.frameAttachments = [];
        this.refs = {};
        for(var i = 0;i < this.attachCount;i++) {
            this.createAttachment();
        }
    },

    /**
     * Saves the current render target and sets this
     * as the render target
     * @memberof Webvs.FrameBufferManager#
     */
    setRenderTarget: function(refName) {
        var gl = this.gl;
        if(this.textureOnly) {
            this.oldAttachment = this._getFBAttachment();
        } else {
            this.oldFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.viewport(0, 0, this.width, this.height);
        }
        var attachment = null;
        if(refName) {
            var ref = this.refs[refName];
            if(!ref) {
                throw new Error("Unknown attachment reference " + ref);
            }
            attachment = this.frameAttachments[ref.index];
        }
        this._setFBAttachment(attachment);
    },

    /**
     * Restores the render target previously saved with
     * a {@link Webvs.FrameBufferManager.setRenderTarget} call
     * @memberof Webvs.FrameBufferManager#
     */
    restoreRenderTarget: function() {
        var gl = this.gl;
        if(this.textureOnly) {
            this._setFBAttachment(this.oldAttachment);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.oldFrameBuffer);
        }
    },

    /**
     * Returns the texture that is currently being used
     * @returns {WebGLTexture}
     * @memberof Webvs.FrameBufferManager#
     */
    getCurrentTexture: function() {
        return this.frameAttachments[this.currAttachment];
    },

    /**
     * Copies the previous texture into the current texture
     * @memberof Webvs.FrameBufferManager#
     */
    copyOver: function() {
        var prevTexture = this.frameAttachments[Math.abs(this.currAttachment-1)%this.attachCount];
        this.copier.run(null, null, prevTexture);
    },

    /**
     * Swaps the current texture
     * @memberof Webvs.FrameBufferManager#
     */
    swapAttachment : function() {
        this.currAttachment = (this.currAttachment + 1) % this.attachCount;
        this._setFBAttachment();
    },

    createAttachment: function(refName) {
        if(refName in this.refs) {
            this.refs[refName].refCount++;
            return;
        }
        var gl = this.gl;
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height,
                      0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        this.frameAttachments.push(texture);
        if(this.frameAttachments.length == 1) {
            this.currAttachment = 0;
        }

        if(refName) {
            this.refs[refName] = {
                index: this.frameAttachments.length - 1,
                refCount: 1
            };
        }
    },

    unrefAttachment: function(refName) {
        var ref = this.refs[refName];
        if(!ref) {
            return;
        }
        ref.refCount--;
        if(ref.refCount === 0) {
            this.gl.deleteTexture(this.frameAttachments[i]);
            delete this.refs[refName];
        }
    },

    /**
     * cleans up all webgl resources
     * @memberof Webvs.FrameBufferManager#
     */
    destroy: function() {
        var gl = this.gl;
        for(var i = 0;i < this.attachCount;i++) {
            gl.deleteTexture(this.frameAttachments[i]);
        }
    },

    _getFBAttachment: function() {
        var gl = this.gl;
        return gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
    },

    _setFBAttachment: function(attachment) {
        attachment = attachment || this.frameAttachments[this.currAttachment];
        var gl = this.gl;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, attachment, 0);
    },
});

})(Webvs);
