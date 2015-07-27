(function(Webvs) {

function AmbientLightComponent(gl, main, parent, opts) {
    AmbientLightComponent.super.call(this, gl, main, parent, opts);
}
Webvs.registerComponent(AmbientLightComponent, {
    name: "AmbientLight",
    menu: "Scene"
});

Webvs.AmbientLightComponent = Webvs.defineClass(AmbientLightComponent, Webvs.LightComponent, {
    init: function() {
        this.sceneObject = new Webvs.AmbientLight();
        this.updateColor();
        AmbientLightComponent.super.init.call(this);
    }
});

})(Webvs);
