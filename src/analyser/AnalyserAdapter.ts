import { FloatArray } from "../utils";

export enum Channel {
    CENTER = 0,
    LEFT,
    RIGHT,
}

// AnalyserAdapter adapts music data analysers so that it can be plugged into Webvs.
// Adapters extend this class and define the required methods.
export default abstract class AnalyserAdapter {
    // boolean value indicating whether a beat
    // is in progress or not
    public beat = false;

    // Called every frame. Override and implement analyser code
    public abstract update(): void;

    // Returns array of waveform values
    public abstract getWaveform(channel?: Channel): FloatArray;

    // Returns array of spectrum values
    public abstract getSpectrum(channel?: Channel): FloatArray;
}
