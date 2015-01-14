/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// AnalyserAdapter adapts music data analysers so that it can be plugged into Webvs.
// Adapters extend this class and define the required methods.
function AnalyserAdapter() {}
Webvs.AnalyserAdapter = Webvs.defineClass(AnalyserAdapter, Object, {
    // boolean value indicating whether a beat
    // is in progress or not
    beat: false,

    // Called every frame. Override and implement analyser code
    update: function() {},

    // Returns array of waveform values
    getWaveform: function(channel) {return new Float32Array(0);},

    // Returns array of spectrum values
    getSpectrum: function(channel) {return new Float32Array(0);}
});

})(Webvs);
