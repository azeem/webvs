/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * An alias class for {@link Webvs.DynamicMovement} with noGrid=true option
 * @param {object} options - options object
 * @param {string} [options.code.perPixel] - code that will be run once for every pixel. should set 
 *       `x`, `y` or `d`, `r` variables (depending on coord) to specify point location. Note: state 
 *        of this code does not persist.
 * @param {boolean} [options.compat=false] - if true, then calculations are low precision.
 *      useful to map winamp AVS behaviour more closely
 * @param {boolean} [options.bFilter=true] - use bilinear interpolation for pixel sampling
 * @param {string} [options.coord="POLAR"] - coordinate system to be used viz. `POLAR`, `RECT`
 * @augments Webvs.DynamicMovement
 * @constructor
 * @memberof Webvs
 * @constructor
 */

function Movement(gl, main, parent, opts) {
    Movement.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.Movement = Webvs.defineClass(Movement, Webvs.Component, {
    defaultOptions: {
        code: {
            perPixel: ""
        },
        bFilter: true,
        coord: "POLAR",
        compat: false
    },

    onChange: {
        "*": "updateOption"
    },

    init: function() {
        var opts = this.opts;
        var dmovOpts = {
            code: opts.code,
            bFilter: opts.bFilter,
            coord: opts.coord,
            compat: opts.compat,
            noGrid: true
        };
        this.dmov = new Webvs.DynamicMovement(this.gl, this.main, this.parent, dmovOpts);
        this.dmov.init();
    },

    draw: function() {
        this.dmov.draw();
    },

    destroy: function() {
        this.dmov.destroy();
    }

    updateOption: function(name, value) {
        this.dmov.setOption(name, value);
    }
});

})(Webvs);
