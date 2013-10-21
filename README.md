# Webvs

A Winamp AVS like visualization tool for the browser. Webvs is a
javascript library that can be used to run visualization presets.

# Examples

+ [UnConeD-Jello Cube](http://azeemarshad.in/webvs/examples/JelloCube.html)
+ [UnConeD-Silk Strings](http://azeemarshad.in/webvs/examples/SilkString.html)
+ [Marco-Science of Superscope](http://azeemarshad.in/webvs/examples/SuperscopeScience.html)

# Installation

Clone the repository `git clone https://github.com/azeem/webvs.git`
or download the master branch [zip archive](https://github.com/azeem/webvs/archive/master.zip). The `dist` directory contains `webvs.min.js`, the minified webvs code and `libs.min.js`, that contains all the dependencies.

# Development

Webvs uses grunt for build and bower for dependencies. Run the following commands to install all the npm modules and bower dependencies.

	npm install
    bower install

To build the code run `grunt` or `grunt dist`. This generates `webvs.js` and `libs.js` in the `build` directory or the minified files in the `dist` directory respectively.

To run the tests, use `grunt test` command. Testing in debug mode can be started with `grunt karma:debug`. This opens up the karma test page where you can do debugging with the browser code inspector.

# Usage

All classes are available inside the `Webvs` global namespace. The `Webvs.Main` is the main entry point that lets you place visualizations into the page. A short example is given below.

```js
var dancer = new Dancer();
var webvs = new Webvs.Main({
    canvas: document.getElementById("canvas"),
    analyser: new Webvs.DancerAdapter(dancer),
    showStat: true
});
webvs.loadPreset(samplePreset);
webvs.start();
dancer.load({src: "music.ogg"}); // start playing musc
dancer.play();
```

# Preset JSON format

Visualization preset is represented as JSON object. The json is passed as the `options` argument for each Component constructor. See documentation of each Component class for detailed information.

# Component Checklist

The following components are implemented currently. These components tries to match AVS functionality closely. They are however not exact port of AVS effects.

+ EffectList
+ Misc
	+ BufferSave
    + GlobalVar
+ Render
	+ ClearScreen
    + Picture
    + SuperScope
+ Trans
	+ ChannelShift
    + ColorClip
    + ColorMap
    + Convolution
    + DynamicMovement
    + FadeOut
