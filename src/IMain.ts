import AnalyserAdapter from "./analyser/AnalyserAdapter";
import ComponentRegistry from "./ComponentRegistry";
import Model from "./Model";
import ResourceManager from "./ResourceManager";
import CopyProgram from "./webgl/CopyProgram";
import FrameBufferManager from "./webgl/FrameBufferManager";
import RenderingContext from "./webgl/RenderingContext";

export default interface IMain extends Model {
    rctx: RenderingContext;
    rsrcMan: ResourceManager;
    copier: CopyProgram;
    analyser: AnalyserAdapter;
    componentRegistry: ComponentRegistry;
    tempBuffers: FrameBufferManager;
    registerBank: {[key: string]: number};
    bootTime: number;
}
