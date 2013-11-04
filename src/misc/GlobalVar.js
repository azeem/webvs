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
function GlobalVar(options) {
	Webvs.checkRequiredOptions(options, ["code"]);
	var codeGen = new Webvs.ExprCodeGenerator(options.code, ["b"]);
    var genResult = codeGen.generateCode(["init", "onBeat", "perFrame"], [], []);
    this.code = genResult[0];
    this.inited = false;

    GlobalVar.super.constructor.apply(this, arguments);
}
Webvs.GlobalVar = Webvs.defineClass(GlobalVar, Webvs.Component, {
    /**
     * initializes the globalvar component
     * @memberof Webvs.GlobalVar#
     */
	init: function(gl, main, parent) {
		GlobalVar.super.init.call(this, gl, main, parent);

        this.code.setup(main, this);
	},

    /**
     * Runs the code
     * @memberof Webvs.GlobalVar#
     */
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
