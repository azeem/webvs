import Buffer from "./Buffer";

export default class RenderingContext {
    private buffers: {[name: string]: Buffer} = {};
    constructor(private gl: WebGLRenderingContext) {}

    public getGl() {
        return this.gl;
    }

    public cacheBuffer(name: string, buffer: Buffer) {
        this.buffers[name] = buffer;
    }
    public getBuffer(name: string): Buffer {
        return this.buffers[name];
    }
}
