(function(Webvs) {

function NormalMaterialShader(gl) {
    NormalMaterialShader.super.constructor.call(this, gl, [
        "attribute vec3 a_position;",
        "attribute vec3 a_normal;",
        "varying vec3 v_light;",
        "uniform mat4 u_matrix;",
        "void main() {",
        "    vec4 pos4 = u_matrix * vec4(a_position, 1.0);",
        "    setPosition4(pos4);",
        "    v_light = (a_normal+1.0)/2.0;",
        "}",
    ].join("\n"));
}
Webvs.NormalMaterialShader = Webvs.defineClass(NormalMaterialShader, Webvs.MaterialShader, {
    draw: function(geometry, material, matrix) {
        var gl = this.gl;
        this.setUniform("u_matrix", "Matrix4fv", false, matrix.elements);
        this.setAttrib("a_position", geometry.vertexBuffer, 3);
        this.setAttrib("a_normal", geometry.normalBuffer, 3);
        this.setIndex(geometry.indexBuffer);
        gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
    }
});

})(Webvs);
