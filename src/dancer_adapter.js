/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

/**
 * AnalyserAdapters adapts analyser code so that
 * it can be plugged into Webvs
 * @constructor
 */
function AnalyserAdapterBase() {}
extend(AnalyserAdapterBase, Object, {
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

/**
 * Analyser adapter to use Dance library with webvs
 * @param dancer
 * @constructor
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
extend(DancerAdapter, AnalyserAdapterBase, {
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

window.Webvs.DancerAdapter = DancerAdapter;