import Main from './src/Main';
import Component from './src/Component';
import WebAudioAnalyser from './src/analyser/WebAudioAnalyser';
import AnalyserAdapter from './src/analyser/AnalyserAdapter';
import ShaderProgram from './src/webgl/ShaderProgram';
import QuadBoxProgram from './src/webgl/QuadBoxProgram';

const Webvs = {
    Main, Component, 
    WebAudioAnalyser, AnalyserAdapter,
    ShaderProgram, QuadBoxProgram
};

export default Webvs;