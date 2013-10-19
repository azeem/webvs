/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {
/**
 * OnBeatClear - clears the screen on beat
 * @param options
 * @constructor
 */
function ClearScreen(options) {
    options = _.defaults(options, {
        n: 0,
        color: "#000000",
        blendMode: "REPLACE"
    });
    this.n = options.n;
    this.color = Webvs.parseColorNorm(options.color);

    this.outputBlendMode = Webvs.blendModes[options.blendMode];

    this.prevBeat = false;
    this.beatCount = 0;

    this.program = new Webvs.ClearScreenProgram(this.outputBlendMode);

    ClearScreen.super.constructor.call(this);
}
Webvs.ClearScreen = Webvs.defineClass(ClearScreen, Webvs.Component, {
    componentName: "ClearScreen",

    init: function(gl, main, parent) {
        ClearScreen.super.init.call(this, gl, main, parent);
        this.program.init(gl);
    },

    update: function() {
        var clear = false;
        if(this.n === 0) {
            clear = true;
        } else {
            if(this.main.analyser.beat && !this.prevBeat) {
                this.beatCount++;
                if(this.beatCount == this.n) {
                    clear = true;
                    this.beatCount = 0;
                }
            }
            this.prevBeat = this.main.analyser.beat;
        }

        if(clear) {
            this.program.run(this.parent.fm, null, this.color);
        }
    }
});

ClearScreen.ui = {
    type: "ClearScreen",
    disp: "Clear Screen",
    schema: {
        n: {
            type: "number",
            title: "Clear on beat (0 = always clear)",
            default: 0
        },
        color: {
            type: "string",
            title: "Clear color",
            format: "color",
            default: "#000000"
        },
        blendMode: {
            type: "string",
            title: "Blend Mode",
            enum: _.keys(Webvs.blendModes)
        }
    }
};

})(Webvs);
