(function(Webvs) {

function LightComponent(gl, main, parent, opts) {
    LightComponent.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.LightComponent = Webvs.defineClass(LightComponent, Webvs.Object3DComponent, {
    _override_defaultOptions: {
        color: "#FFFFFF"
    },

    _override_onChange: {
        color: "updateColor"
    },

    updateColor: function() {
        this.sceneObject.color = Webvs.makeVec(Webvs.parseColorNorm(this.opts.color));
    }
});

})(Webvs);
