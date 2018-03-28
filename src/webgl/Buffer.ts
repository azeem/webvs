import { isTypedArray, TypedArray } from "../utils";
import RenderingContext from "./RenderingContext";

/**
 * Buffer is a wrapper around WebGLBuffer with type and size information.
 */
export default class Buffer {
    private length: number;
    private type: number;
    private rctx: RenderingContext;
    private glBuffer: WebGLBuffer;

    /**
     * Creates new Buffer
     *
     * @param rctx the rendering context in which the buffer should be created
     * @param isElemArray if true then a `gl.ELEMENT_ARRAY_BUFFER` is created else a `gl.ARRAY_BUFFER`
     * @param data the data to be stored in the buffer
     */
    constructor(rctx: RenderingContext, isElemArray: boolean = false, data?: number[] | TypedArray) {
        const gl = rctx.getGl();
        this.type = isElemArray ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
        this.rctx = rctx;
        this.glBuffer = gl.createBuffer();
        this.length = 0;
        if (data) {
            this.setData(data);
        }
    }

    /**
     * Sets the data stored in the buffer
     *
     * @param array the data to be stored in the buffer
     */
    public setData(array: number[] | TypedArray) {
        if (!isTypedArray(array)) {
            array = new Float32Array(array);
        }
        const gl = this.rctx.getGl();
        this.length = array.length;
        gl.bindBuffer(this.type, this.glBuffer);
        gl.bufferData(this.type, array, gl.STATIC_DRAW);
    }

    /**
     * Returns the WebGLBuffer for this Buffer
     */
    public getGlBuffer(): WebGLBuffer {
        return this.glBuffer;
    }

    /**
     * Returns the length of the data
     */
    public getLength(): number {
        return this.length;
    }

    /**
     * Destroys the buffer
     */
    public destroy() {
        this.rctx.getGl().deleteBuffer(this.glBuffer);
    }
}
