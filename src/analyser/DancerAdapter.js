/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// Analyser adapter that adapts the Dancer library.
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
    // returns array of waveform values
    getWaveform: function() {
        return this.dancer.getWaveform();
    },

    // Returns array of spectrum values
    getSpectrum: function() {
        return this.dancer.getSpectrum();
    }
});

})(Webvs);
