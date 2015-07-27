(function(Webvs) {

function DirectionalLightComponent(gl, main, parent, opts) {
    DirectionalLightComponent.super.call(this, gl, main, parent, opts);
}
Webvs.registerComponent(DirectionalLightComponent, {
    name: "DirectionalLight",
    menu: "Scene"
});

Webvs.DirectionalLightComponent = Webvs.defineClass(DirectionalLightComponent, Webvs.LightComponent, {
    _override_defaultOptions: {
        direction: {x: 1, y: 1, z: 1}
    },

    _override_onChange: {
        direction: "updateDirection"
    },

    init: function() {
        this.sceneObject = new Webvs.DirectionalLight();
        this.updateColor();
        this.updateDirection();
        DirectionalLightComponent.super.init.call(this);
    },

    updateDirection: function() {
        this.sceneObject.direction = Webvs.makeVec(this.opts.direction);
    }
});

})(Webvs);
