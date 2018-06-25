import { AudioChannels, FloatArray } from "../utils";

/**
 * AnalyserAdapter adapts music data analysers so that it can be plugged into Webvs.
 *
 * Implement this to send music data into webvs
 */
export default abstract class AnalyserAdapter {
    /**
     * returns boolean value indicating whether a beat
     * is in progress or not
     */
    public abstract isBeat(): boolean;

    /**
     * Called every frame. Override and implement analyser code
     */
    public abstract update(): void;

    /**
     * Returns array of waveform values. Override and implement analyser code
     * @param channel channel for which waveform data will be returned
     */
    public abstract getWaveform(channel?: AudioChannels): FloatArray;

    /**
     * Returns array of spectrum values. Override and implement analyser code
     * @param channel channel for which spectrum data will be returned
     */
    public abstract getSpectrum(channel?: AudioChannels): FloatArray;
}
