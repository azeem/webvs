(function(Webvs) {

function NormalMaterialShader(gl) {
    NormalMaterialShader.super.constructor.call(this, gl, [
        "attribute vec3 a_position;",
        "attribute vec3 a_normal;",
        "varying vec4 v_pos4;",
        "varying vec3 v_light;",
        "uniform mat4 u_matrix;",
        "void main() {",
        "    v_pos4 = u_matrix * vec4(a_position, 1.0);",
        "    setPosition4(v_pos4);",
        "    v_light = (a_normal+1.0)/2.0;",
        "}",
    ].join("\n"));
}
Webvs.NormalMaterialShader = Webvs.defineClass(NormalMaterialShader, Webvs.MaterialShader, {
    draw: function(mesh, matrix) {
        var gl = this.gl;
        this.setUniform("u_matrix", "Matrix4fv", false, matrix);
        this.setVertexAttribArray("a_position", new Float32Array(mesh.vertices), 3);
        this.setVertexAttribArray("a_normal", new Float32Array(mesh.vertexNormals), 3);
        this.setElementArray(new Uint16Array(mesh.indices));
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    }
});

})(Webvs);
