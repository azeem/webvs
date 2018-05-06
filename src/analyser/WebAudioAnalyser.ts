import { Channels } from "../utils";
import AnalyserAdapter from "./AnalyserAdapter";

interface IVisData {
    spectrum: Float32Array;
    waveform: Float32Array;
}

/**
 * Options for [[WebAudioAnalyser]]
 */
interface IWebAudioAnalyserOpts {
    /**
     * WebAudio Context to be used for creating audio objects.
     * If none is provided an AudioContext is automatically created.
     */
    context?: AudioContext;
    /**
     * Decay for beat detection. Default: 0.02
     */
    decay?: number;
    /**
     * Size of FFT window size. Default: 512
     */
    fftSize?: number;
    /**
     * Value threshold of beat detection. Default: 0.125
     */
    threshold?: number;
}

/**
 * WebAudioAnalyser is an AnalyserAdapter that supports `audio` tag sources
 */
export default class WebAudioAnalyser extends AnalyserAdapter {
    private context: AudioContext;
    private fftSize: number;
    private threshold: number;
    private movingThreshold: number = 0;
    private decay: number;
    private visData: [IVisData, IVisData, IVisData];
    private source: AudioNode;
    private gain: GainNode;
    private channelSplit: ChannelSplitterNode;
    private analysers: [AnalyserNode, AnalyserNode];
    private beat: boolean;

    /**
     * Initializes a WebAudioAnalyser
     * @param options options for analyser
     */
    constructor(options: IWebAudioAnalyserOpts = {}) {
        super();
        options = {
            decay: 0.02,
            fftSize: 512,
            threshold: 0.125,
            ...options
        };

        if (options.context) {
            this.context = options.context;
        } else if ((window as any).webkitAudioContext) {
            this.context = new (window as any).webkitAudioContext();
        } else if ((window as any).AudioContext) {
            this.context = new (window as any).AudioContext();
        } else {
            throw new Error("Cannot create webaudio context");
        }

        this.fftSize = options.fftSize;

        this.threshold = options.threshold;
        this.decay = options.decay;

        this.visData = [null, null, null];
        for (let ch = 0; ch < 3; ch++) {
            const spectrum = new Float32Array(this.fftSize / 2);
            const waveform = new Float32Array(this.fftSize);
            this.visData[ch] = {spectrum, waveform};
        }
    }

    /**
     * Connect this analyser to any WebAudio Node
     * @param sourceNode node which will be used as audio source
     */
    public connectToNode(sourceNode: AudioNode) {
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
        for (let ch = 0; ch < 2; ch++) {
            const analyser = this.context.createAnalyser();
            analyser.fftSize = this.fftSize;
            this.channelSplit.connect(analyser, ch);
            this.analysers[ch] = analyser;
        }
    }

    // Called every frame. Override and implement analyser code
    public update() {
        if (!this.analysers) {
            return; // analysers not ready. nothing update
        }
        const byteBuffer = new Uint8Array(this.fftSize);
        for (let ch = 0; ch < 2; ch++) {
            const visData = this.visData[ch + 1];
            const analyser = this.analysers[ch];

            analyser.getByteFrequencyData(byteBuffer);
            for (let i = 0; i < visData.spectrum.length; i++) { // scale to 0-1 range
                visData.spectrum[i] = byteBuffer[i] / 255;
            }

            analyser.getByteTimeDomainData(byteBuffer);
            for (let i = 0; i < visData.waveform.length; i++) { // scale to -1 to 1 range
                visData.waveform[i] = (byteBuffer[i] / 255) * 2 - 1;
            }
        }

        // center channel is average of left and right
        const centerVisData = this.visData[0];
        for (let i = 0; i < centerVisData.spectrum.length; i++) {
            centerVisData.spectrum[i] = (this.visData[1].spectrum[i] / 2 + this.visData[2].spectrum[i] / 2);
        }
        for (let i = 0; i < centerVisData.waveform.length; i++) {
            centerVisData.waveform[i] = (this.visData[1].waveform[i] / 2 + this.visData[2].waveform[i] / 2);
        }

        // Simple kick detection
        this.beat = false;
        let peakLeft = 0;
        let peakRight = 0;
        for (let i = 0; i < this.fftSize; i++) {
            peakLeft += Math.abs(this.visData[1].waveform[i]);
            peakRight += Math.abs(this.visData[2].waveform[i]);
        }
        const peak = Math.max(peakLeft, peakRight) / this.fftSize;

        if (peak >= this.movingThreshold && peak >= this.threshold) {
            this.movingThreshold = peak;
            this.beat = true;
        } else {
            this.movingThreshold = this.movingThreshold * (1 - this.decay) + peak * this.decay;
        }
    }

    /**
     * Helper for Webvs.WebAudioAnalyser#connectToNode. This creates Audio object
     * for the audio file and connects this analyser to its mediaElementSource
     * @param source source for the audio. Use an audio tag element or a url
     * @param readyFunc a callback that'll be called when ready to play
     */
    public load(source: HTMLMediaElement | string, readyFunc): HTMLMediaElement {
        let element: HTMLMediaElement;
        if (source instanceof HTMLMediaElement) {
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

            if (readyFunc) {
                readyFunc(element);
            }

            element.removeEventListener("canplay", onCanPlay);
        };
        if (element.readyState < 3) {
            element.addEventListener("canplay", onCanPlay);
        } else {
            onCanPlay();
        }

        return element;
    }

    // Returns array of waveform values
    public getWaveform(channel: Channels = Channels.CENTER) {
        return this.visData[channel].waveform;
    }

    // Returns array of spectrum values
    public getSpectrum(channel: Channels = Channels.CENTER) {
        return this.visData[channel].spectrum;
    }

    // boolean value indicating whether a beat
    // is in progress or not
    public isBeat(): boolean {
        return this.beat;
    }
}
