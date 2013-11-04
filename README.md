# Webvs

A Winamp AVS like visualization tool for the browser. Webvs is a
javascript library that can be used to run visualization presets.

## Examples

+ [Yathosho-Pillow Fight(re-feathered)](http://azeemarshad.in/webvs/examples/PilloFight.html)
+ [UnConeD-Jello Cube](http://azeemarshad.in/webvs/examples/JelloCube.html)
+ [UnConeD-Silk Strings](http://azeemarshad.in/webvs/examples/SilkString.html)
+ [Marco-Science of Superscope](http://azeemarshad.in/webvs/examples/SuperscopeScience.html)

## Installation

Clone the repository `git clone https://github.com/azeem/webvs.git`
or download the master branch [zip archive](https://github.com/azeem/webvs/archive/master.zip). The `dist` directory contains `webvs.min.js`, the minified webvs code and `libs.min.js`, that contains all the dependencies.

## Development

Webvs uses grunt for build and bower for dependencies. Run the following commands to install all the npm modules and bower dependencies.

	npm install
    bower install

To build the code run `grunt` or `grunt dist`. This generates `webvs.js` and `libs.js` in the `build` directory or the minified files in the `dist` directory respectively.

To run the tests, use `grunt test` command. To debug the code/examples, run `grunt debug`. This runs a webserver at 8080 and a live re-build of the source files.
To debug tests, run `grunt debug_test`. This is same as `grunt debug` but also runs karma test server and opens up the test page where you can do debugging with 
the browser code inspector.

## Contributing

Webvs is still in a very infant stage. Lot of work is required to get things into shape. Any help is greatly appreciated. If you have fixes, improvements or features, please 
[fork](https://github.com/azeem/webvs/fork) and submit pull requests. If you have suggestions or criticism please post them at the [Github/Issues](https://github.com/azeem/webvs/issues) or at the [Winamp Forum thread](http://forums.winamp.com/showthread.php?t=364566)

## Documentation

API and internals documentation can be found here: [Code Documentation](http://azeemarshad.in/webvs)

## Usage

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

## Preset JSON format

Visualization preset is represented as JSON object. The json is passed as the `options` argument for each Component constructor. See documentation of each Component class for detailed information.

## Component Checklist

The following components are implemented currently. These components try to match AVS functionality closely. They are however not exact port of AVS effects.

+ EffectList
+ Misc
	+ BufferSave
    + GlobalVar
+ Render
	+ ClearScreen
    + Picture
    + SuperScope
    + Simple
    + Texer
+ Trans
	+ ChannelShift
    + ColorClip
    + ColorMap
    + Convolution
    + DynamicMovement
    + FadeOut
    + Movement
    + UniqueTone

## See Also

+ [Webvs discussion](http://forums.winamp.com/showthread.php?t=364566) at Winamp AVS Forum
+ [AVS-File-Decoder](http://decoder.visbot.net/): AVS to Webvs JSON convertor. Source: [AVS-File-Decoder](https://github.com/grandchild/AVS-File-Decoder), [AVS-File-Decoder-Qt](https://github.com/grandchild/AVS-File-Decoder-Qt)
+ Webvs Editors: Source: [qios-webvseditor](https://github.com/QOAL/qios-webvseditor), [webvsed](https://github.com/azeem/webvsed)
+ [Visbot Network](http://visbot.net/): AVS Visualization Packs
