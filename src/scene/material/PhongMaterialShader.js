(function(Webvs) {

function PhongMaterialShader(gl) {
    VoxerPhongMaterialShader.super.constructor.call(this, gl, [
        "attribute vec3 a_position;",
        "attribute vec3 a_normal;",

        "varying vec4 v_pos4;",
        "varying vec3 v_light;",

        "uniform mat4 u_matrix;",
        "uniform mat3 u_nMatrix;",

        "uniform int u_lightType;",
        "uniform vec3 u_lightVector;",
        "uniform vec3 u_lightColor;",

        "uniform vec3 u_kSpecular;",
        "uniform vec3 u_kDiffuse;",
        "uniform vec3 u_kAmbient;",
        "uniform float u_shininess;",

        "void main() {",
        "    v_pos4 = u_matrix * vec4(a_position, 1.0);",
        "    setPosition4(v_pos4);",
        "    vec3 tNormal = normalize(u_nMatrix * a_normal);",
        "    if(u_lightType == 1) {", // ambient
        "        v_light = u_lightColor * u_kAmbient;",
        "    } else {",
        "        vec3 lightDir;",
        "        if(u_lightType == 2) {", //directional
        "            lightDir = -u_lightVector;",
        "        }",
        "        if(u_lightType == 3) {", //point
        "            lightDir = normalize(u_lightVector - v_pos4.xyz);",
        "        }",
        "        vec3 reflDir = 2.0*dot(lightDir, tNormal)-lightDir;",
        "        float dTerm = dot(lightDir, tNormal);",
        "        float sTerm = dot(reflDir, vec3(0,0,-1));",
        "        if(dTerm > 0.0) {",
        "            v_light = u_kDiffuse * dTerm * u_lightColor;",
        "            if(sTerm > 0.0) {",
        "                v_light += u_kSpecular * pow(sTerm, u_shininess) * u_lightColor;",
        "            }",
        "        }",
        "    }",
        "}"
    ], true);
}
Webvs.PhongMaterialShader = Webvs.defineClass(PhongMaterialShader, Webvs.MaterialShader, {
    draw: function(mesh, matrix, nMatrix, lights, material) {
        var gl = this.gl;
        this.setUniform("u_matrix", "Matrix4fv", false, matrix);
        this.setUniform("u_nMatrix", "Matrix3fv", false, nMatrix);

        this.setUniform("u_kSpecular", "3fv", material.specular);
        this.setUniform("u_kDiffuse", "3fv", material.diffuse);
        this.setUniform("u_kAmbient", "3fv", material.ambient);
        this.setUniform("u_shininess", "1f", material.shininess);

        this.setVertexAttribArray("a_position", new Float32Array(mesh.vertices), 3);
        this.setVertexAttribArray("a_normal", new Float32Array(mesh.vertexNormals), 3);
        this.setElementArray(new Uint16Array(mesh.indices));

        this._setGlBlendMode(Webvs.REPLACE);
        for(var i = 0;i < lights.length;i++) {
            // probably not such a clean way
            // to set blend modes inside draw function
            // like this. but works for ADDITIVE
            if(i == 1) {
                this._setGlBlendMode(Webvs.ADDITIVE);
            }
            var light = lights[i];
            this.setUniform("u_lightType", "1i", light.type);
            this.setUniform("u_lightVector", "3fv", light.vector);
            this.setUniform("u_lightColor", "3fv", light.color);
            gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        }
    }
});

})(Webvs);
