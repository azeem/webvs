/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */


function logGLCall(functionName, args) {   
   console.log("gl." + functionName + "(" + 
      WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");   
} 

/**
 * Create a Shader Test
 * this setsup a scaffold canvas for the test to
 * be run on. The canvas and the webgl context are passed
 * to the test function
 */
function CanvasTest() {
    var testFunc = arguments[arguments.length-1];
    var extraOptions = arguments[arguments.length-2];
    var hasExtraOptions = true;
    if(!_.isObject(extraOptions)) {
        extraOptions = {};
        hasExtraOptions = false;
    }
    extraOptions = _.defaults(extraOptions, {
        canvasSize: [100, 100],
        async: false,
        glDebug: false
    });
    var wrapper = function() {
        var canvas = document.getElementById("test_canvas");
        if(!canvas) {
            canvas = document.createElement("canvas");
            canvas.setAttribute("id", "test_canvas");
            document.body.appendChild(canvas);
        }
        canvas.width = extraOptions.canvasSize[0];
        canvas.height = extraOptions.canvasSize[1];
        var gl = canvas.getContext("webgl", {
            alpha: false,
            preserveDrawingBuffer: true
        });
        if(extraOptions.glDebug) {
            gl = WebGLDebugUtils.makeDebugContext(gl, undefined, logGLCall);
        }
        // clear
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        testFunc(canvas, gl);
    }
    var testArgs
    if(hasExtraOptions) {
        testArgs = Array.prototype.slice.call(arguments, 0, arguments.length-2);
    } else {
        testArgs = Array.prototype.slice.call(arguments, 0, arguments.length-1);
    }
    testArgs.push(wrapper);
    if(extraOptions.async) {
        asyncTest.apply(window, testArgs);
    } else {
        test.apply(window, testArgs);
    }
}

function CanvasTestWithFM() {
    var testFunc = arguments[arguments.length-1];
    var wrapper = function(canvas, gl) {
        var copier = new Webvs.CopyProgram({dynamicBlend: true});
        copier.init(gl);
        var fm = new Webvs.FrameBufferManager(canvas.width, canvas.height, gl, copier, false);
        var promise = testFunc(canvas, gl, fm, copier);
        if(promise) {
            promise.onResolve(function() {
                fm.destroy();
            });
        } else {
            fm.destroy();
        }
    };
    var testArgs = Array.prototype.slice.call(arguments, 0, arguments.length-1);
    testArgs.push(wrapper);
    CanvasTest.apply(window, testArgs);
}

function TriangleProgram(options) {
    TriangleProgram.super.constructor.call(this, _.defaults(options||{}, {
        copyOnSwap: true,
        vertexShader: [
            "attribute vec2 a_position;",
            "void main() {",
            "   setPosition(a_position);",
            "}"
        ],
        fragmentShader: [
            "uniform vec3 u_color;",
            "void main() {",
            "   setFragColor(vec4(u_color, 1.0));",
            "}"
        ]
    }));
}
TriangleProgram = Webvs.defineClass(TriangleProgram, Webvs.ShaderProgram, {
    draw: function(color, x, y) {
        this.setUniform.apply(this, ["u_color", "3f"].concat(Webvs.parseColorNorm(color)));
        this.setVertexAttribArray(
            "a_position", 
            new Float32Array([
                -0.8+x, -0.6+y,
                0.46+x, -0.5+y,
                -0.7+x, 0.7+y
            ])
        );
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }
});

function GradientProgram(blue) {
    blue = _.isNumber(blue)?blue:1;
    GradientProgram.super.constructor.call(this, {
        fragmentShader: [
            "void main() {",
            "   setFragColor(vec4(v_position, "+Webvs.glslFloatRepr(blue)+", 1));",
            "}"
        ]
    });
}
GradientProgram = Webvs.defineClass(GradientProgram, Webvs.QuadBoxProgram);

function DummyAnalyser() {
    DummyAnalyser.super.constructor.call(this);
}
DummyAnalyser = Webvs.defineClass(DummyAnalyser, Webvs.AnalyserAdapter, {
    isPlaying: function() {
        return true;
    },

    getWaveform: function() {
        var data = new Float32Array(512);
        _.times(512, function(i) {
            data[i] = Math.sin((i/512)*4*Math.PI)/2;
        });
        return data;
    },

    getSpectrum: function() {
        var data = new Float32Array(512);
        _.times(data.length, function(i) {
            data[i] = Math.sin((i/512)*Math.PI)*2-1;
        });

        return data;
    }
});

function DummyMain(canvas, copier) {
    this.canvas = canvas;
    this.registerBank = {};
    this.bootTime = (new Date()).getTime();
    this.analyser = new DummyAnalyser();
    this.copier = copier;
}
DummyMain = Webvs.defineClass(DummyMain, Object, {
    getResource: function(name) {
        var resource;
        resource = Webvs.Resources[name];
        if(!resource) {
            resource = name;
        }
        return resource;
    }
});

function DummyParent(fm) {
    this.fm = fm;
}

/**
 * Checks if the framebuffer image is equal to target image
 * within threshold
 */
function imageFuzzyOk(message, gl, canvas, targetImageData, maxDistance) {
    maxDistance = _.isNumber(maxDistance)?maxDistance:0.01;
    var width = canvas.width;
    var height = canvas.height;

    // load the target pixels
    var tempCanvas = document.createElement("canvas");
    var ctxt = tempCanvas.getContext("2d", {
        preserveDrawingBuffer: true,
        alpha: false
    });
    var img = new Image();
    img.src = targetImageData;
    ctxt.drawImage(img, 0, 0);
    var targetPixels = ctxt.getImageData(0, 0, width, height).data;

    var sourcePixels = new Uint8Array(width*height*4);
    gl.readPixels( 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, sourcePixels);

    var match = true;
    loop:
    for(var y = 0;y < height;y++) {
        for(var x = 0;x < width;x++) {
            var tgtOff = y*width*4+x*4;
            var srcOff = (height-1-y)*width*4+x*4;
            var rd = targetPixels[tgtOff]-sourcePixels[srcOff];
            var gd = targetPixels[tgtOff+1]-sourcePixels[srcOff+1];
            var bd = targetPixels[tgtOff+2]-sourcePixels[srcOff+2];
            var ad = targetPixels[tgtOff+3]-sourcePixels[srcOff+3];
            rd*=rd;gd*=gd;bd*=bd;
            var distance = (rd+gd+bd)/(4*255);
            if(distance > maxDistance) {
                // print some debug information
                console.log("x=", x, "y=", y);
                console.log("Actual Pixel=", sourcePixels[srcOff], sourcePixels[srcOff+1], sourcePixels[srcOff+2], sourcePixels[srcOff+3]);
                console.log("Rendered Pixel=", targetPixels[tgtOff], targetPixels[tgtOff+1], targetPixels[tgtOff+2], targetPixels[tgtOff+3]);
                console.log("Distance=", distance);
                console.log("Expected Image=" + targetImageData);
                console.log("Actual Image: " + canvas.toDataURL());

                match = false;
                break loop;
            }
        }
    }
    ok(match, message);
}
