import isNumber from "lodash-es/isNumber";
import isString from "lodash-es/isString";
import isUndefined from "lodash-es/isUndefined";
import RenderingContext from "./RenderingContext";
import ShaderProgram from "./ShaderProgram";

interface ITextureNameMeta {
    refCount: number;
    index: number;
}

/**
 * TextureSetManager maintains a set of named/indexed textures and optionally, a
 * FrameBuffer for offscreen rendering.
 */
export default class TextureSetManager {
    private rctx: RenderingContext;
    private copier: ShaderProgram;
    private initTexCount: number;
    private hasFrameBuffer: boolean;
    private framebuffer: WebGLFramebuffer;
    private names: {[key: string]: ITextureNameMeta};
    private textures: WebGLTexture[];
    private curTex: number;
    private oldTexture: WebGLTexture;
    private oldFrameBuffer: WebGLFramebuffer;
    private isRenderTarget: boolean;

    /**
     * Creates a new TextureSetManager
     * @param rctx the rendering context in which the textures and buffers will be created
     * @param copier an instance of a copier program
     * @param hasFrameBuffer if true, then a FrameBuffer is also created
     * @param texCount initial number of textures
     */
    constructor(rctx: RenderingContext, copier: ShaderProgram, hasFrameBuffer: boolean = false, texCount: number = 2) {
        this.rctx = rctx;
        this.copier = copier;
        this.initTexCount = texCount;
        this.hasFrameBuffer = hasFrameBuffer;
        this.init();
    }

    /**
     * Adds the texture
     * @param name name of the texture
     */
    public addTexture(name?: string): number {
        if (name && name in this.names) {
            this.names[name].refCount++;
            return this.names[name].index;
        }
        const gl = this.rctx.getGl();
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth,
                      gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        this.textures.push(texture);
        if (name) {
            this.names[name] = {
                index: this.textures.length - 1,
                refCount: 1,
            };
        }
        return this.textures.length - 1;
    }

    /**
     * Removes a texture
     * @param nameOrIndex name or index of the texture to be removed
     */
    public removeTexture(nameOrIndex: string | number) {
        if (isString(nameOrIndex) && nameOrIndex in this.names) {
            if (this.names[nameOrIndex].refCount > 1) {
                this.names[nameOrIndex].refCount--;
                return;
            }
        }
        const index = this.findIndex(nameOrIndex);
        if (index === this.curTex && (this.oldTexture || this.oldFrameBuffer)) {
            throw new Error("Cannot remove current texture when set as render target");
        }
        const gl = this.rctx.getGl();
        gl.deleteTexture(this.textures[index]);
        this.textures.splice(index, 1);
        if (this.curTex >= this.textures.length) {
            this.curTex = this.textures.length - 1;
        }
        if (typeof nameOrIndex === "string") {
            delete this.names[nameOrIndex];
        }
    }

    /**
     * Sets the current texture as the frame buffer attachment. If `hasFrameBuffer` is true
     * then the FrameBuffer manager is bound and the texture is set as the frame buffer attachment.
     * @param texName name of the texture to set as target. If undefined then we cycle
     *                through to next texture
     */
    public setAsRenderTarget(texName?: string) {
        const gl = this.rctx.getGl();
        const curFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer;
        if (!this.hasFrameBuffer) {
            if (!curFrameBuffer) {
                throw new Error("Cannot set texture when current rendertarget is the default FrameBuffer");
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
        if (!isUndefined(texName)) {
            this.switchTexture(texName);
        } else {
            const texture = this.textures[this.curTex];
            gl.framebufferTexture2D(gl.FRAMEBUFFER,
                                    gl.COLOR_ATTACHMENT0,
                                    gl.TEXTURE_2D,
                                    texture, 0);
        }
    }

    /**
     * Restores the texture attachment or framebuffer that was set
     * with a previous call to [[TextureSetManager.setAsRenderTarget]]
     */
    public unsetAsRenderTarget() {
        const gl = this.rctx.getGl();
        if (!this.hasFrameBuffer) {
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
    }

    /**
     * Returns the current texture.
     *
     * TextureSetManager has this notion of current texture
     * that it can cycle through the set of all textures.
     */
    public getCurrentTexture(): WebGLTexture {
        return this.textures[this.curTex];
    }

    /**
     * Returns the texture at given index or with given nam,e
     * @param nameorIndex name of index of the texture to be returned
     */
    public getTexture(nameOrIndex: string | number): WebGLTexture {
        const index = this.findIndex(nameOrIndex);
        return this.textures[index];
    }

    /**
     * Copies previous texture into current texture.
     */
    public copyOver() {
        const texCount = this.textures.length;
        const prevTexture = this.textures[(texCount + this.curTex - 1) % texCount];
        this.copier.run(null, {srcTexture: prevTexture});
    }

    /**
     * Sets the current texture and sets it as the current frame buffer attachment
     * @param nameOrIndex name or index of the texture. If undefined then we cycle through
     *                    to next texture
     */
    public switchTexture(nameOrIndex: string | number = (this.curTex + 1) % this.textures.length) {
        if (!this.isRenderTarget) {
            throw new Error("Cannot switch texture when not set as rendertarget");
        }
        const gl = this.rctx.getGl();
        this.curTex = this.findIndex(nameOrIndex);
        const texture = this.textures[this.curTex];
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
                                gl.COLOR_ATTACHMENT0,
                                gl.TEXTURE_2D, texture, 0);
    }

    /**
     * Resizes all textures
     */
    public resize() {
        // TODO: investigate chrome warning: INVALID_OPERATION: no texture
        const gl = this.rctx.getGl();
        for (const texture of this.textures) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth,
                          gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
    }

    /**
     * Destroys all texture and framebuffer
     */
    public destroy() {
        const gl = this.rctx.getGl();
        for (const texture of this.textures) {
            gl.deleteTexture(texture);
        }
        if (this.hasFrameBuffer) {
            gl.deleteFramebuffer(this.framebuffer);
        }
    }

    private init() {
        const gl = this.rctx.getGl();

        if (this.hasFrameBuffer) {
            this.framebuffer = gl.createFramebuffer();
        }

        this.names = {};
        this.textures = [];
        for (let i = 0; i < this.initTexCount; i++) {
            this.addTexture();
        }
        this.curTex = 0;
        this.isRenderTarget = false;
    }

    private findIndex(arg: string | number): number {
        let index;
        if (isString(arg) && arg in this.names) {
            index = this.names[arg].index;
        } else if (isNumber(arg) && arg >= 0 && arg < this.textures.length) {
            index = arg;
        } else {
            // tslint:disable-next-line:no-console
            console.log("arg = ", typeof(arg), "textures = ", this.textures);
            throw new Error("Unknown texture '" + arg + "'");
        }
        return index;
    }
}
