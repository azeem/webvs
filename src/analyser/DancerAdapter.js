/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * Analyser adapter that adapts the Dancer library.
 * @param dancer
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
    isPlaying: function() {
        return this.dancer.isPlaying();
    },

    getWaveform: function() {
        return this.dancer.getWaveform();
    },

    getSpectrum: function() {
        return this.dancer.getSpectrum();
    }
});

})(Webvs);
