# Webvs

A Winamp AVS like visualization tool for the browser. Webvs is a
javascript library that can be used to run visualization presets.

## Website

For documentation and detailed information, visit http://azeemarshad.in/webvs/

## Development

Webvs uses grunt for build and bower for dependencies. Run the following commands to install all the npm modules and bower dependencies.

	npm install
    bower install

To build the code, run `grunt` or `grunt dist`. This generates `webvs.js` and or `webvs.min.js`  in the `build` directory or the minified files in the `dist` directory.

To run the tests, use `grunt test` command. To debug the code/examples, run `grunt debug`. This runs a webserver at 8000 and a live re-build of the source files.
To debug tests, run `grunt debug_test`. This is same as `grunt debug` but also runs karma test server and opens up the test page where you can do debugging with 
the browser code inspector.

## Contributing

[Fork](https://github.com/azeem/webvs/fork) and submit pull requests. For suggestions/bug fixes use [Github/Issues](https://github.com/azeem/webvs/issues).