/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that swizzles the color component
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
function ChannelShift(gl, main, parent, opts) {
    ChannelShift.super.constructor.call(this, gl, main, parent, opts);
}
ChannelShift.channels = ["RGB", "RBG", "BRG", "BGR", "GBR", "GRB"];
Webvs.ChannelShift = Webvs.defineClass(ChannelShift, Webvs.Component, {
    defaultOptions: {
        channel: "RGB",
        onBeatRandom: false
    },

    onChange: {
        channel: "updateChannel"
    },

    init: function() {
        this.program = new ChannelShiftProgram();
        this.program.init(this.gl);
        this.updateChannel();
    },

    draw: function() {
        if(this.opts.onBeatRandom && this.main.analyser.beat) {
            this.channel = Math.floor(Math.random() * ChannelShift.channels.length);
        }
        this.program.run(this.parent.fm, null, this.channel);
    },

    destroy: function() {
        ChannelShift.super.destroy.call(this);
        this.program.cleanup();
    },

    updateChannel: function() {
        var opts = this.opts;
        var index = ChannelShift.channels.indexOf(opts.channel);
        if(index == -1) {
            throw new Error("Unknown color channel " + opts.channel);
        }
        this.channel = index;
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

})(Webvs);
