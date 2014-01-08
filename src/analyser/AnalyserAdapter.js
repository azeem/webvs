/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * AnalyserAdapter adapts music data analysers so that it can be plugged into Webvs.
 * Adapters extend this class and define the required methods.
 * @memberof Webvs
 * @constructor
 */
function AnalyserAdapter() {}
Webvs.AnalyserAdapter = Webvs.defineClass(AnalyserAdapter, Object, {
    /**
     * boolean value indicating whether a beat
     * is in progress or not
     * @type boolean
     * @memberof Webvs.AnalyserAdapter#
     */
    beat: false,

    /**
     * Called every frame. Override and implement analyser code
     * @memberof Webvs.AnalyserAdapter#
     */
    update: function() {},

    /**
     * Returns array of waveform values
     * @abstract
     * @param {number} channel - the channel whose data is to be fetched. 0 - center, 1 - left, 2 - right
     * @returns {Float32Array}
     * @memberof Webvs.AnalyserAdapter#
     */
    getWaveform: function(channel) {return new Float32Array(0);},

    /**
     * Returns array of spectrum values
     * @abstract
     * @param {number} channel - the channel whose data is to be fetched. 0 - center, 1 - left, 2 - right
     * @returns {Float32Array}
     * @memberof Webvs.AnalyserAdapter#
     */
    getSpectrum: function(channel) {return new Float32Array(0);}
});

})(Webvs);
