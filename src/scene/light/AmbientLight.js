(function(Webvs) {

function AmbientLight(color) {
    AmbientLight.super.call(this, color);
}
Webvs.AmbientLight = Webvs.defineClass(AmbientLight, Object);

})(Webvs);