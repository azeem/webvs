import { TypedArray, isTypedArray } from "../utils";

export default class Buffer {
    private type: number;
    private gl: WebGLRenderingContext;
    private glBuffer: WebGLBuffer;
    private length: number;

    constructor(gl: WebGLRenderingContext, isElemArray: boolean, data) {
        this.type = isElemArray?gl.ELEMENT_ARRAY_BUFFER:gl.ARRAY_BUFFER;
        this.gl = gl;
        this.glBuffer = gl.createBuffer();
        this.length = 0;
        if(data) {
            this.setData(data);
        }
    }

    setData(array: number[] | TypedArray) {
        if(!isTypedArray(array)) {
            array = new Float32Array(array);
        }
        this.length = array.length;
        this.gl.bindBuffer(this.type, this.glBuffer);
        this.gl.bufferData(this.type, array, this.gl.STATIC_DRAW);
    }

    destroy() {
        this.gl.deleteBuffer(this.glBuffer);
    }
}
