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
function FrameBufferManager(width, height, gl, copier, textureOnly, texCount) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.copier = copier;
    this.texCount = texCount || 2;
    this.textureOnly = textureOnly;
    this._initFrameBuffers();
}
Webvs.FrameBufferManager = Webvs.defineClass(FrameBufferManager, Object, {
    _initFrameBuffers: function() {
        var gl = this.gl;

        if(!this.textureOnly) {
            this.framebuffer = gl.createFramebuffer();
        }

        var textures = [];
        for(var i = 0;i < this.texCount;i++) {
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height,
                          0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            textures[i] = texture;
        }

        this.textures = textures;
        this.curTex = 0;
    },

    /**
     * Saves the current render target and sets this
     * as the render target
     * @memberof Webvs.FrameBufferManager#
     */
    setRenderTarget: function() {
        var gl = this.gl;
        if(this.textureOnly) {
            this.oldTexture = gl.getFramebufferAttachmentParameter(
                                  gl.FRAMEBUFFER,
                                  gl.COLOR_ATTACHMENT0,
                                  gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
        } else {
            this.oldFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.viewport(0, 0, this.width, this.height);
        }
        var texture = this.textures[this.curTex];
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
                                gl.COLOR_ATTACHMENT0,
                                gl.TEXTURE_2D,
                                texture, 0);
    },

    /**
     * Restores the render target previously saved with
     * a {@link Webvs.FrameBufferManager.setRenderTarget} call
     * @memberof Webvs.FrameBufferManager#
     */
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
    },

    /**
     * Returns the texture that is currently being used
     * @returns {WebGLTexture}
     * @memberof Webvs.FrameBufferManager#
     */
    getCurrentTexture: function() {
        return this.textures[this.curTex];
    },

    /**
     * Copies the previous texture into the current texture
     * @memberof Webvs.FrameBufferManager#
     */
    copyOver: function() {
        var prevTexture = this.textures[(this.texCount+this.curTex-1)%this.texCount];
        this.copier.run(null, null, prevTexture);
    },

    /**
     * Swaps the current texture
     * @memberof Webvs.FrameBufferManager#
     */
    switchTexture: function() {
        this.curTex = (this.curTex+1) % this.texCount;
        var texture = this.textures[this.curTex];
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
                                gl.COLOR_ATTACHMENT0,
                                gl.TEXTURE_2D, texture, 0);
    },

    /**
     * cleans up all webgl resources
     * @memberof Webvs.FrameBufferManager#
     */
    destroy: function() {
        var gl = this.gl;
        for(var i = 0;i < this.texCount;i++) {
            gl.deleteTexture(this.textures[i]);
        }
        if(!this.textureOnly) {
            gl.deleteFrameBuffer(this.frameBuffer);
        }
    }
});

})(Webvs);
