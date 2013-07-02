/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

/**
 * Manages global variables
 */
function GlobalVar(options) {
	checkRequiredOptions(options, ["code"]);
	var codeGen = new ExprCodeGenerator(options.code, ["b", "w", "h"]);
    var genResult = codeGen.generateCode(["init", "onBeat", "perFrame"], [], []);
    this.code = genResult[0];
    this.inited = false;

    GlobalVar.super.constructor.call(this);
}
extend(GlobalVar, Component, {
	initComponent: function() {
		GlobalVar.super.initComponent.apply(this, arguments);

        this.code.initRegisterBank(this.registerBank);
        this.code.w = this.resolution.width;
        this.code.h = this.resolution.height;
	},

	updateComponent: function() {
		var code = this.code;
		code.b = this.analyser.beat?1:0;

		if(!this.inited) {
			code.init();
			this.inited = true;
		}

		if(this.analyser.beat) {
			code.onBeat();
		}

		code.perFrame();
	}
});

window.Webvs.GlobalVar = GlobalVar;