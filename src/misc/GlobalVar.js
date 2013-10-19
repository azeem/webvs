/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * Manages global variables
 */
function GlobalVar(options) {
	Webvs.checkRequiredOptions(options, ["code"]);
	var codeGen = new Webvs.ExprCodeGenerator(options.code, ["b", "w", "h"]);
    var genResult = codeGen.generateCode(["init", "onBeat", "perFrame"], [], []);
    this.code = genResult[0];
    this.inited = false;

    GlobalVar.super.constructor.call(this);
}
Webvs.GlobalVar = Webvs.defineClass(GlobalVar, Webvs.Component, {
	init: function(gl, main, parent) {
		GlobalVar.super.init.call(this, gl, main, parent);

        this.code.setup(main, this);
	},

	update: function() {
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
	}
});

GlobalVar.ui = {
    disp: "Global Var",
    type: "GlobalVar",
    schema: {
        code: {
            type: "object",
            title: "Code",
            default: {},
            properties: {
                init: {
                    type: "string",
                    title: "Init",
                },
                onBeat: {
                    type: "string",
                    title: "On Beat",
                },
                perFrame: {
                    type: "string",
                    title: "Per Frame",
                }
            },
        }
    }
};

})(Webvs);
