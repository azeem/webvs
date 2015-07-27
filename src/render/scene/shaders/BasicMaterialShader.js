(function(Webvs) {

function BasicMaterialShader(gl) {
    BasicMaterialShader.super.constructor.call(this, gl, [
        "attribute vec3 a_position;",
        "uniform vec3 u_color;",
        "uniform mat4 u_matrix;",
        "varying vec3 v_light;",
        "void main() {",
        "    vec4 pos4 = u_matrix * vec4(a_position, 1.0);",
        "    setPosition4(pos4);",
        "    v_light = u_color;",
        "}",
    ].join("\n"));
}
Webvs.BasicMaterialShader = Webvs.defineClass(BasicMaterialShader, Webvs.MaterialShader, {
    draw: function(geometry, material, matrix) {
        var gl = this.gl;
        this.setUniform("u_matrix", "Matrix4fv", false, matrix.elements);
        this.setUniform("u_color", "3fv", material.color.toArray());
        this.setAttrib("a_position", geometry.vertexBuffer, 3);
        this.setIndex(geometry.indexBuffer);
        gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
    }
});

})(Webvs);
