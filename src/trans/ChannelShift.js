/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

var channels = ["RGB", "RBG", "BRG", "BGR", "GBR", "GRB"];

/**
 * @class
 * A component that {@link http://en.wikipedia.org/wiki/Swizzling_(computer_graphics)|swizzles}
 * the color component
 *
 * @param {object} options - options object
 * @param {string} [options.channel="RGB"] - the component combination 
 *     viz. `RGB`, `RBG`, `BRG`, `BGR`, `GBR`, `GRB`
 * @param {boolean} [options.onBeatRandom=false] - if set then the color components
 *     combination is changed randomly on beat
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
function ChannelShift(options) {
    options = _.defaults(options, {
        channel: "RGB",
        onBeatRandom: false
    });

    this.channel = channels.indexOf(options.channel);
    if(this.channel == -1) {
        throw new Error("Invalid Channel");
    }
    this.onBeatRandom = options.onBeatRandom;

    this.program = new ChannelShiftProgram();

    ChannelShift.super.constructor.call(this);
}
Webvs.ChannelShift = Webvs.defineClass(ChannelShift, Webvs.Component, {
    componentName: "ChannelShift",

    /**
     * initializes the ChannelShift component
     * @memberof Webvs.ChannelShift
     */
    init: function(gl, main, parent) {
        ChannelShift.super.init.call(this, gl, main, parent);

        this.program.init(gl);
    },

    /**
     * shifts the colors
     * @memberof Webvs.ChannelShift
     */
    update: function() {
        if(this.onBeatRandom && this.main.analyser.beat) {
            this.channel = Math.floor(Math.random() * channels.length);
        }
        this.program.run(this.parent.fm, null, this.channel);
    },

    /**
     * releases resources
     * @memberof Webvs.ChannelShift
     */
    destroy: function() {
        ChannelShift.super.destroy.call(this);
        this.program.cleanup();
    }

});

function ChannelShiftProgram() {
    ChannelShiftProgram.super.constructor.call(this, {
        swapFrame: true,
        fragmentShader: [
            "uniform int u_channel;",
            "void main() {",
            "   vec3 color = getSrcColor().rgb;",

            _.flatMap(channels, function(channel, index) {
                return [
                    "if(u_channel == "+index+") {",
                    "   setFragColor(vec4(color." + channel.toLowerCase() + ",1));",
                    "}"
                ];
            }).join("\n"),
        "}"
        ]
    });
}
Webvs.ChannelShiftProgram = Webvs.defineClass(ChannelShiftProgram, Webvs.QuadBoxProgram, {
    draw: function(channel) {
        this.setUniform("u_channel", "1i", channel);
        ChannelShiftProgram.super.draw.call(this);
    }
});

ChannelShift.ui = {
    disp: "Channel Shift",
    type: "ChannelShift",
    schema: {
        channel: {
            type: "string",
            title: "Channel",
            enum: channels
        },
        onBeatRandom: {
            type: "boolean",
            title: "On beat random",
        }
    }
};

})(Webvs);
