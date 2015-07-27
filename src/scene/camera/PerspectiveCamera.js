(function(Webvs) {

function PerspectiveCamera(fov, aspect, near, far) {
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    PerspectiveCamera.super.constructor.call(this);
}
Webvs.PerspectiveCamera = Webvs.defineClass(PerspectiveCamera, Webvs.Camera, {
    updateProjectionMatrix: function() {
        this.projectionMatrix.makePerspective(this.fov, this.aspect, this.near, this.far);
    }
});

})(Webvs);
