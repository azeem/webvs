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

        this.code.setup(this.registerBank, this.bootTime, this.analyser);
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
    },
    form: [
        { key: "code.init", type: "textarea" },
        { key: "code.onBeat", type: "textarea" },
        { key: "code.perFrame", type: "textarea" },
    ]
};

window.Webvs.GlobalVar = GlobalVar;
