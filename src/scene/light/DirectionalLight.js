(function(Webvs) {

function DirectionalLight(color, direction) {
    this.direction = direction || new Math3.Vector3();
    this.direction.normalize();
    DirectionalLight.super.call(this, color);
}
Webvs.DirectionalLight = Webvs.defineClass(DirectionalLight, Object, {
    setDirection: function (direction) {
        this.direction.copy(direction);
        this.direction.normalize();
    }
});

})(Webvs);