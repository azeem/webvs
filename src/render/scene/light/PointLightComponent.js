(function(Webvs) {

function PointLightComponent(gl, main, parent, opts) {
    PointLightComponent.super.call(this, gl, main, parent, opts);
}
Webvs.registerComponent(PointLightComponent, {
    name: "PointLight",
    menu: "Scene"
});

Webvs.PointLightComponent = Webvs.defineClass(PointLightComponent, Webvs.LightComponent, {
    init: function() {
        this.sceneObject = new Webvs.PointLight();
        this.updateColor();
        PointLightComponent.super.init.call(this);
    }
});

})(Webvs);
