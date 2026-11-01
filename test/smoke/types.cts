import webvs = require("@visbot/webvs");

export const named: object[] = [webvs.AnalyserAdapter, webvs.Component, webvs.Main, webvs.ShaderProgram, webvs.WebAudioAnalyser];
export const version: string = webvs.default.Main.version;
