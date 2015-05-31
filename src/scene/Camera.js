(function(Webvs) {

function Camera(gl, main, parent, opts) {
    Camera.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(Camera, {
    name: "Camera",
    menu: "Scene"
});

var CameraType = {
    "PERSPECTIVE": 1,
    "ORTHOGRAPHIC": 2
};

Webvs.defineClass(Camera, Webvs.Object3D, {
    _override_defaultOptions: {
        cameraType: "PERSPECTIVE",
        params: {
            fov: Math.PI/4,
            near: 10,
            far: 50
        }
    },

    _override_onChange: {
        cameraType: "updateCameraType",
        params: "updateProjectionMatrix"
    },

    init: function() {
        Camera.super.init.call(this);
        this.updateCameraType();
        this.projectionMatrix = mat4.create();
        this.updateProjectionMatrix();
    },

    updateCameraType: function() {
        this.cameraType = Webvs.getEnumValue(this.opts.cameraType, CameraType);
    },

    updateProjectionMatrix: function() {
        if(this.cameraType == CameraType.PERSPECTIVE) {
            var aspect = this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;
            mat4.perpective(this.projectionMatrix, 
                            this.opts.params.fov, 
                            aspect, 
                            this.opts.params.near,
                            this.opts.params.far);
        } else if(this.cameraType == CameraType.ORTHOGRAPHIC) {
           mat4.ortho(this.projectionMatrix,
                      this.opts.params.left,
                      this.opts.params.right,
                      this.opts.params.bottom,
                      this.opts.params.top,
                      this.opts.params.near,
                      this.opts.params.far);
        }
    }
});

})();
