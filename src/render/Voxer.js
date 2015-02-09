(function(Webvs) {

    function Voxer(gl, main, parent, opts) {
        Voxer.super.constructor.call(this, gl, main, parent, opts);
    }

    Webvs.registerComponent(Voxer, {
        name: "Voxer",
        menu: "Render"
    });

    Webvs.defineClass(Voxer, Webvs.Component, {
        defaultOptions: {
            code: {
                init: "",
                onBeat: "",
                perFrame: "",
                perObject: ""
            },
            model: "cube.obj"
        },

        init: function() {
            this.updateModel();
        },

        updateModel: function() {
            // this.main.rsrcMan.
        }
    });
    
})(Webvs);
