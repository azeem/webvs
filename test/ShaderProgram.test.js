/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

function ShaderTest() {
    var testFunc = arguments[arguments.length-1];
    var wrapper = function() {
        var canvas = document.createElement("canvas");
        document.appendChild(canvas);
        canvas.width = 640;
        canvas.height = 480;
        var gl = canvas.getContext("experimental-webgl", {
            alpha: false,
            preserveDrawingBuffer: true
        });
        testFunc(canvas, gl);
    }
    var testArgs = Array.prototype.slice(arguments, 0, arguments.length-1);
    testArgs.push(wrapper);
    test.apply(window, testArgs);
}
