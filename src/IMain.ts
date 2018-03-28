import AnalyserAdapter from "./analyser/AnalyserAdapter";
import ComponentRegistry from "./ComponentRegistry";
import Model from "./Model";
import ResourceManager from "./ResourceManager";
import CopyProgram from "./webgl/CopyProgram";
import RenderingContext from "./webgl/RenderingContext";
import TextureSetManager from "./webgl/TextureSetManager";

/**
 * Interface for [[Main]] like objects. This is
 * used by Components to refer to main, avoiding circular references
 */
export default interface IMain extends Model {
    /**
     * Returns the rendering context for webgl rendering
     */
    getRctx(): RenderingContext;
    /**
     * Returns the Resource Manager that manages media resources
     */
    getRsrcMan(): ResourceManager;
    /**
     * Returns A shader program that can be used to copy frames
     */
    getCopier(): CopyProgram;
    /**
     * Returns the analyser instance that's used to get music data
     * for the visualization
     */
    getAnalyser(): AnalyserAdapter;
    /**
     * Returns a registry of [[Component]] classes that will be used
     * to create preset effects
     */
    getComponentRegistry(): ComponentRegistry;
    /**
     * Returns a TextureSetManager for global temporary textures, that can
     * be shared between components.
     */
    getTempTSM(): TextureSetManager;
    /**
     * Returns register bank, a map of shared register values available
     * in EEL code in components.
     */
    getRegisterBank(): {[key: string]: number};
    /**
     * Returns the timestamp at which this instance was constructed
     */
    getBootTime(): number;
}
