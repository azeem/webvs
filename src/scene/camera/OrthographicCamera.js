(function(Webvs) {

function OrthographicCamera(left, right, bottom, top, near, far) {
    this.left = left;
    this.right = right;
    this.bottom = bottom;
    this.top = top;
    this.near = near;
    this.far = far;
    this.zoom = 1;
    OrthographicCamera.super.constructor.call(this);
}
Webvs.OrthographicCamera = Webvs.defineClass(OrthographicCamera, Webvs.Camera, {
    updateProjectionMatrix: function() {
        var dx = ( this.right - this.left ) / ( 2 * this.zoom );
        var dy = ( this.top - this.bottom ) / ( 2 * this.zoom );
        var cx = ( this.right + this.left ) / 2;
        var cy = ( this.top + this.bottom ) / 2;
        this.projectionMatrix.makeOrthographic(cx - dx, cx + dx, cy + dy, cy - dy, this.near, this.far);
    }
});

})(Webvs);
