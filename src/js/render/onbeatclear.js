/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

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
    this.color = parseColorNorm(options.color);
    this.outputBlendMode = blendModes[options.blendMode];

    this.prevBeat = false;
    this.beatCount = 0;

    var fragmentSrc = [
        "uniform vec3 u_color;",
        "void main() {",
        "   setFragColor(vec4(u_color, 1));",
        "}"
    ].join("\n");

    ClearScreen.super.constructor.call(this, fragmentSrc);
}
extend(ClearScreen, QuadBoxComponent, {
    componentName: "ClearScreen",

    init: function() {
        var gl = this.gl;
        this.colorLocation = gl.getUniformLocation(this.program, "u_color");
        FadeOut.super.init.apply(this, arguments);
    },

    update: function() {
        var gl = this.gl;

        var clear = false;
        if(this.n === 0) {
            clear = true;
        } else {
            if(this.analyser.beat && !this.prevBeat) {
                this.beatCount++;
                if(this.beatCount == this.n) {
                    clear = true;
                    this.beatCount = 0;
                }
            }
            this.prevBeat = this.analyser.beat;
        }

        if(clear) {
            gl.uniform3fv(this.colorLocation, this.color);
            ClearScreen.super.update.apply(this, arguments);
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
            enum: _.keys(blendModes)
        }
    }
};

window.Webvs.ClearScreen = ClearScreen;
