(function(Webvs) {

function Scene(gl, main, parent, opts) {
    Voxer.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.registerComponent(Scene, {
    name: "Scene",
    menu: "Scene"
});

Webvs.defineClass(Scene, Webvs.Object2D, {
    _override_defaultOptions: {
        camera: "default"
    },

    _override_onChange: {
        camera: updateCamera
    },

    canAddType: function(componentType) {
        return Scene.super.canAddType.call(this, componentType) && !Webvs.isSubclass(componentType, Scene);
    },

    init: function() {
        Scene.super.init.call(this);
        this.updateCamera();
    },

    draw: function() {
        var i;
        // update all objects
        this.update();

        // update all world matrices
        this.updateWorldMatrix();
    },

    updateCamera: function() {
        var camera = this.findComponent(this.opts.camera);
        if(!camera) {
            throw new Error("Cannot find camera " + camera);
        }
        this.camera = camera;
    }
});

})(Webvs);
