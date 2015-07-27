(function(Webvs) {

function PerspCameraComponent(gl, main, parent, opts) {
    PerspCameraComponent.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.registerComponent(PerspCameraComponent, {
    name: "PerspectiveCamera",
    menu: "Scene:Camera"
});

Webvs.PerspCameraComponent = Webvs.defineClass(PerspCameraComponent, Webvs.Object3DComponent, {
    _override_defaultOptions: {
        fov: 45,
        near: 1,
        far: 1000
    },

    _override_onChange: {
        fov: "updateProp",
        near: "updateProp",
        far: "updateProp"
    },

    init: function() {
        var width = this.gl.drawingBufferWidth;
        var height = this.gl.drawingBufferHeight;
        this.sceneObject = new Webvs.PerspectiveCamera(this.opts.fov, width/height, this.opts.near, this.opts.far);
        PerspCameraComponent.super.init.call(this);
    },

    updateProp: function(value, key) {
        this.sceneObject[key] = value;
    }
});

})(Webvs);
