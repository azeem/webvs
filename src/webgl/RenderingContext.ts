import Buffer from "./Buffer";

/**
 * Rendering Context wraps WebGLRenderingContext and
 * a cache for shared Buffers.
 */
export default class RenderingContext {
    private buffers: {[name: string]: Buffer} = {};
    /**
     * Creates a new RenderingContext
     * @param gl the WebGLRenderingContext to be used
     */
    constructor(private gl: WebGLRenderingContext) {}

    /**
     * Returns the WebGLRenderingContext
     */
    public getGl(): WebGLRenderingContext {
        return this.gl;
    }

    /**
     * Caches given buffer in this context
     * @param name cache key for the buffer
     * @param buffer the buffer to be cached
     */
    public cacheBuffer(name: string, buffer: Buffer) {
        this.buffers[name] = buffer;
    }

    /**
     * Returns a buffer that was previously cached with a
     * [[RenderingContext.cacheBuffer]] call
     * @param name cache key
     */
    public getBuffer(name: string): Buffer {
        return this.buffers[name];
    }
}
