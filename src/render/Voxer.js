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
            modelSrc: "cube.obj"
        },

        onChange: {
            code: "updateCode",
            modelSrc: "updateMode"
        },

        init: function() {
            this.updateCode();
            this.updateModel();
        },

        draw: function() {
            if(!this.inited) {
                code.init();
                
            }

            var beat = this.main.analyser.beat;
            code.b = beat?1:0;
            code.perFrame();
            if(beat) {
                code.onBeat();
            }

        },

        updateCode: function() {
            var code = Webvs.compileExpr(this.opts.code, ["init", "onBeat", "perFrame", "perObject"]);
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
