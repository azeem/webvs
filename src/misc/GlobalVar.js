/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that simply runs some avs expressions.
// Useful to maintain global state
function GlobalVar(gl, main, parent, opts) {
    GlobalVar.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(GlobalVar, {
    name: "GlobalVar",
    menu: "Misc"
});

Webvs.defineClass(GlobalVar, Webvs.Component, {
    defaultOptions: {
        code: {
            init: "",
            onBeat: "",
            perFrame: ""
        }
    },

    onChange: {
        "code": "updateCode"
    },

    init: function() {
        this.updateCode();
        this.listenTo(this.main, "resize", this.handleResize);
    },

    draw: function() {
		var code = this.code;
		code.b = this.main.analyser.beat?1:0;

		if(!this.inited) {
			code.init();
			this.inited = true;
		}

		if(this.main.analyser.beat) {
			code.onBeat();
		}

		code.perFrame();
    },

    updateCode: function() {
        this.code = Webvs.compileExpr(this.opts.code, ["init", "onBeat", "perFrame"]).codeInst;
        this.code.setup(this.main, this);
        this.inited = false;
    },

    handleResize: function() {
        this.code.updateDimVars(this.gl);
    }
});

})(Webvs);
