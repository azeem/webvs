/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function QuadBoxProgram(options) {
    options = _.defautls(options, {
        vertexShader: [
            "attribute vec2 a_position;",
            "void main() {",
            "   setPosition(a_position);",
            "}"
        ],
        varyingPos: true;
    });
    QuadBoxProgram.super.constructor.call(this, options);
}
Webvs.QuadBoxProgram = Webvs.defineClass(CopyProgram, Webvs.ShaderProgram, {
    run: function() {
        this.setVertexAttribArray(
            "a_position", 
            new Float32Array([
                -1,  -1,
                1,  -1,
                -1,  1,
                -1,  1,
                1,  -1,
                1,  1
            ])
        );
        QuadBoxProgram.super.run.apply(this, arguments);
    }
});

})(Webvs);
