/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * FrameBufferManager maintains a pair of render targets
 * alternating between when requested by different
 * shader programs. Used in EffectLists to compose the different
 * Components
 *
 * width, height - the resolution of the textures to be initialized
 * gl - the webgl context to be used
 * copier - an instance of a CopyProgram that should be used
 *          when a frame copyOver is required
 */
function FrameBufferManager(width, height, gl, copier) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.copier = copier;
    this._initFrameBuffers();
}
Webvs.FrameBufferManager = Webvs.defineClass(FrameBufferManager, Object, {
    _initFrameBuffers: function() {
        var gl = this.gl;

        var framebuffer = gl.createFramebuffer();
        var attachments = [];
        for(var i = 0;i < 2;i++) {
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
     * a saveRenderTarget call
     */
    restoreRenderTarget: function() {
        var gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.inputFrameBuffer);
        gl.viewport(0, 0, this.width, this.height);
    },

    /**
     * Returns the texture that is currently being
     * used
     */
    getCurrentTexture: function() {
        return this.frameAttachments[this.currAttachment].texture;
    },

    /**
     * Copies the previous texture into the current
     * texture
     */
    copyOver: function() {
        var prevTexture = this.frameAttachments[Math.abs(this.currAttachment-1)%2].texture;
        this.copier.run(null, null, prevTexture);
    },

    /**
     * Swaps the current texture
     */
    swapAttachment : function() {
        this.currAttachment = (this.currAttachment + 1) % 2;
        this._setFBAttachment();
    },

    destroy: function() {
        for(var i = 0;i < 2;i++) {
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
