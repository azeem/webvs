(function(Webvs) {

function Object3D() {
    this.position = new Math3.Vector3();
    this.scale = new Math3.Vector3(1,1,1);
    this.quaternion = new Math3.Quaternion();

    this.matrix = new Math3.Matrix4();
    this.worldMatrix = new Math3.Matrix4();

    this.children = [];
    this.parent = null;
}
Webvs.Object3D = Webvs.defineClass(Object3D, Object, {
    updateWorldMatrix: function() {
        this.matrix.compose(this.position, this.quaternion, this.scale);

        if (this.parent) {
            this.worldMatrix.copy(this.parent.worldMatrix);
            this.worldMatrix.multiply(this.matrix);
        } else {
            this.worldMatrix.copy(this.matrix);
        }

        for(var i = 0;i < this.children.length;i++) {
            this.children[i].updateWorldMatrix();
        }
    },

    add: function() {
        for(var i = 0;i < arguments.length;i++) {
            var child = arguments[i];
            if(!(child instanceof Object3D)) {
                throw new Error("Child is not an instance of Object3D");
            }
            this.children.push(child);
            child.parent = this;
        }
    },

    remove: function() {
        for(var i = 0;i < arguments.length;i++) {
            var child = arguments[i];
            var index = this.children.indexOf(child);
            if(index < 0) {
                throw new Error("Object is not a child");
            }
            this.children.splice(index, 1);
        }
    },

    traverse: function(callback, context) {
        for(var i = 0;i < this.children.length;i++) {
            callback.call(context, this.children[i]);
            this.children[i].traverse(callback, context);
        }
    }
});

})(Webvs);
