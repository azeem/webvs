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
function Movement(options) {
    options = _.defaults(options, {
        bFilter: true,
        coord: "POLAR",
        compat: false
    });

    Movement.super.constructor.call(this, {
        noGrid: true,
        bFilter: options.bFilter,
        compat: options.compat,
        coord: options.coord,
        code: options.code
    });
    this.options = options;
}
Webvs.Movement = Webvs.defineClass(Movement, Webvs.DynamicMovement);

})(Webvs);
