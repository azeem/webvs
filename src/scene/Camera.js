(function(Webvs) {

function Camera(gl, main, parent, opts) {
    Camera.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(Camera, {
    name: "Camera",
    menu: "Scene"
});

var CameraType = {
    "PERSPECTIVE": 1
};

Webvs.defineClass(Camera, Webvs.Object3D, {
    _override_defaultOptions: {
        cameraType: "PERSPECTIVE"
    },

    _override_onChange: {
        cameraType: "updateCameraType"
    },

    init: function() {
        Camera.super.init.call(this);
        this.updateCameraType();
    },

    updateCameraType: function() {
        this.cameraType = Webvs.getEnumValue(this.opts.cameraType, CameraType);
    }
});

})();
