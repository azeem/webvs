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

        for(i = 0;i < code.n;i++) {
            object3d = this.objects[i];
            code.i = i;
            code.position = object3d.positionCodeRef;
            code.quaternion = object3d.quaternionCodeRef;
            code.scale = object3d.scaleCodeRef;
            code.perObject();

            var scale = vec3.fromValues(0.04, 0.04, 0.04);
            var position = vec3.fromValues(0, 0, 0);

            var matrix = mat4.identity(mat4.create());
            mat4.fromRotationTranslation(matrix, object3d.quaternion, position);
            mat4.scale(matrix, matrix, scale);
            console.dir(matrix);

            this.program.run(this.parent.fm, null, this.mesh, matrix);
        }

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
            },
            null,
            this
        );
    },

    updateProgram: function() {
        var blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
        var program = new VoxerShader(this.gl, blendMode);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    }
});

function VoxerShader(gl, blendMode) {
    VoxerShader.super.constructor.call(this, gl, {
        copyOnSwap: true,
        blendMode: blendMode,
        vertexShader: [
            "attribute vec3 a_position;",
            "varying vec4 v_pos4;",
            "uniform mat4 u_matrix;",
            "void main() {",
            "  v_pos4 = u_matrix * vec4(a_position, 1.0);",
            "  setPosition4(v_pos4);",
            "}"
        ],

        fragmentShader: [
            "varying vec4 v_pos4;",
            "void main() {",
            " setFragColor(vec4(v_pos4.x, v_pos4.y, v_pos4.z, 1.0));",
            "}",
        ]
    });
}
Webvs.VoxerShader = Webvs.defineClass(VoxerShader, Webvs.ShaderProgram, {
    draw: function(mesh, matrix) {
        var gl = this.gl;
        this.setUniform("u_matrix", "Matrix4fv", false, matrix);
        this.setVertexAttribArray("a_position", new Float32Array(mesh.vertices), 3);
        this.setElementArray(new Uint16Array(mesh.indices));
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    }
});
    
})(Webvs);
