(function(Webvs) {

function OrthoCameraComponent(gl, main, parent, opts) {
    OrthoCameraComponent.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.registerComponent(OrthoCameraComponent, {
    name: "OrthographicCamera",
    menu: "Scene:Camera"
});

Webvs.OrthoCameraComponent = Webvs.defineClass(OrthoCameraComponent, Webvs.Object3DComponent, {
    _override_defaultOptions: {
        near: 1,
        far: 1000
    },

    _override_onChange: {
        near: "updateProp",
        far: "updateProp",
    },

    init: function() {
        var width = this.gl.drawingBufferWidth;
        var height = this.gl.drawingBufferHeight;
        this.sceneObject = new Webvs.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, this.opts.near, this.opts.far);
        OrthoCameraComponent.super.init.call(this);
    },

    updateProp: function(value, key) {
        this.sceneObject[key] = value;
    }
});

})(Webvs);
