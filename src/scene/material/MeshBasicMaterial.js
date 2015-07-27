(function(Webvs) {

function MeshBasicMaterial(options) {
    this.color = new Math3.Color(options.color || "cyan");
}
Webvs.MeshBasicMaterial = Webvs.defineClass(MeshBasicMaterial, Webvs.Material, {
    materialTypeName: "MeshBasic"
});

})(Webvs);
