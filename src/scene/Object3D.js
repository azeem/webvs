(function(Webvs) {

function Object3D(gl, main, parent, opts) {
    Object3D.super.constructor.call(this, gl, main, parent, opts);
}

var MaterialType = {
    "PHONG": 1,
    "NORMAL": 2
};

Webvs.defineClass(Effect, Webvs.Container, {
    defaultOptions: {
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: 0, z: 0 },
        code: {
            init: "",
            onBeat: "",
            perFrame: ""
        },
        modelSrc: "cube.obj",
        material: {
            type: "NORMAL"
        }
    },

    onChange: {
        position: "updatePosition",
        scale: "updateScale",
        rotation: "updateRotation",
        code: "updateCode",
        modelSrc: "updateGeometry",
        material: "updateMaterial"
    },

    canAddType: function(componentType) {
        return Object3D.super.canAddType(this, componentType) && Webvs.isSubclass(component, Webvs.Object3D);
    },

    init: function() {
        this.position = vec3.create();
        this.scale = vec3.create();
        this.quaternion = quat.create();

        this.matrix = mat4.create();
        this.worldMatrix = mat4.create();

        this.geometry = undefined;

        this.inited = false;

        this.updateCode();
        this.updatePosition();
        this.updateScale();
        this.updateRotation();
        this.updateGeometry();
        this.updateMaterial();
    },

    update: function() {
        var code = this.code;

        if(!this.inited) {
            code.init();
            var positionRef = this.code._vec3.push(this.position) - 1;
            var scaleRef = this.code._vec3.push(this.scale) - 1;
            var quatRef = this.code._quat.push(this.quaternion) - 1;
            this.code.position = postionRef;
            this.code.scale = scaleRef;
            this.code.rotation = quatRef;
        }

        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        code.perFrame();
        if(beat) {
            code.onBeat();
        }

        // update all subcomponents
        for(var i = 0;i < this.components.length;i++) {
            this.components[i].update();
        }
    },

    updateCode: function() {
        var code = Webvs.compileExpr(this.opts.code, ["init", "onBeat", "perFrame"]).codeInst;
        code.n = 1;
        code.setup(this.main, this);
        this.inited = false;
        this.code = code;
    },

    updatePosition: function() {
        vec3.set(this.position,
                 this.opts.position.x,
                 this.opts.position.y,
                 this.opts.position.z);
    },
    
    updateScale: function() {
        vec3.set(this.scale,
                 this.opts.scale.x,
                 this.opts.scale.y,
                 this.opts.scale.z);
    },

    updateRotation: function() {
		var c1 = Math.cos( this.opts.rotation.x / 2 );
		var c2 = Math.cos( this.opts.rotation.y / 2 );
		var c3 = Math.cos( this.opts.rotation.z / 2 );
		var s1 = Math.sin( this.opts.rotation.x / 2 );
		var s2 = Math.sin( this.opts.rotation.y / 2 );
		var s3 = Math.sin( this.opts.rotation.z / 2 );
        quat.set(this.quat,
			s1 * c2 * c3 + c1 * s2 * s3, // x
			c1 * s2 * c3 - s1 * c2 * s3, // y
			c1 * c2 * s3 + s1 * s2 * c3, // z
			c1 * c2 * c3 - s1 * s2 * s3  // w
        );
    },

    computeVertexNormals: function () {
        var i, j, index;
        var vertices = this.geometry.vertices;
        var indices = this.geometry.indices;

        // compute face normals
        var faceNormals = new Array(indices.length/3);
        for(i = 0,j = 0;i < indices.length;i+=3,j++) {
            index = indices[i] * 3;
            var vA = vec3.fromValues(vertices[index],
                                     vertices[index+1],
                                     vertices[index+2]);
            index = indices[i+1] * 3;
            var vB = vec3.fromValues(vertices[index],
                                     vertices[index+1],
                                     vertices[index+2]);
            index = indices[i+2] * 3;
            var vC = vec3.fromValues(vertices[index],
                                     vertices[index+1],
                                     vertices[index+2]);
            var cb = vec3.create();
            var ab = vec3.create();
            cb = vec3.sub(cb, vC, vB);
            ab = vec3.sub(ab, vA, vB);

            vec3.cross(cb, cb, ab);
            vec3.normalize(cb, cb);
            faceNormals[j] = cb;
        }

        // initialize vertex normal vectors
        var vertexNormals = new Array(vertices.length/3);
        for(i = 0;i < vertexNormals.length;i++) {
            vertexNormals[i] = vec3.create();
        }

        // add facenormal of face each of its vertices
        for(i = 0;i < faceNormals.length;i++) {
            var faceNormal = faceNormals[i];
            faceIndex = i*3;
            vec3.add(vertexNormals[indices[faceIndex]], vertexNormals[indices[faceIndex]], faceNormal);
            vec3.add(vertexNormals[indices[faceIndex+1]], vertexNormals[indices[faceIndex+1]], faceNormal);
            vec3.add(vertexNormals[indices[faceIndex+2]], vertexNormals[indices[faceIndex+2]], faceNormal);
        }

        var flatVertexNormals = new Array(vertices.length);
        // normalize and flatten vertex normals
        for(i = 0;i < vertexNormals.length;i++) {
            var vertexNormal = vertexNormals[i];
            vec3.normalize(vertexNormal, vertexNormal);
            index = i * 3;
            flatVertexNormals[index] = vertexNormal[0];
            flatVertexNormals[index+1] = vertexNormal[1];
            flatVertexNormals[index+2] = vertexNormal[2];
        }

        this.geometry.vertexNormals = flatVertexNormals;
    },

    updateGeometry: function() {
        this.main.rsrcMan.getMesh(
            this.opts.modelSrc,
            function(mesh) {
                this.geometry = mesh;
                if(this.geometry.vertexNormals.length === 0) {
                    this.computeVertexNormals();
                }
            },
            null,
            this
        );
    },

    updateMaterial: function() {
        var materialType = Webvs.getEnumValue(this.opts.material.type, MaterialType);
        switch(materialType) {
            case MaterialType.PHONG:
                this.material = {
                    type: materialType,
                    ambient: Webvs.parseColorNorm(this.opts.material.ambient),
                    specular: Webvs.parseColorNorm(this.opts.material.specular),
                    diffuse: Webvs.parseColorNorm(this.opts.material.diffuse),
                    shininess: this.opts.material.shininess
                };
                break;
            case MaterialType.NORMAL:
                this.material = {
                    type: materialType
                };
                break;
            default:
                throw new Error("Unknown material type " + this.opts.material.type);
        }
    },

    updateWorldMatrix: function() {
        // update local matrix
        mat4.fromRotationTranslation(this.matrix, this.rotation, this.position);
        mat4.scale(this.matrix, this.scale);

        // update world matrix
        mat4.copy(this.worldMatrix, this.parent.worldMatrix);
        mat4.multiply(this.worldMatrix, this.worldMatrix, this.matrix);

        // update world matrix of all children
        for(var i = 0;i < this.components.length;i++) {
            var component = this.opts.components[i];
            component.updateWorldMatrix();
        }
    }
});

})(Webvs);
