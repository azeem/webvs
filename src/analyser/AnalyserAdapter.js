/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * AnalyserAdapters adapts analyser code so that
 * it can be plugged into Webvs
 * @constructor
 */
function AnalyserAdapter() {}
Webvs.AnalyserAdapter = AnalyserAdapter;
_.extend(AnalyserAdapter.prototype, Object, {
    /**
     * boolean value indicating whether a beat
     * is in progress or not
     */
    beat: false,

    /**
     * returns whether song is being played or not
     * @returns {boolean}
     */
    isPlaying: function() {return false;},

    /**
     * Returns array of waveform values
     * @returns {Float32Array}
     */
    getWaveForm: function() {return new Float32Array(0);},

    /**
     * Returns array of spectrum values
     * @returns {Float32Array}
     */
    getSpectrum: function() {return new Float32Array(0);}
});

})(Webvs);
