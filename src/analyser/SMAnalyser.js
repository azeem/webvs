/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * SMAnalyser connects SoundManager2 waveform and eqData to Webvs
 *
 * @example
 * soundManager.setup({
 *   url: "./soundmanager2/swf",
 *   flashVersion: 9,
 *   preferFlash: true
 * });
 * var analyser = new SMAnalyser();
 * analyser.createSound({
 *   autoPlay: true,
 *   url: json.stream_url + "?client_id=" + clientId
 * });
 *
 * @param {object} [options] - option object
 * @param {number} [options.threshold=0.125] - 0-1 threshold amplitude which will be treated as a beat
 * @param {number} [options.decay=0.02] - decay for a moving threshold 
 * @memberof Webvs
 * @constructor
 */
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
    /**
     * Creates a new SMSound object and attaches it to this analyser
     * @memberof Webvs.SMAnalyser
     * @param {object} options - soundManager.createSound options
     * @returns {SMSound} the new sound object
     */
    createSound: function(options) {
        var this_ = this;
        options.useWaveformData = true;
        options.useEQData = true;
        options.whileplaying = function() {
            this_._update();
        };
        this.sound = soundManager.createSound(options);
        return this.sound;
    },

    /**
     * Attaches an SMSound object to this analyser
     * @memberof Webvs.SMAnalyser
     * @param {string|SMSound} - sound id or the SMSound object to be attached
     */
    attachSound: function(sound) {
        if(_.isString(sound)) {
            sound = soundManager.getSoundById(sound);
        }
        this.sound = sound;
        var this_ = this;
        sound.instanceOptions.whileplaying = function() {
            this_._update();
        };
    },

    /**
     * Detaches an SMSound object from this analyser
     * @memberof Webvs.SMAnalyser
     * @param {string|SMSound} - sound id or the SMSound object to be attached
     */
    detachSound: function(sound) {
        if(_.isString(sound)) {
            sound = soundManager.getSoundById(sound);
        }
        sound.instanceOptions.whileplaying = undefined;
        this.sound = undefined;
    },

    _update: function() {
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

    /**
     * Returns array of waveform values
     * @abstract
     * @returns {Float32Array}
     * @memberof Webvs.AnalyserAdapter#
     */
    getWaveform: function(channel) {
        channel = _.isUndefined(channel)?0:channel;
        return this.waveformData[channel];
    },

    /**
     * Returns array of spectrum values
     * @abstract
     * @returns {Float32Array}
     * @memberof Webvs.AnalyserAdapter#
     */
    getSpectrum: function(channel) {
        channel = _.isUndefined(channel)?0:channel;
        return this.eqData[channel];
    }
});

})(Webvs);
