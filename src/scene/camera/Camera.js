(function(Webvs) {

function Camera() {
    this.projectionMatrix = new Math3.Matrix4();
    Camera.super.constructor.call(this);
}
Webvs.Camera = Webvs.defineClass(Camera, Webvs.Object3D, {
    updateProjectionMatrix: function() {
        throw new Error("updateProjectionMatrix not implemented yet");
    }
});

})(Webvs);
