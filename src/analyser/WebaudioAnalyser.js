/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * AnalyserAdapter adapts music data analysers so that it can be plugged into Webvs.
 * Adapters extend this class and define the required methods.
 * @memberof Webvs
 * @constructor
 */
function WebAudioAnalyser(fftSize) {
    this.context = new AudioContext();

    this.fftSize = fftSize || 512;
    this.visData = [];
    for(var ch = 0;ch < 3;ch++) {
        var spectrum = new Float32Array(this.fftSize/2);
        var waveform = new Float32Array(this.fftSize);
        this.visData[ch] = {spectrum: spectrum, waveform: waveform};
    }
}
Webvs.WebAudioAnalyser = Webvs.defineClass(WebAudioAnalyser, Webvs.AnalyserAdapter, {
    connectToNode: function(sourceNode) {
        // this gain node simply up/down mixes input source to stereo output
        this.gain = this.context.createGain();
        this.gain.value = 1.0;
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

    load: function(source) {
        var element;
        if(source instanceof HTMLMediaElement) {
            element = source;
        } else {
            element = new Audio();
            element.src = source;
        }

        var this_ = this;
        var onCanPlay = function() {
            this_.source = this_.context.createMediaElementSource(element);
            this_.connectToNode(this_.source);
            this_.source.connect(this_.context.destination);
        };
        if(element.readyState < 3) {
            onCanPlay();
        } else {
            element.addEventListener("canplay", onCanPlay);
        }

        return element;
    },

    frame: function() {
        if(!this.analysers) {
            return;
        }
        var i;
        var byteBuffer = new Uint8Array(this.fftSize);
        for(var ch = 0;ch < 2;ch++) {
            var visData = this.visData[ch+1];
            var analyser = this.analysers[ch];

            analyser.getFloatFrequencyData(visData.spectrum);
            for(i = 0;i < visData.spectrum.length;i++) { // scale to 0-1 range
                visData.spectrum[i] = (visData.spectrum[i]-analyser.minDecibels)/(analyser.maxDecibels-analyser.minDecibels);
            }

            analyser.getByteTimeDomainData(byteBuffer);
            for(i = 0;i < visData.waveform.length;i++) { // scale to -1 to 1 range
                visData.waveform[i] = (byteBuffer[i]/255)*2-1;
            }
        }

        // center channel is average of left and right
        var centerVisData = this.visData[0];
        for(i = 0;i < centerVisData.spectrum.length;i++) {
            centerVisData.spectrum[i] = (this.visData[1].spectrum[i]+this.visData[2].spectrum[i])/2;
        }
        for(i = 0;i < centerVisData.waveform.length;i++) {
            centerVisData.waveform[i] = (this.visData[1].waveform[i]+this.visData[2].waveform[i])/2;
        }

        // TODO: do beat detection here
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
