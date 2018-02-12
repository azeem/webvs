/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

import AnalyserAdapter, { Channel } from './AnalyserAdapter';
import _ from 'lodash';

interface VisData {
    spectrum: Float32Array,
    waveform: Float32Array
}

// AnalyserAdapter adapts music data analysers so that it can be plugged into Webvs.
// Adapters extend this class and define the required methods.
export default class WebAudioAnalyser extends AnalyserAdapter {
    private context: AudioContext;
    private fftSize: number;
    private threshold: number;
    private movingThreshold: number = 0;
    private decay: number;
    private visData: [VisData, VisData, VisData];
    private source: AudioNode;
    private gain: GainNode;
    private channelSplit: ChannelSplitterNode;
    private analysers: [AnalyserNode, AnalyserNode];

    constructor(options) {
        super();
        options = _.defaults(options||{}, {
            fftSize: 512,
            threshold: 0.125,
            decay: 0.02
        });

        if(options.context) {
            this.context = options.context;
        } else if((window as any).webkitAudioContext) {
            this.context = new (window as any).webkitAudioContext();
        } else if((window as any).AudioContext) {
            this.context = new (window as any).AudioContext();
        } else {
            throw new Error("Cannot create webaudio context");
        }

        this.fftSize = options.fftSize;

        this.threshold = options.threshold;
        this.decay = options.decay;

        this.visData = [null, null, null];
        for(var ch = 0;ch < 3;ch++) {
            const spectrum = new Float32Array(this.fftSize/2);
            const waveform = new Float32Array(this.fftSize);
            this.visData[ch] = {spectrum: spectrum, waveform: waveform};
        }
    }

    // Connect this analyser to any WebAudio Node
    connectToNode(sourceNode: AudioNode) {
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
        this.analysers = [null, null];
        for(var ch = 0;ch < 2;ch++) {
            var analyser = this.context.createAnalyser();
            analyser.fftSize = this.fftSize;
            this.channelSplit.connect(analyser, ch);
            this.analysers[ch] = analyser;
        }
    }

    update() {
        if(!this.analysers) {
            return; // analysers not ready. nothing update
        }
        var byteBuffer = new Uint8Array(this.fftSize);
        for(let ch = 0;ch < 2;ch++) {
            const visData = this.visData[ch+1];
            const analyser = this.analysers[ch];

            analyser.getByteFrequencyData(byteBuffer);
            for(let i = 0;i < visData.spectrum.length;i++) { // scale to 0-1 range
                visData.spectrum[i] = byteBuffer[i]/255;
            }

            analyser.getByteTimeDomainData(byteBuffer);
            for(let i = 0;i < visData.waveform.length;i++) { // scale to -1 to 1 range
                visData.waveform[i] = (byteBuffer[i]/255)*2-1;
            }
        }

        // center channel is average of left and right
        const centerVisData = this.visData[0];
        for(let i = 0;i < centerVisData.spectrum.length;i++) {
            centerVisData.spectrum[i] = (this.visData[1].spectrum[i]/2+this.visData[2].spectrum[i]/2);
        }
        for(let i = 0;i < centerVisData.waveform.length;i++) {
            centerVisData.waveform[i] = (this.visData[1].waveform[i]/2+this.visData[2].waveform[i]/2);
        }

        // Simple kick detection 
        this.beat = false;
        let peak_left = 0, peak_right = 0;
        for(let i = 0;i < this.fftSize;i++) {
            peak_left += Math.abs(this.visData[1].waveform[i]);
            peak_right += Math.abs(this.visData[2].waveform[i]);
        }
        const peak = Math.max(peak_left, peak_right)/this.fftSize;

        if(peak >= this.movingThreshold && peak >= this.threshold) {
            this.movingThreshold = peak;
            this.beat = true;
        } else {
            this.movingThreshold = this.movingThreshold*(1-this.decay)+peak*this.decay;
        }
    }

    // Helper for Webvs.WebAudioAnalyser#connectToNode. This creates Audio object
    // for the audio file and connects this analyser to its mediaElementSource
    load(source: HTMLMediaElement | string, readyFunc): HTMLMediaElement {
        let element: HTMLMediaElement;
        if(source instanceof HTMLMediaElement) {
            element = source;
            this.source = this.context.createMediaElementSource(element);
        } else {
            element = new Audio();
            element.src = source;
            this.source = this.context.createMediaElementSource(element);
        }

        const onCanPlay = () => {
            this.connectToNode(this.source);
            this.source.connect(this.context.destination);

            if(readyFunc) {
                readyFunc(element);
            }

            element.removeEventListener("canplay", onCanPlay);
        };
        if(element.readyState < 3) {
            element.addEventListener("canplay", onCanPlay);
        } else {
            onCanPlay();
        }

        return element;
    }

    // Returns array of waveform values
    getWaveform(channel: Channel = Channel.CENTER) {
        return this.visData[channel].waveform;
    }

    // Returns array of spectrum values
    getSpectrum(channel: Channel = Channel.CENTER) {
        return this.visData[channel].spectrum;
    }
}