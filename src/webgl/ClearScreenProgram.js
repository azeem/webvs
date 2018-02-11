/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A Shader that clears the screen to a given color
function ClearScreenProgram(gl, blendMode) {
    ClearScreenProgram.super.constructor.call(this, gl, {
        fragmentShader: [
            "uniform vec3 u_color;",
            "void main() {",
            "   setFragColor(vec4(u_color, 1));",
            "}"
        ],
        blendMode: blendMode
    });
}
Webvs.ClearScreenProgram = Webvs.defineClass(ClearScreenProgram, Webvs.QuadBoxProgram, {
    // Renders this shader
    draw: function(color) {
        this.setUniform("u_color", "3fv", color);
        ClearScreenProgram.super.draw.call(this);
    }
});

})(Webvs);
