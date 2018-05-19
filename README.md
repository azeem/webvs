# Webvs

[![npm version](https://badge.fury.io/js/webvs.svg)](https://www.npmjs.com/package/webvs)
[![CircleCI](https://img.shields.io/circleci/project/azeem/webvs.svg?)](https://circleci.com/gh/azeem/webvs/)
[![David](https://img.shields.io/david/azeem/webvs.svg)](https://david-dm.org/azeem/webvs)
[![David](https://img.shields.io/david/dev/azeem/webvs.svg)](https://david-dm.org/azeem/webvs?type=dev)

A Winamp AVS like visualization library for the web.

## Demo

Try out some examples, or test your own presets on the [Webvs test page](http://azeemarshad.in/webvs/examples/)

## Documentation

You can find TypeDoc generated documentation for Webvs on the [website](http://azeemarshad.in/webvs/).
The documentation for the [Main](http://azeemarshad.in/webvs/classes/main.html) class is a good place to start.

## Installation

### npm

For use with package bundlers, Webvs is available on [npm](https://www.npmjs.com/package/webvs) as `webvs`. Install using

	npm install webvs

and import in your code and initialize as follows

```js
import Webvs from 'webvs';
const webvs = new Webvs.Main(....)
```

### CDN

You can also embed webvs.js directly from [unpkg](https://unpkg.com) CDN.

	<script src="https://unpkg.com/webvs/dist/webvs.js"></script>

or for a minified version

	<script src="https://unpkg.com/webvs/dist/webvs.min.js"></script>

This script exposes a `Webvs` global which you can use to initialize like so `new Webvs.Main(...)`.

## Usage
A typical usage involves creating an Analyser from your music source (e.g. [Webvs.WebAudioAnalyser](http://azeemarshad.in/webvs/classes/webaudioanalyser.html) to use an `audio` tag or song url as a source) and initializing an instance of `Webvs.Main` with it. The main object serves as the primary interface or controlling the visualization. e.g.

```js
const analyser = new Webvs.WebAudioAnalyser();
const webvs = new Webvs.Main({
    canvas: document.getElementById("canvas"),
    analyser: analyser,
    showStat: true
});
webvs.loadPreset({
  "clearFrame": true,
  "components": [
      {
          "type": "SuperScope",
          "source": "WAVEFORM",
          "code": {
              "perPoint": "x=i*2-1;y=v;"
          },
          "colors": ["#ffffff"]
      }
  ]
});
webvs.start();
analyser.load("music.ogg");
analyser.play();
```

## Development

To develop Webvs clone the repo and install packages

	npm install

For typical workflow, start a dev server with

	npm run dev

and point browser to `http://localhost:8080/examples/` to view webvs test page.

## Contributing

[Fork](https://github.com/azeem/webvs/fork) and submit pull requests against master branch. Look for issues with [help wanted](https://github.com/azeem/webvs/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) label for things that we need help with. For suggestions/bug fixes use [Github/Issues](https://github.com/azeem/webvs/issues). Chat with us at [visbot/AVS gitter channel](https://gitter.im/visbot/AVS).