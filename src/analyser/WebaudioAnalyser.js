/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * AnalyserAdapter adapts music data analysers so that it can be plugged into Webvs.
 * Adapters extend this class and define the required methods.
 * @param {object} [options] - option object
 * @param {number} [options.fftSize=512 - fft bucket size
 * @param {number} [options.threshold=0.125] - 0-1 threshold amplitude which will be treated as a beat
 * @param {number} [options.decay=0.02] - decay for a moving threshold 
 * @memberof Webvs
 * @constructor
 */
function WebAudioAnalyser(options) {
    options = _.defaults(options||{}, {
        fftSize: 512,
        threshold: 0.125,
        decay: 0.02
    });

    if(options.context) {
        this.context = options.context;
    } else if(window.webkitAudioContext) {
        this.context = new webkitAudioContext();
    } else if(window.AudioContext) {
        this.context = new AudioContext();
    } else {
        throw new Error("Cannot create webaudio context");
    }

    this.fftSize = options.fftSize;

    this.threshold = options.threshold;
    this.movingThreshold = 0;
    this.decay = options.decay;

    this.visData = [];
    for(var ch = 0;ch < 3;ch++) {
        var spectrum = new Float32Array(this.fftSize/2);
        var waveform = new Float32Array(this.fftSize);
        this.visData[ch] = {spectrum: spectrum, waveform: waveform};
    }
}
Webvs.WebAudioAnalyser = Webvs.defineClass(WebAudioAnalyser, Webvs.AnalyserAdapter, {
    /**
     * Connect this analyser to any WebAudio Node
     * @memberof Webvs.WebAudioAnalyser#
     * @param {AudioNode} sourceNode - node which will give audio data to this analyzer
     */
    connectToNode: function(sourceNode) {
        this.source = sourceNode;

        // this gain node simply up/down mixes input source to stereo output
        this.gain = this.context.createGain();
        this.gain.channelCountMode = "explicit";
        this.gain.channelCount = 2;
        this.source.connect(this.gain);

        // split the stereo output into respective mono channels
        this.channelSplit = this.context.createChannelSplitter(2);
        this.gain.connect(this.channelSplit);

        // analser node for each channel
        this.analysers = [];
        for(var ch = 0;ch < 2;ch++) {
            var analyser = this.context.createAnalyser();
            analyser.fftSize = this.fftSize;
            this.channelSplit.connect(analyser, ch);
            this.analysers[ch] = analyser;
        }
    },

    update: function() {
        if(!this.analysers) {
            return; // analysers not ready. nothing update
        }
        var i;
        var byteBuffer = new Uint8Array(this.fftSize);
        for(var ch = 0;ch < 2;ch++) {
            var visData = this.visData[ch+1];
            var analyser = this.analysers[ch];

            analyser.getByteFrequencyData(byteBuffer);
            for(i = 0;i < visData.spectrum.length;i++) { // scale to 0-1 range
                visData.spectrum[i] = byteBuffer[i]/255;
            }

            analyser.getByteTimeDomainData(byteBuffer);
            for(i = 0;i < visData.waveform.length;i++) { // scale to -1 to 1 range
                visData.waveform[i] = (byteBuffer[i]/255)*2-1;
            }
        }

        // center channel is average of left and right
        var centerVisData = this.visData[0];
        for(i = 0;i < centerVisData.spectrum.length;i++) {
            centerVisData.spectrum[i] = (this.visData[1].spectrum[i]/2+this.visData[2].spectrum[i]/2);
        }
        for(i = 0;i < centerVisData.waveform.length;i++) {
            centerVisData.waveform[i] = (this.visData[1].waveform[i]/2+this.visData[2].waveform[i]/2);
        }

        // Simple kick detection 
        this.beat = false;
        var peak_left = 0, peak_right = 0;
        for(i = 0;i < this.fftSize;i++) {
            peak_left += Math.abs(this.visData[1].waveform[i]);
            peak_right += Math.abs(this.visData[2].waveform[i]);
        }
        var peak = Math.max(peak_left, peak_right)/this.fftSize;

        if(peak >= this.movingThreshold && peak >= this.threshold) {
            this.movingThreshold = peak;
            this.beat = true;
        } else {
            this.movingThreshold = this.movingThreshold*(1-this.decay)+peak*this.decay;
        }
    },

    /**
     * Helper for @link{Webvs.WebAudioAnalyser#connectToNode}. This creates Audio object
     * for the audio file and connects this analyser to its mediaElementSource
     * @memberof Webvs.WebAudioAnalyser#
     * @param {string|HTMLMediaElement} source - location of audio file or a media DOM
     * @param {boolean} [autoplay=false] - automatically starts playing the Audio when its ready
     * @param {function} [readyFunc] - this function is called when the Audio is ready to be played
     * @returns {HTMLMediaElement} the DOM media object. Use this to play/pause the audio
     */
    load: function(source, readyFunc) {
        var element;
        if(source instanceof HTMLMediaElement) {
            element = source;
            this.source = this.context.createMediaElementSource(element);
        } else {
            element = new Audio();
            element.src = source;
            this.source = this.context.createMediaElementSource(element);
        }

        var onCanPlay = _.bind(function() {
            this.connectToNode(this.source);

            if(readyFunc) {
                readyFunc(element);
            }

            element.removeEventListener("canplay", onCanPlay);
        }, this);
        if(element.readyState < 3) {
            element.addEventListener("canplay", onCanPlay);
        } else {
            onCanPlay();
        }

        return element;
    },

    /**
     * Returns array of waveform values
     * @abstract
     * @returns {Float32Array}
     * @memberof Webvs.AnalyserAdapter#
     */
    getWaveform: function(channel) {
        channel = _.isUndefined(channel)?0:channel;
        return this.visData[channel].waveform;
    },

    /**
     * Returns array of spectrum values
     * @abstract
     * @returns {Float32Array}
     * @memberof Webvs.AnalyserAdapter#
     */
    getSpectrum: function(channel) {
        channel = _.isUndefined(channel)?0:channel;
        return this.visData[channel].spectrum;
    }
});

})(Webvs);
