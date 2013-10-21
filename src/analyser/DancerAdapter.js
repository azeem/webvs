/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * Analyser adapter that adapts the Dancer library.
 * @param dancer
 * @augments Webvs.AnalyserAdapter
 * @constructor
 * @memberof Webvs
 */
function DancerAdapter(dancer) {
    this.dancer = dancer;
    this.beat = false;

    var _this = this;
    this.kick = dancer.createKick({
        onKick: function(mag) {
            _this.beat = true;
        },

        offKick: function() {
            _this.beat = false;
        }
    });
    this.kick.on();
}
Webvs.DancerAdapter = Webvs.defineClass(DancerAdapter, Webvs.AnalyserAdapter, {
    /**
     * returns whether song is being played or not.
     * @returns {boolean}
     * @memberof Webvs.DancerAdapter
     */
    isPlaying: function() {
        return this.dancer.isPlaying();
    },

    /**
     * returns array of waveform values
     * @returns {Float32Array}
     * @memberof Webvs.DancerAdapter
     */
    getWaveform: function() {
        return this.dancer.getWaveform();
    },

    /**
     * Returns array of spectrum values
     * @returns {Float32Array}
     * @memberof Webvs.DancerAdapter
     */
    getSpectrum: function() {
        return this.dancer.getSpectrum();
    }
});

})(Webvs);
