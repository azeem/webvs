import Model from "./Model";
import ResourceManager from './ResourceManager';
import CopyProgram from './webgl/CopyProgram';
import AnalyserAdapter from "./analyser/AnalyserAdapter";
import RenderingContext from "./webgl/RenderingContext";
import ComponentRegistry from "./ComponentRegistry";
import FrameBufferManager from "./webgl/FrameBufferManager";

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