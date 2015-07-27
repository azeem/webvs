(function(Webvs) {

function PointLight(color) {
    PointLight.super.call(this, color);
}
Webvs.PointLight = Webvs.defineClass(PointLight, Webvs.Light);

})(Webvs);