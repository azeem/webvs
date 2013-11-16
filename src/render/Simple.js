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
Webvs.Simple = Webvs.defineClass(Simple, Webvs.Component, {
    defaultOptions: {
        drawMode: "SOLID",
        source: "WAVEFORM",
        align: "CENTER",
        colors: ["#ffffff"]
    },

    onChange: {
        "drawMode": ["updateCode", "updateDrawMode"]
        "source": ["updateCode", "optPassThru"],
        "align": "updateCode",
        "colors": "optsPassThru"
    },

    init: function() {
        var sscopeOpts = {
            source: this.opts.source,
            drawMode: this._drawMode(),
            colors: this.opts.colors,
            code: this._makeCode()
        };
        this.sscope = new Webvs.SuperScope(this.gl, this.main, this.parent, sscopeOpts);
    },

    draw: function() {
        this.sscope.draw();
    },

    destroy: function() {
        this.sscope.destroy();
    },

    updateDrawMode: function() {
        this.sscope.setOption("drawMode", this._drawMode());
    },

    optPassThru: function(name, value) {
        this.sscope.setOption(name, value);
    }

    updateCode: function() {
        this.sscope.setOption("code", this._makeCode());
    },

    _drawMode: function() {
        return (this.opts.drawMode=="SOLID"?"LINES":this.opts.drawMode);
    },

    _makeCode: function() {
        var code = {};
        var opts = this.opts;
        if(opts.drawMode != "SOLID") {
            code.init = "n=w;";
            code.perPoint = ({
                "TOP":    "x=i*2-1; y=-v/2-0.5;",
                "CENTER": "x=i*2-1; y=-v/2;",
                "BOTTOM": "x=i*2-1; y=v/2+0.5;"
            })[opts.align];
        } else {
            code.init = "n=w*2;";
            code.perFrame = "c=0;";
            if(opts.source == "SPECTRUM") {
                code.perPoint = ({
                    "TOP":    "x=i*2-1; y=if(c%2,0,-v/2-0.5); c=c+1;",
                    "CENTER": "x=i*2-1; y=if(c%2,0.5,-v/2);   c=c+1;",
                    "BOTTOM": "x=i*2-1; y=if(c%2,0,v/2+0.5);  c=c+1;",
                })[opts.align];
            } else {
                code.perPoint = ({
                    "TOP":    "x=i*2-1; y=if(c%2,-0.5,-v/2-0.5); c=c+1;",
                    "CENTER": "x=i*2-1; y=if(c%2,0,-v/2);        c=c+1;",
                    "BOTTOM": "x=i*2-1; y=if(c%2,0.5,v/2+0.5);   c=c+1;",
                })[opts.align];
            }
        }
        return code;
    }

});

})(Webvs);
