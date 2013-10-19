/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * AnalyserAdapters adapts analyser code so that
 * it can be plugged into Webvs
 * @memberof Webvs
 * @constructor
 */
function AnalyserAdapter() {}
Webvs.AnalyserAdapter = Webvs.defineClass(AnalyserAdapter, Object, {
    /**
     * boolean value indicating whether a beat
     * is in progress or not
     * @type boolean
     * @memberof Webvs.AnalyserAdapter
     */
    beat: false,

    /**
     * returns whether song is being played or not
     * @abstract
     * @returns {boolean}
     * @memberof Webvs.AnalyserAdapter
     */
    isPlaying: function() {return false;},

    /**
     * Returns array of waveform values
     * @abstract
     * @returns {Float32Array}
     * @memberof Webvs.AnalyserAdapter
     */
    getWaveForm: function() {return new Float32Array(0);},

    /**
     * Returns array of spectrum values
     * @abstract
     * @returns {Float32Array}
     * @memberof Webvs.AnalyserAdapter
     */
    getSpectrum: function() {return new Float32Array(0);}
});

})(Webvs);
