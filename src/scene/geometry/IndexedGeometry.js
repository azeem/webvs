(function (Webvs) {

function IndexedGeometry(vertices, vertexNormals, indices, gl) {
    this.vertices = vertices;
    this.vertexNormals = vertexNormals;
    if(!(indices instanceof Uint16Array)) {
        this.indices = new Uint16Array(indices);
    } else {
        this.indices = indices;
    }
    this.gl = gl;

    if(!this.vertexNormals || this.vertexNormals.length === 0) {
        this.computeVertexNormals();
    }

    if(this.gl) {
        this.createBuffers();
    }
}

Webvs.IndexedGeometry = Webvs.defineClass(IndexedGeometry, Webvs.Geometry, {
    createBuffers: function() {
        this.vertexBuffer = new Webvs.Buffer(this.gl, false, this.vertices);
        this.normalBuffer = new Webvs.Buffer(this.gl, false, this.vertexNormals);
        this.indexBuffer  = new Webvs.Buffer(this.gl, true, this.indices);
    },

    computeVertexNormals: function () {
        var i, j, index;
        var vertices = this.vertices;
        var indices = this.indices;

        var vA = new Math3.Vector3();
        var vB = new Math3.Vector3();
        var vC = new Math3.Vector3();
        var cb = new Math3.Vector3();
        var ab = new Math3.Vector3();

        // compute face normals
        var faceNormals = new Array(indices.length / 3);
        for (i = 0, j = 0; i < indices.length; i += 3, j++) {
            index = indices[i] * 3;
            vA.set(vertices[index],
                   vertices[index + 1],
                   vertices[index + 2]);
            index = indices[i + 1] * 3;
            vB.set(vertices[index],
                   vertices[index + 1],
                   vertices[index + 2]);
            index = indices[i + 2] * 3;
            vC.set(vertices[index],
                   vertices[index + 1],
                   vertices[index + 2]);

            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);

            cb.cross(ab).normalize();
            faceNormals[j] = cb.clone();
        }

        // initialize vertex normal vectors
        var vertexNormals = new Array(vertices.length / 3);
        for (i = 0; i < vertexNormals.length; i++) {
            vertexNormals[i] = new Math3.Vector3();
        }

        // add facenormal of face each of its vertices
        for (i = 0; i < faceNormals.length; i++) {
            var faceNormal = faceNormals[i];
            var faceIndex = i * 3;
            vertexNormals[indices[faceIndex]].add(faceNormal);
            vertexNormals[indices[faceIndex + 1]].add(faceNormal);
            vertexNormals[indices[faceIndex + 2]].add(faceNormal);
        }

        var flatVertexNormals = new Float32Array(vertices.length);
        // normalize and flatten vertex normals
        for (i = 0; i < vertexNormals.length; i++) {
            var vertexNormal = vertexNormals[i];
            vertexNormal.normalize();
            index = i * 3;
            flatVertexNormals[index] = vertexNormal.x;
            flatVertexNormals[index + 1] = vertexNormal.y;
            flatVertexNormals[index + 2] = vertexNormal.z;
        }

        this.vertexNormals = flatVertexNormals;
    }
});

})(Webvs);
