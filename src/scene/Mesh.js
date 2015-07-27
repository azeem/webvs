(function(Webvs) {

function Mesh(geometry, material) {
    this.geometry = geometry;
    this.material = material;
    Mesh.super.constructor.call(this);
}
Webvs.Mesh = Webvs.defineClass(Mesh, Webvs.Object3D);

})(Webvs);
