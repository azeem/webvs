/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that swizzles the color component
function ChannelShift(gl, main, parent, opts) {
    ChannelShift.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(ChannelShift, {
    name: "ChannelShift",
    menu: "Trans"
});

var Channels = {
    "RGB": 0,
    "RBG": 1,
    "BRG": 2,
    "BGR": 3,
    "GBR": 4,
    "GRB": 5
};
ChannelShift.Channels = Channels;

Webvs.ChannelShift = Webvs.defineClass(ChannelShift, Webvs.Component, {
    defaultOptions: {
        channel: "RGB",
        onBeatRandom: false
    },

    onChange: {
        channel: "updateChannel"
    },

    init: function() {
        this.program = new ChannelShiftProgram(this.gl);
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
        this.program.destroy();
    },

    updateChannel: function() {
        this.channel = Webvs.getEnumValue(this.opts.channel, Channels);
    }
});

function ChannelShiftProgram(gl) {
    ChannelShiftProgram.super.constructor.call(this, gl, {
        swapFrame: true,
        fragmentShader: [
            "uniform int u_channel;",
            "void main() {",
            "   vec3 color = getSrcColor().rgb;",

            _.flatMap(_.keys(Channels), function(channel) {
                return [
                    "if(u_channel == "+Channels[channel]+") {",
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
