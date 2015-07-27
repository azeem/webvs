(function(Webvs) {

function Object3DComponent(gl, main, parent, opts) {
    this.sceneObject = null;
    Object3DComponent.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.Object3DComponent = Webvs.defineClass(Object3DComponent, Webvs.Container, {
    defaultOptions: {
        position: {x: 0, y: 0, z: 0},
        scale: {x: 1, y: 1, z: 1},
        rotation: {x: 0, y: 0, z: 0},
        code: {
            init: "",
            onBeat: "",
            perFrame: ""
        }
    },

    onChange: {
        position: "updatePosScale",
        scale: "updatePosScale",
        rotation: "updateRotation",
        code: "updateCode"
    },

    init: function() {
        Object3DComponent.super.init.call(this);
        this.rotationEuler = new Math3.Euler();
        this.inited = false;
        this.updatePosScale(this.opts.position, "position");
        this.updatePosScale(this.opts.scale, "scale");
        this.updateRotation(this.opts.rotation);
        this.updateCode();
    },

    addComponent: function() {
        var component = Object3DComponent.super.addComponent.apply(this, arguments);
        this.sceneObject.add(component.sceneObject);
        return component;
    },

    detachComponent: function() {
        var component = Object3DComponent.super.detachComponent.apply(this, arguments);
        this.sceneObject.remove(component.sceneObject);
        return component;
    },

    runCode: function() {
        var code = this.code;
        if(!this.inited) {
            code.init();
        }

        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        code.perFrame();
        if(beat) {
            code.onBeat();
        }

        for(var i = 0;i < this.components.length;i++) {
            this.components[i].runCode();
        }
    },

    updateCode: function() {
        var code = Webvs.compileExpr(this.opts.code, ["init", "onBeat", "perFrame"]).codeInst;
        code.n = 100;
        code.setup(this.main, this);
        code.addDataRef("position", "vec3", this.sceneObject.position);
        code.addDataRef("scale", "vec3", this.sceneObject.scale);
        code.addDataRef("quaternion", "quat", this.sceneObject.quaternion);
        this.inited = false;
        this.code = code;
    },

    updatePosScale: function(value, key) {
        this.sceneObject[key].set(value.x, value.y, value.z);
    },

    updateRotation: function(value) {
        this.rotationEuler.set(value.x, value.y, value.z);
        this.sceneObject.quaternion.setFromEuler(this.rotationEuler);
    },

    canAddType: function(componentType) {
        return Webvs.isSubclass(componentType, Object3DComponent);
    }
});

})(Webvs);
