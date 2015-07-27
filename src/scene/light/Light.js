(function(Webvs) {

function Light(color) {
    this.color = color || Math3.Vector3();
}
Webvs.Light = Webvs.defineClass(Light, Webvs.Object3D);

})(Webvs);