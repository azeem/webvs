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
function Simple(options) {
    options = _.defaults(options, {
        drawMode: "SOLID",
        source: "WAVEFORM",
        align: "CENTER",
        colors: ["#ffffff"]
    });

    var code = {};
    if(options.drawMode != "SOLID") {
        code.init = "n=w;";
        code.perPoint = ({
            "TOP":    "x=i*2-1; y=-v/2-0.5;",
            "CENTER": "x=i*2-1; y=-v/2;",
            "BOTTOM": "x=i*2-1; y=v/2+0.5;"
        })[options.align];
    } else {
        code.init = "n=w*2;";
        code.perFrame = "c=0;";
        if(options.source == "SPECTRUM") {
            code.perPoint = ({
                "TOP":    "x=i*2-1; y=if(c%2,0,-v/2-0.5); c=c+1;",
                "CENTER": "x=i*2-1; y=if(c%2,0.5,-v/2);   c=c+1;",
                "BOTTOM": "x=i*2-1; y=if(c%2,0,v/2+0.5);  c=c+1;",
            })[options.align];
        } else {
            code.perPoint = ({
                "TOP":    "x=i*2-1; y=if(c%2,-0.5,-v/2-0.5); c=c+1;",
                "CENTER": "x=i*2-1; y=if(c%2,0,-v/2);        c=c+1;",
                "BOTTOM": "x=i*2-1; y=if(c%2,0.5,v/2+0.5);   c=c+1;",
            })[options.align];
        }
    }

    Simple.super.constructor.call(this, {
        source: options.source,
        drawMode: (options.drawMode=="SOLID"?"LINES":options.drawMode),
        colors: options.colors,
        code: code
    });
    this.options = options; // set Simple option instead of superscope options
}
Webvs.Simple = Webvs.defineClass(Simple, Webvs.SuperScope);

})(Webvs);
