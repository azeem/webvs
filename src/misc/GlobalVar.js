/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that simply runs some avs expressions.
 * Useful to maintain global state
 *
 * @param {object} options - options object
 * @param {string} [options.code.init] - code to be run at startup
 * @param {string} [options.code.onBeat] - code to be run when a beat occurs
 * @param {string} [ptions.code.perFrame]- code to be run on every frame
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
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
