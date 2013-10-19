/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * FrameBufferManager maintains a set of render targets
 * and switches between them, when requested by different
 * shader programs. Its used in EffectLists to compose rendering
 * of the different {@link Webvs.Component}
 *
 * @param {number} width - the width of the textures to be initialized
 * @param {number} height - the height of the textures to be initialized
 * @param {WebGLRenderingContext} gl - the webgl context to be used
 * @param {Webvs.CopyProgram} copier - an instance of a CopyProgram that should be used
 *                                     when a frame copyOver is required
 * @constructor
 * @memberof Webvs
 */
function FrameBufferManager(width, height, gl, copier, texCount) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.copier = copier;
    this.texCount = texCount || 2;
    this._initFrameBuffers();
}
Webvs.FrameBufferManager = Webvs.defineClass(FrameBufferManager, Object, {
    _initFrameBuffers: function() {
        var gl = this.gl;

        var framebuffer = gl.createFramebuffer();
        var attachments = [];
        for(var i = 0;i < this.texCount;i++) {
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height,
                0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            var renderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);

            attachments[i] = {
                texture: texture,
                renderbuffer: renderbuffer
            };
        }

        this.framebuffer = framebuffer;
        this.frameAttachments = attachments;
        this.currAttachment = 0;
    },

    /**
     * Saves the current render target and sets this
     * as the render target
     * @memberof Webvs.FrameBufferManager
     */
    setRenderTarget: function() {
        var gl = this.gl;
        this.inputFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.width, this.height);
        this._setFBAttachment();
    },

    /**
     * Restores the render target previously saved with
     * a {@link Webvs.FrameBufferManager.setRenderTarget} call
     * @memberof Webvs.FrameBufferManager
     */
    restoreRenderTarget: function() {
        var gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.inputFrameBuffer);
        gl.viewport(0, 0, this.width, this.height);
    },

    /**
     * Returns the texture that is currently being used
     * @returns {WebGLTexture}
     * @memberof Webvs.FrameBufferManager
     */
    getCurrentTexture: function() {
        return this.frameAttachments[this.currAttachment].texture;
    },

    /**
     * Copies the previous texture into the current texture
     * @memberof Webvs.FrameBufferManager
     */
    copyOver: function() {
        var prevTexture = this.frameAttachments[Math.abs(this.currAttachment-1)%this.texCount].texture;
        this.copier.run(null, null, prevTexture);
    },

    /**
     * Swaps the current texture
     * @memberof Webvs.FrameBufferManager
     */
    swapAttachment : function() {
        this.currAttachment = (this.currAttachment + 1) % this.texCount;
        this._setFBAttachment();
    },

    /**
     * cleans up all webgl resources
     * @memberof Webvs.FrameBufferManager
     */
    destroy: function() {
        for(var i = 0;i < this.texCount;i++) {
            gl.deleteRenderbuffer(this.frameAttachments[i].renderbuffer);
            gl.deleteTexture(this.frameAttachments[i].texture);
        }
        gl.deleteFramebuffer(this.framebuffer);
    },


    _setFBAttachment: function() {
        var attachment = this.frameAttachments[this.currAttachment];
        var gl = this.gl;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, attachment.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, attachment.renderbuffer);
    },
});

})(Webvs);
