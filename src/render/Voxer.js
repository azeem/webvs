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
            blendMode: "REPLACE"
        },

        onChange: {
            code: "updateCode",
            modelSrc: "updateMode",
            blendMode: "updateProgram"
        },

        init: function() {
            this.updateCode();
            this.updateModel();
            this.updateProgram();
        },

        draw: function() {
            if(!this.inited) {
                code.init();
                this.objects = [];
                for(var i = 0;i < code.n;i++) {
                    var object3d = {
                        position: vec3.create(),
                        quaternion: quat.create(),
                        scale: vec3.create()
                    };
                    object3d.positionCodeRef = this.code.__vec3.length;
                    this.code.__vec3.push(object3d.position);

                    object3d.scaleCodeRef = this.code.__vec3.length;
                    this.code.__vec3.push(object3d.scale);

                    object3d.quaternionCodeRef = this.code.__quat.length;
                    this.code.__quat.push(object3d.quaternion);

                    this.objects.push(object3d);
                }
            }

            code.perFrame();
            var beat = this.main.analyser.beat;
            code.b = beat?1:0;
            if(beat) {
                code.onBeat();
            }

            for(var i = 0;i < code.n;i++) {
                var object3d = this.objects[i];
                code.i = i;
                code.position = object3d.positionCodeRef;
                code.quaternion = object3d.quaternionCodeRef;
                code.scale = object3d.scaleCodeRef;
                code.perObject();
                var matrix = mat4.identity(mat4.create());
                mat4.fromRotationTranslation(matrix, object3d.quaternion, object3d.position);
                mat4.scale(matrix, matrix, object3d.scale);

                this.program.run(this.parent.fm, null, this.mesh, matrix);
            }

        },

        updateCode: function() {
            var code = Webvs.compileExpr(this.opts.code, ["init", "onBeat", "perFrame", "perObject"]);
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
                },
                null,
                this
            );
        },

        updateProgram: function() {
            var program = new VoxerShader(this.gl, this.opts.blendMode);
            if(this.program) {
                this.program.destroy();
            }
            this.program = program;
        }
    });

    function VoxerShader(gl, blendMode) {
        TexerProgram.super.constructor.call(this, gl, {
            copyOnSwap: true,
            blendMode: blendMode,
            vertexShader: [
                "attribute vec4 a_position;",
                "uniform mat4 u_matrix;",
                "void main() {",
                "  v_pos = a_position;",
                "  setPosition(u_matrix * vec4(a_position, 1.0));",
                "}"
            ],
            fragmentShader: [
                "void main() {",
                " setFragColor(vec4(v_position.z, v_position.z, v_position.z, 1.0));",
                "}",
            ]
        });
    }
    Webvs.VoxerShader = Webvs.defineClass(VoxerShader, Webvs.ShaderProgram, {
        draw: function(mesh, matrix) {
            var gl = this.gl;
            this.setUniform("u_matrix", "Matrix4fv", matrix);
            this.setVertexAttribArray("a_position", mesh.vertices, 3, gl.FLOAT, false, 0, 0);
            this.setElementArray(mesh.indices);
            gl.drawArrays(gl.TRIANGLES, 0, mesh.vertices.length/3);
        }
    });
    
})(Webvs);
