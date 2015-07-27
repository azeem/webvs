(function(Webvs) {

function MaterialShader(gl, vertexShader, dynamicBlend) {
    MaterialShader.super.constructor.call(this, gl, {
        copyOnSwap: true,
        vertexShader: vertexShader,
        dynamicBlend: !!dynamicBlend,
        fragmentShader:[
            "varying vec3 v_light;",
            "void main() {",
            " setFragColor(vec4(v_light, 1.0));",
            "}"
        ].join("\n")
    });
}
Webvs.MaterialShader = Webvs.defineClass(MaterialShader, Webvs.ShaderProgram, {
    drawObject: function() {
        throw new Error("drawObject not implemented");
    }
});

})(Webvs);
