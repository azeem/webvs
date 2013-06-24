/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

/**
 * ChannelShift component
 * @param options
 * @constructor
 */
function ChannelShift(options) {
    options = _.defaults(options, {
        channel: "RGB",
        onBeatRandom: false
    });

    this.channel = this.channels.indexOf(options.channel);
    if(this.channel == -1) {
        throw new Error("Invalid Channel");
    }
    this.onBeatRandom = options.onBeatRandom;

    var fragmentSrc = [
        "precision mediump float;",
        "uniform vec2 u_resolution;",
        "uniform sampler2D u_curRender;",
        "varying vec2 v_texCoord;",
        "uniform int u_channel;",

        "void main() {",
        "   vec3 color = texture2D(u_curRender, v_texCoord).rgb;",

        _.flatMap(this.channels, function(channel, index) {
            return [
                "if(u_channel == "+index+") {",
                "   gl_FragColor = vec4(color." + channel.toLowerCase() + ",1);",
                "}"
            ];
        }).join("\n"),

        "}"
    ].join("\n");

    ChannelShift.super.constructor.call(this, fragmentSrc);
}
extend(ChannelShift, Trans, {
    channels: ["RGB", "RBG", "BRG", "BGR", "GBR", "GRB"],

    init: function() {
        var gl = this.gl;
        this.channelLocation = gl.getUniformLocation(this.program, "u_channel");
        ChannelShift.super.init.call(this);
    },

    update: function(texture) {
        var gl = this.gl;
        if(this.onBeatRandom && this.analyser.beat) {
            this.channel = Math.floor(Math.random() * this.channels.length);
        }
        gl.uniform1i(this.channelLocation, this.channel);
        ChannelShift.super.update.call(this, texture);
    }
});
Webvs.ChannelShift = ChannelShift;