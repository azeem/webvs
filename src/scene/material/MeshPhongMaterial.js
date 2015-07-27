(function (Webvs) {

function MeshPhongMaterial(options) {
    this.ambient = options.ambient || new Math3.Vector3(64, 64, 64);
    this.specular = options.specular || new Math3.Vector3(128, 128, 128);
    this.diffuse = options.specular || new Math3.Vector3(128, 128, 128);
    this.shininess = options.shininess || 30;
}
Webvs.MeshPhongMaterial = Webvs.defineClass(MeshPhongMaterial, Webvs.Material, {
    materialTypeName: "MeshPhong"
});

})(Webvs);
