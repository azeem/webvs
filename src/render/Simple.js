/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A simple scope that displays either waveform or spectrum data
 * @param {object} options - options object
 * @param {string} [options.drawMode="SOLID"] - draw mode viz. `SOLID`, `DOTS`, `LINES`
 * @param {string} [options.source="WAVEFORM"] - scope data source viz. `WAVEFORM`, `SPECTRUM`
 * @param {string} [options.align="CENTER"] - scope alignment viz. `TOP`, `CENTER`, `BOTTOM`
 * @param {Array.<String>} [options.colors=["#FFFFFF"]] - rendering color cycles through these colors
 * @augments Webvs.SuperScope
 * @constructor
 * @memberof Webvs
 */
function Simple(gl, main, parent, opts) {
    Simple.super.constructor.call(this, gl, main, parent, opts);
}
var DrawModes = _.extend({
    "SOLID": 50
}, Webvs.SuperScope.DrawModes);
var Align = {
    "TOP": 1,
    "CENTER": 2,
    "BOTTOM": 3
};
Webvs.Simple = Webvs.defineClass(Simple, Webvs.Component, {
    defaultOptions: {
        drawMode: "SOLID",
        source: "WAVEFORM",
        align: "CENTER",
        colors: ["#ffffff"]
    },

    onChange: {
        "drawMode": ["updateDrawMode", "updateCode",],
        "source": ["updateSource", "updateCode"],
        "align": ["updateAlign", "updateCode"],
        "colors": "optsPassThru"
    },

    init: function() {
        this.sscope = new Webvs.SuperScope(this.gl, this.main, this.parent, {
            colors: this.opts.colors
        });
        this.updateDrawMode();
        this.updateSource();
        this.updateAlign();
        this.updateCode();
    },

    draw: function() {
        this.sscope.draw();
    },

    destroy: function() {
        this.sscope.destroy();
    },

    updateDrawMode: function() {
        this.drawMode = Webvs.getEnumValue(this.opts.drawMode, DrawModes);
        var sscopeDrawMode = this.opts.drawMode;
        if(this.drawMode == DrawModes.SOLID) {
            sscopeDrawMode = "LINES";
        }
        this.sscope.setOption("drawMode", sscopeDrawMode);
    },

    updateSource: function() {
        this.source = Webvs.getEnumValue(this.opts.source, Webvs.Source);
        this.sscope.setOption("source", this.opts.source);
    },

    updateAlign: function() {
        this.align = Webvs.getEnumValue(this.opts.align, Align);
    },

    updateCode: function() {
        var code = {};
        if(this.drawMode != DrawModes.SOLID) {
            code.init = "n=w;";
            switch(this.align) {
                case Align.TOP:    code.perPoint = "x=i*2-1; y=-v/2-0.5;"; break;
                case Align.CENTER: code.perPoint = "x=i*2-1; y=-v/2;"; break;
                case Align.BOTTOM: code.perPoint = "x=i*2-1; y=v/2+0.5;"; break;
            }
        } else {
            code.init = "n=w*2;";
            code.perFrame = "c=0;";
            if(this.source == Webvs.Source.SPECTRUM) {
                switch(this.align) {
                    case Align.TOP:    code.perPoint = "x=i*2-1; y=if(c%2,0,-v/2-0.5); c=c+1;"; break;
                    case Align.CENTER: code.perPoint = "x=i*2-1; y=if(c%2,0.5,-v/2);   c=c+1;"; break;
                    case Align.BOTTOM: code.perPoint = "x=i*2-1; y=if(c%2,0,v/2+0.5);  c=c+1;"; break;
                }
            } else {
                switch(this.align) {
                    case Align.TOP:    code.perPoint = "x=i*2-1; y=if(c%2,-0.5,-v/2-0.5); c=c+1;"; break;
                    case Align.CENTER: code.perPoint = "x=i*2-1; y=if(c%2,0,-v/2);        c=c+1;"; break;
                    case Align.BOTTOM: code.perPoint = "x=i*2-1; y=if(c%2,0.5,v/2+0.5);   c=c+1;"; break;
                }
            }
        }
        this.sscope.setOption("code", code);
    },

    optPassThru: function(name, value) {
        this.sscope.setOption(name, value);
    },
});

})(Webvs);
