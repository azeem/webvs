import Model from "./Model";
import ResourceManager from './ResourceManager';
import CopyProgram from './webgl/CopyProgram';
import AnalyserAdapter from "./analyser/AnalyserAdapter";
import RenderingContext from "./webgl/RenderingContext";

export default interface IMain extends Model {
    rctx: RenderingContext;
    rsrcMan: ResourceManager;
    copier: CopyProgram;
    analyser: AnalyserAdapter;
}