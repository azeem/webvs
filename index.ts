import Main from './src/Main';
import Component from './src/Component';
import WebAudioAnalyser from './src/analyser/WebAudioAnalyser';
import AnalyserAdapter from './src/analyser/AnalyserAdapter';
import ShaderProgram from './src/webgl/ShaderProgram';

export { Main, Component, ShaderProgram, WebAudioAnalyser, AnalyserAdapter };

const Webvs = {
    Main, Component, ShaderProgram,
    WebAudioAnalyser, AnalyserAdapter,
};

export default Webvs;
