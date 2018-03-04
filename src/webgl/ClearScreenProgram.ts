import { BlendModes, WebGLVarType } from "../utils";
import QuadBoxProgram from "./QuadBoxProgram";
import RenderingContext from "./RenderingContext";

// A Shader that clears the screen to a given color
export default class ClearScreenProgram extends QuadBoxProgram {
    constructor(rctx: RenderingContext, blendMode: BlendModes) {
        super(rctx, {
            fragmentShader: [
                "uniform vec3 u_color;",
                "void main() {",
                "   setFragColor(vec4(u_color, 1));",
                "}"
            ],
            blendMode: blendMode
        });
    }

    // Renders this shader
    draw(color) {
        this.setUniform("u_color", WebGLVarType._3FV, color);
        super.draw();
    }
}