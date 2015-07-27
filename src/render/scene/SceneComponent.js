(function (Webvs) {

function SceneComponent(gl, main, parent, opts) {
    SceneComponent.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.registerComponent(SceneComponent, {
    name: "Scene",
    menu: "Scene"
});

Webvs.SceneComponent = Webvs.defineClass(SceneComponent, Webvs.Object3DComponent, {
    _override_defaultOptions: {
        camera: "camera1"
    },

    _override_onChange: {
        camera: "updateCamera"
    },

    canAddType: function(componentType) {
        return (
            SceneComponent.super.canAddType.call(this, componentType) &&
            !Webvs.isSubclass(componentType, SceneComponent)
        );
    },

    init: function() {
        this.shaders = {};
        this.viewMatrix = new Math3.Matrix4();
        this.objectMatrix = new Math3.Matrix4();
        this.sceneObject = new Webvs.Object3D();
        SceneComponent.super.init.call(this);
        this.updateCamera();
    },

    draw: function() {
        var i;
        var gl = this.gl;
        this.runCode();
        this.sceneObject.updateWorldMatrix();

        if(!this.cameraComponent) {
            console.log("No Camera In Scene");
            return;
        }

        var camera = this.cameraComponent.sceneObject;
        var meshes = [];
        var lights = [];
        this.sceneObject.traverse(function(obj) {
            if(obj instanceof Webvs.Mesh) {
                meshes.push(obj);
            }
            if(obj instanceof Webvs.Light) {
                lights.push(obj);
            }
        }, this);

        var viewMatrix = this.viewMatrix;
        var objectMatrix = this.objectMatrix;

        // compute the view matrix
        camera.updateProjectionMatrix();
        viewMatrix.getInverse(camera.matrix);
        viewMatrix.multiply(camera.projectionMatrix);

        var oldDepthTest = gl.getParameter(gl.DEPTH_TEST);
        var oldDepthFunc = gl.getParameter(gl.DEPTH_FUNC);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        for(i = 0;i < meshes.length;i++) {
            var mesh = meshes[i];
            objectMatrix.copy(mesh.worldMatrix);
            objectMatrix.multiply(viewMatrix);
            var shader = this._getShader(mesh.material);
            shader.run(this.parent.fm, null, mesh.geometry, mesh.material, objectMatrix);
        }

        if(oldDepthTest) {
            gl.enable(gl.DEPTH_TEST);
        }
        gl.depthFunc(oldDepthFunc);
    },

    _getShader: function(material) {
        var type = material.materialTypeName;
        if(type in this.shaders) {
            return this.shaders[type];
        }
        var shader;
        switch(type) {
            case "MeshBasic":
                shader = new Webvs.BasicMaterialShader(this.gl);
                break;
            case "MeshNormal":
                shader = new Webvs.NormalMaterialShader(this.gl);
                break;
            case "MeshPhong":
                shader = new Webvs.PhongMaterialShader(this.gl);
                break;
            default:
                throw new Error("Unknown material type " + type);
        }
        this.shaders[type] = shader;
        return shader;
    },

    updateCamera: function() {
        this.cameraComponent = this.findComponent(this.opts.camera);
    }
});

})(Webvs);
