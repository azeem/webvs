(function(Webvs) {

function MeshComponent(gl, main, parent, opts) {
    MeshComponent.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.registerComponent(MeshComponent, {
    name: "Mesh",
    menu: "Scene"
});

Webvs.MaterialTypes = {
    "BASIC": 1,
    "PHONG": 2,
    "NORMAL": 3
};

Webvs.MeshComponent = Webvs.defineClass(MeshComponent, Webvs.Object3DComponent, {
    _override_defaultOptions: {
        model: "cube.obj",
        material: {
            type: "NORMAL"
        }
    },
    _override_onChange: {
        model: "updateModel"
    },

    init: function() {
        this.sceneObject = new Webvs.Mesh(null, null);
        this.updateModel();
        this.updateMaterial();
        MeshComponent.super.init.call(this);
    },

    updateMaterial: function() {
        var material;
        var materialOpts = this.opts.material;
        switch(Webvs.getEnumValue(materialOpts.type, Webvs.MaterialTypes)) {
            case Webvs.MaterialTypes.BASIC:
                material = new Webvs.MeshBasicMaterial({
                    color: new Math3.Color(materialOpts.color)
                });
                break;
            case Webvs.MaterialTypes.PHONG:
                material = new Webvs.MeshPhoneMaterial({
                    ambient: Webvs.makeVec(materialOpts.ambient),
                    specular: Webvs.makeVec(materialOpts.specular),
                    diffuse: Webvs.makeVec(materialOpts.diffuse),
                    shininess: materialOpts.shininess
                });
                break;
            case Webvs.MaterialTypes.NORMAL:
                material = new Webvs.MeshNormalMaterial();
                break;
            default:
                throw new Error("Unknown Material type " + materialOpts.type);
        }
        this.sceneObject.material = material;
    },

    updateModel: function() {
        this.main.rsrcMan.getMesh(
            this.opts.model,
            function(mesh) {
                var vertices = new Float32Array(mesh.vertices);
                var normals = new Float32Array(mesh.vertexNormals);
                var indices = new Uint16Array(mesh.indices);
                var geometry = new Webvs.IndexedGeometry(vertices, normals, indices, this.gl);
                this.sceneObject.geometry = geometry;
                // var vertices = new Float32Array([
                //       // Front face
                //       -1.0, -1.0,  1.0,
                //        1.0, -1.0,  1.0,
                //        1.0,  1.0,  1.0,
                //       -1.0,  1.0,  1.0,
                //
                //       // Back face
                //       -1.0, -1.0, -1.0,
                //       -1.0,  1.0, -1.0,
                //        1.0,  1.0, -1.0,
                //        1.0, -1.0, -1.0,
                //
                //       // Top face
                //       -1.0,  1.0, -1.0,
                //       -1.0,  1.0,  1.0,
                //        1.0,  1.0,  1.0,
                //        1.0,  1.0, -1.0,
                //
                //       // Bottom face
                //       -1.0, -1.0, -1.0,
                //        1.0, -1.0, -1.0,
                //        1.0, -1.0,  1.0,
                //       -1.0, -1.0,  1.0,
                //
                //       // Right face
                //        1.0, -1.0, -1.0,
                //        1.0,  1.0, -1.0,
                //        1.0,  1.0,  1.0,
                //        1.0, -1.0,  1.0,
                //
                //       // Left face
                //       -1.0, -1.0, -1.0,
                //       -1.0, -1.0,  1.0,
                //       -1.0,  1.0,  1.0,
                //       -1.0,  1.0, -1.0,
                // ]);
                // var indices = new Uint16Array([
                //   0,  1,  2,      0,  2,  3,    // front
                //   4,  5,  6,      4,  6,  7,    // back
                //   8,  9,  10,     8,  10, 11,   // top
                //   12, 13, 14,     12, 14, 15,   // bottom
                //   16, 17, 18,     16, 18, 19,   // right
                //   20, 21, 22,     20, 22, 23    // left
                // ]);
                // var geometry = new Webvs.IndexedGeometry(vertices, null, indices, this.gl);
                // this.sceneObject.geometry = geometry;
            },
            null,
            this
        );
    }
});

})(Webvs);
