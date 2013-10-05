/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function CopyProgram(options) {
    options = _.defautls(options, {
        fragmentShader: [
            "uniform sampler2D u_copySource;",
            "void main() {",
            "   setFragColor(texture2D(u_copySource, v_position));",
            "}"
        ]
    });
    CopyProgram.super.constructor.call(this, options);
}
Webvs.CopyProgram = Webvs.defineClass(CopyProgram, Webvs.QuadBoxProgram, {
    run: function(srcTexture) {
        this.setUniform("u_copySource", "texture2D", srcTexture);
        CopyProgram.super.run.apply(this, _.drop(arguments, 1));
    }
});

})(Webvs);
