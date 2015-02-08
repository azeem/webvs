/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// SMAnalyser connects SoundManager2 waveform and eqData to Webvs
function SMAnalyser(options) {
    options = _.defaults(options||{}, {
        threshold: 0.125,
        decay: 0.02
    });

    this.threshold = options.threshold;
    this.movingThreshold = 0;
    this.decay = options.decay;

    this.eqData = [];
    this.waveformData = [];

    // initialize with empty data
    for(var ch = 0;ch < 3;ch++) {
        this.eqData[ch] = new Float32Array(256);
        this.waveformData[ch] = new Float32Array(256);
    }
}
Webvs.SMAnalyser = Webvs.defineClass(SMAnalyser, Webvs.AnalyserAdapter, {
    // Creates a new SMSound object and attaches it to this analyser
    createSound: function(options) {
        options.useWaveformData = true;
        options.useEQData = true;
        this.setSound(soundManager.createSound(options));
        return this.sound;
    },

    setSound: function(sound) {
        this.sound = sound;
    },

    update: function() {
        if(!this.sound || 
           this.sound.eqData.left.length === 0 || 
           this.sound.waveformData.left.length === 0) {
            return; // no sound. nothing to update
        }
        var i;

        this.eqData[1] = new Float32Array(this.sound.eqData.left);
        this.eqData[2]= new Float32Array(this.sound.eqData.right);

        this.waveformData[1] = new Float32Array(this.sound.waveformData.left);
        this.waveformData[2] = new Float32Array(this.sound.waveformData.right);

        for(i = 0;i < 256;i++) {
            // compute center channel
            this.eqData[0][i] = this.eqData[1][i]/2 + this.eqData[2][i]/2;
            this.waveformData[0][i] = this.waveformData[1][i]/2 + this.waveformData[2][i]/2;
        }

        // Simple kick detection 
        this.beat = false;
        var peak_left = 0, peak_right = 0;
        for(i = 0;i < 256;i++) {
            peak_left += Math.abs(this.waveformData[1][i]);
            peak_right += Math.abs(this.waveformData[2][i]);
        }
        var peak = Math.max(peak_left, peak_right)/256;

        if(peak >= this.movingThreshold && peak >= this.threshold) {
            this.movingThreshold = peak;
            this.beat = true;
        } else {
            this.movingThreshold = this.movingThreshold*(1-this.decay)+peak*this.decay;
        }
    },

    // Returns array of waveform values
    getWaveform: function(channel) {
        channel = _.isUndefined(channel)?0:channel;
        return this.waveformData[channel];
    },

    // Returns array of spectrum values
    getSpectrum: function(channel) {
        channel = _.isUndefined(channel)?0:channel;
        return this.eqData[channel];
    }
});

})(Webvs);
