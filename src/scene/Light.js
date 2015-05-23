(function(Webvs) {

function Light(gl, main, parent, opts) {
    Light.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.registerComponent(Light, {
    name: "Light",
    menu: "Scene"
});

var LightType = {
    "AMBIENT": 1,
    "DIRECTIONAL": 2,
    "POINT": 3
};

Webvs.defineClass(Light, Webvs.Object3D, {
    _override_defaultOptions: {
        lightType: "POINT"
    },

    _override_onChange: {
        lightType: "updateLightType"
    },

    init: function() {
        Light.super.init.call(this);
        this.updateLightType();
    },

    updateLightType: function() {
        this.lightType = Webvs.getEnumValue(this.opts.lightType, LightType);
    }
});

})(Webvs);
