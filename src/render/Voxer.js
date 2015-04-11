(function(Webvs) {

function Voxer(gl, main, parent, opts) {
    Voxer.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(Voxer, {
    name: "Voxer",
    menu: "Render"
});

Webvs.defineClass(Voxer, Webvs.Component, {
    defaultOptions: {
        code: {
            init: "",
            onBeat: "",
            perFrame: "",
            perObject: ""
        },
        modelSrc: "cube.obj",
        material: {
            type: "phong",
            ambient: "#ff00ff",
            specular: "#777777",
            diffuse: "#777777",
            shininess: 30
        },
        ambientLightColor: "#000000",
        lights: [
            {
                type: "point",
                position: { x:0, y:0, z:-2},
                color: "#000022"
            }
        ]
    },

    onChange: {
        code: "updateCode",
        modelSrc: "updateModel",
        lights: ["updateLights", "updateProgram"],
        ambientLightColor: "updateAmbientLightColor",
        material: "updateMaterial"
    },

    init: function() {
        this.updateCode();
        this.updateModel();
        this.updateAmbientLightColor();
        this.updateMaterial();
        this.updateLights();
        this.updateProgram();
    },

    draw: function() {
        var gl = this.gl;
        var i, object3d;
        var code = this.code;
        if(!this.inited) {
            code.init();
            this.objects = [];
            for(i = 0;i < code.n;i++) {
                object3d = {
                    position: vec3.create(),
                    quaternion: quat.create(),
                    scale: vec3.create()
                };
                object3d.positionCodeRef = this.code._vec3.length;
                this.code._vec3.push(object3d.position);

                object3d.scaleCodeRef = this.code._vec3.length;
                this.code._vec3.push(object3d.scale);

                object3d.quaternionCodeRef = this.code._quat.length;
                this.code._quat.push(object3d.quaternion);

                this.objects.push(object3d);
            }
        }

        code.perFrame();
        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        if(beat) {
            code.onBeat();
        }

        var oldDepthTest = gl.getParameter(gl.DEPTH_TEST);
        var oldDepthFunc = gl.getParameter(gl.DEPTH_FUNC);
        console.log(oldDepthTest);
        console.log(oldDepthFunc);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);

        for(i = 0;i < code.n;i++) {
            object3d = this.objects[i];
            code.i = i;
            code.position = object3d.positionCodeRef;
            code.quaternion = object3d.quaternionCodeRef;
            code.scale = object3d.scaleCodeRef;
            code.perObject();

            var scale = vec3.fromValues(0.03, 0.03, 0.03);
            var position;
            quat.rotateY(object3d.quaternion, object3d.quaternion, Math.PI);
            if(i === 0) {
                position = vec3.fromValues(0, 0, 0);
            } else {
                position = vec3.fromValues(0.5, 0, 0.2);
            }

            var matrix = mat4.identity(mat4.create());
            mat4.fromRotationTranslation(matrix, object3d.quaternion, position);
            mat4.scale(matrix, matrix, scale);

            var nMatrix = mat3.create();
            mat3.fromMat4(nMatrix, matrix);
            mat3.invert(nMatrix, nMatrix);
            mat3.transpose(nMatrix, nMatrix);

            this.program.run(this.parent.fm, null, this.mesh, matrix, nMatrix, this.material, this.ambientLightColor);
        }
        if(oldDepthTest) {
            gl.enable(gl.DEPTH_TEST);
        }
        gl.depthFunc(oldDepthFunc);
    },

    computeVertexNormals: function () {
        var i, j, index;
        var vertices = this.mesh.vertices;
        var indices = this.mesh.indices;

        // compute face normals
        var faceNormals = new Array(indices.length/3);
        for(i = 0,j = 0;i < indices.length;i+=3,j++) {
            index = indices[i] * 3;
            var vA = vec3.fromValues(vertices[index],
                                     vertices[index+1],
                                     vertices[index+2]);
            index = indices[i+1] * 3;
            var vB = vec3.fromValues(vertices[index],
                                     vertices[index+1],
                                     vertices[index+2]);
            index = indices[i+2] * 3;
            var vC = vec3.fromValues(vertices[index],
                                     vertices[index+1],
                                     vertices[index+2]);
            var cb = vec3.create();
            var ab = vec3.create();
            cb = vec3.sub(cb, vC, vB);
            ab = vec3.sub(ab, vA, vB);

            vec3.cross(cb, cb, ab);
            vec3.normalize(cb, cb);
            faceNormals[j] = cb;
        }

        // initialize vertex normal vectors
        var vertexNormals = new Array(vertices.length/3);
        for(i = 0;i < vertexNormals.length;i++) {
            vertexNormals[i] = vec3.create();
        }

        // add facenormal of face each of its vertices
        for(i = 0;i < faceNormals.length;i++) {
            var faceNormal = faceNormals[i];
            faceIndex = i*3;
            vec3.add(vertexNormals[indices[faceIndex]], vertexNormals[indices[faceIndex]], faceNormal);
            vec3.add(vertexNormals[indices[faceIndex+1]], vertexNormals[indices[faceIndex+1]], faceNormal);
            vec3.add(vertexNormals[indices[faceIndex+2]], vertexNormals[indices[faceIndex+2]], faceNormal);
        }

        var flatVertexNormals = new Array(vertices.length);
        // normalize and flatten vertex normals
        for(i = 0;i < vertexNormals.length;i++) {
            var vertexNormal = vertexNormals[i];
            vec3.normalize(vertexNormal, vertexNormal);
            index = i * 3;
            flatVertexNormals[index] = vertexNormal[0];
            flatVertexNormals[index+1] = vertexNormal[1];
            flatVertexNormals[index+2] = vertexNormal[2];
        }

        this.mesh.vertexNormals = flatVertexNormals;
    },

    updateCode: function() {
        var code = Webvs.compileExpr(this.opts.code, ["init", "onBeat", "perFrame", "perObject"]).codeInst;
        code.n = 1;
        code.setup(this.main, this);
        this.inited = false;
        this.code = code;
    },

    updateModel: function() {
        this.main.rsrcMan.getMesh(
            this.opts.modelSrc,
            function(mesh) {
                this.mesh = mesh;
                if(this.mesh.vertexNormals.length === 0) {
                    this.computeVertexNormals();
                }
            },
            null,
            this
        );
    },

    updateProgram: function() {
        var program = new VoxerShader(this.gl, this.lights);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    },

    updateMaterial: function() {
        this.material = {
            ambient: Webvs.parseColorNorm(this.opts.material.ambient),
            specular: Webvs.parseColorNorm(this.opts.material.specular),
            diffuse: Webvs.parseColorNorm(this.opts.material.diffuse),
            shininess: this.opts.material.shininess
        };
    },

    updateAmbientLightColor: function() {
        this.ambientLightColor = Webvs.parseColorNorm(this.opts.ambientLightColor);
    },

    updateLights: function() {
        this.lights = _.map(this.opts.lights, function(light) {
            var color;
            switch(light.type) {
                case "directional":
                    var direction = vec3.fromValues(light.direction.x,
                                                    light.direction.y,
                                                    light.direction.z);
                    vec3.normalize(direction, direction);

                    color = Webvs.parseColorNorm(light.color);
                    return {type: light.type, color: color, direction: direction};
                case "point":
                    var position = vec3.fromValues(light.position.x,
                                                   light.position.y,
                                                   light.position.z);
                    color = Webvs.parseColorNorm(light.color);
                    return {type: light.type, color: color, position: position};
                default:
                    throw new Error("Unknow Light type");
            }
       });
    }
});

function VoxerShader(gl, lights) {
    VoxerShader.super.constructor.call(this, gl, {
        copyOnSwap: true,
        vertexShader: VoxerShader.vertexShaderTemplate({lights: lights}),
        fragmentShader: VoxerShader.fragmentShaderTemplate
    });
}

VoxerShader.vertexShaderTemplate = _.template([
    "attribute vec3 a_position;",
    "attribute vec3 a_normal;",

    "varying vec4 v_pos4;",
    "varying vec3 v_light;",

    "uniform mat4 u_matrix;",
    "uniform mat3 u_nMatrix;",

    "uniform vec3 u_ambientLightColor;",

    "uniform vec3 u_kSpecular;",
    "uniform vec3 u_kDiffuse;",
    "uniform vec3 u_kAmbient;",
    "uniform float u_shininess;",

    "void main() {",
    "  v_pos4 = u_matrix * vec4(a_position, 1.0);",
    "  setPosition4(v_pos4);",

    "  vec3 tNormal = u_nMatrix * a_normal;",
    "  v_light = u_ambientLightColor * u_kAmbient;",

    "  <% _.each(lights, function(light) { %>",
    "      <% if(light.type == 'directional') { %>",
    "          vec3 lightDir = -<%= Webvs.glslVec3Repr(light.direction) %>;",
    "      <% } %>",

    "      <% if(light.type == 'point') { %>",
    "          vec3 lightDir = normalize(<%= Webvs.glslVec3Repr(light.position) %> - v_pos4.xyz);",
    "      <% } %>",

    "      vec3 reflDir = 2.0*dot(lightDir, tNormal)-lightDir;",

    "      float dTerm = dot(lightDir, tNormal);",
    "      float sTerm = dot(reflDir, vec3(0,0,-1));",
    "      if(dTerm > 0.0) {",
    "          v_light += u_kDiffuse * dTerm * <%= Webvs.glslVec3Repr(light.color) %>;",
    "          if(sTerm > 0.0) {",
    "              v_light += u_kSpecular * pow(sTerm, u_shininess) * <%= Webvs.glslVec3Repr(light.color) %>;",
    "          }",
    "      }",

    "  <% }); %>",
    "}"
].join("\n"));

VoxerShader.fragmentShaderTemplate = [
    "varying vec4 v_pos4;",
    "varying vec3 v_light;",

    "void main() {",
    " setFragColor(vec4(v_light, 1.0));",
    "}"
].join("\n");

Webvs.VoxerShader = Webvs.defineClass(VoxerShader, Webvs.ShaderProgram, {
    draw: function(mesh, matrix, nMatrix, material, ambientLightColor) {
        var gl = this.gl;
        this.setUniform("u_matrix", "Matrix4fv", false, matrix);
        this.setUniform("u_nMatrix", "Matrix3fv", false, nMatrix);
        this.setUniform("u_ambientLightColor", "3fv", ambientLightColor);
        this.setUniform("u_kSpecular", "3fv", material.specular);
        this.setUniform("u_kDiffuse", "3fv", material.diffuse);
        this.setUniform("u_kAmbient", "3fv", material.ambient);
        this.setUniform("u_shininess", "1f", material.shininess);

        this.setVertexAttribArray("a_position", new Float32Array(mesh.vertices), 3);
        this.setVertexAttribArray("a_normal", new Float32Array(mesh.vertexNormals), 3);
        this.setElementArray(new Uint16Array(mesh.indices));
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    }
});
    
})(Webvs);
