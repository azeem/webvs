import { isTypedArray, TypedArray } from "../utils";
import RenderingContext from "./RenderingContext";

export default class Buffer {
    public length: number;
    private type: number;
    private rctx: RenderingContext;
    private glBuffer: WebGLBuffer;

    constructor(rctx: RenderingContext, isElemArray: boolean = false, data?: number[] | TypedArray) {
        const gl = rctx.gl;
        this.type = isElemArray ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
        this.rctx = rctx;
        this.glBuffer = gl.createBuffer();
        this.length = 0;
        if (data) {
            this.setData(data);
        }
    }

    public setData(array: number[] | TypedArray) {
        if (!isTypedArray(array)) {
            array = new Float32Array(array);
        }
        const gl = this.rctx.gl;
        this.length = array.length;
        gl.bindBuffer(this.type, this.glBuffer);
        gl.bufferData(this.type, array, gl.STATIC_DRAW);
    }

    public getGlBuffer(): WebGLBuffer {
        return this.glBuffer;
    }

    public destroy() {
        this.rctx.gl.deleteBuffer(this.glBuffer);
    }
}
