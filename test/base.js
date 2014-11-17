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
        var images = {};
        if(extraOptions.images) {
            if(extraOptions.async) {
                QUnit.stop();
            }
            var imageTotal = _.size(extraOptions.images);
            var imageCount = 0;
            _.each(extraOptions.images, function(src, key) {
                var image = new Image();
                image.onload = function() {
                    images[key] = image;
                    imageCount++;
                    if(imageCount == imageTotal) {
                        // resume running the test
                        QUnit.start();
                        testFunc(canvas, gl, images);
                    }
                };
                image.onerror = function() {
                    console.log("Test Image " + src + " could not be loaded");
                    image.onload();
                };
                image.src = src;
            });
        }
        
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

        // dont run test right away if we have test images to be loaded
        if(!extraOptions.images) { 
            testFunc(canvas, gl, images);
        }
    };
    var testArgs;
    if(hasExtraOptions) {
        testArgs = Array.prototype.slice.call(arguments, 0, arguments.length-2);
    } else {
        testArgs = Array.prototype.slice.call(arguments, 0, arguments.length-1);
    }
    testArgs.push(wrapper);
    if(extraOptions.async || extraOptions.images) {
        asyncTest.apply(window, testArgs);
    } else {
        test.apply(window, testArgs);
    }
}

function CanvasTestWithFM() {
    var testFunc = arguments[arguments.length-1];

    var async = false;
    if(_.isObject(arguments[arguments.length-2])) {
        async = arguments[arguments.length-2].async?true:false;
    }

    var wrapper = function(canvas, gl, images) {
        var copier = new Webvs.CopyProgram(gl, {dynamicBlend: true});
        var fm = new Webvs.FrameBufferManager(gl, copier, false);
        if(async) {
            var resume = function() {
                fm.destroy();
                QUnit.start();
            };
            testFunc(canvas, gl, fm, copier, images, resume);
        } else {
            testFunc(canvas, gl, fm, copier, images);
            fm.destroy();
        }
    };
    var testArgs = Array.prototype.slice.call(arguments, 0, arguments.length-1);
    testArgs.push(wrapper);
    CanvasTest.apply(window, testArgs);
}

function imagesRange(prefix, count) {
    return _.object(_.map(_.range(count), function(i) {
        return [prefix+i, "/assert/"+prefix+"_" + i + ".png"];
    }));
}

var PolygonProgram = function(gl, options) {
    PolygonProgram.super.constructor.call(this, gl, _.defaults(options||{}, {
        copyOnSwap: true,
        vertexShader: [
            "attribute vec2 a_position;",
            "void main() {",
            "   gl_PointSize = 1.0;",
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
};
PolygonProgram = Webvs.defineClass(PolygonProgram, Webvs.ShaderProgram, {
    draw: function(color, points, mode) {
        mode = _.isUndefined(mode)?this.gl.TRIANGLES:mode;
        points = new Float32Array(points);

        this.setUniform.apply(this, ["u_color", "3f"].concat(Webvs.parseColorNorm(color)));
        this.setVertexAttribArray("a_position", points);
        this.gl.drawArrays(mode, 0, points.length/2);
    }
});

var GradientProgram = function(gl, blue) {
    blue = _.isNumber(blue)?blue:1;
    GradientProgram.super.constructor.call(this, gl, {
        fragmentShader: [
            "void main() {",
            "   setFragColor(vec4(v_position, "+Webvs.glslFloatRepr(blue)+", 1));",
            "}"
        ]
    });
};
GradientProgram = Webvs.defineClass(GradientProgram, Webvs.QuadBoxProgram);

var DummyAnalyser = function() {
    DummyAnalyser.super.constructor.call(this);
};
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

var DummyMain = function(canvas, copier, resourcePrefix, buffers) {
    this.canvas = canvas;
    this.registerBank = {};
    this.bootTime = (new Date()).getTime();
    this.analyser = new DummyAnalyser();
    this.copier = copier;
    this.buffers = buffers;

    var builtinPack = Webvs.ResourcePack;
    if(resourcePrefix) {
        builtinPack = _.clone(builtinPack);
        builtinPack.prefix = resourcePrefix;
    }
    this.rsrcMan = new Webvs.ResourceManager(builtinPack);
};
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

var imageFuzzyOkErrorTemplate = _.template([
    "<table style='border:1px solid black;margin:5px;font-family:sans-serif;text-align:center;'>",
    "  <tr>",
    "      <td colspan='3'>ImageMismatch #<%= id %></td>",
    "  </tr>",
    "  <tr>",
    "      <td>Target</td>",
    "      <td>Output</td>",
    "      <td>Diff</td>",
    "  </tr>",
    "  <tr>",
    "      <td><img src='<%= targetSrc %>'/></td>",
    "      <td><img src='<%= outputSrc %>'/></td>",
    "      <td><img src='<%= diffSrc %>'/></td>",
    "  </tr>",
    "</table>"
].join(""));

/**
 * Checks if the framebuffer image is equal to target image
 * within threshold
 */
function imageFuzzyOk(message, gl, canvas, targetImage, mismatchThreshold, distanceThreshold) {
    mismatchThreshold = _.isNumber(mismatchThreshold)?mismatchThreshold:1;
    distanceThreshold = _.isNumber(distanceThreshold)?(Math.pow(distanceThreshold*255, 2)*3):10; // scale to 255*sqrt(3) and square
    var width = canvas.width;
    var height = canvas.height;

    // create a temporary canvas for
    // getting image data and drawing diff image
    var tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    var ctxt = tempCanvas.getContext("2d", {
        preserveDrawingBuffer: true,
        alpha: false
    });

    // get source pixels
    var sourcePixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, sourcePixels);

    // get target pixels
    ctxt.drawImage(targetImage, 0, 0);
    var targetDataUrl = tempCanvas.toDataURL();
    var targetPixels = ctxt.getImageData(0, 0, width, height).data;

    // dim down target image in temporary canvas 
    ctxt.fillStyle = "rgba(255,255,255,0.85)";
    ctxt.fillRect(0, 0, width, height);

    // red pixel for marking pixel mismatches
    var redPixel = ctxt.createImageData(1,1);
    redPixel.data[0] = 255;
    redPixel.data[1] = 0;
    redPixel.data[2] = 0;
    redPixel.data[3] = 255;

    var mismatch = 0;
    for(var y = 0;y < height;y++) {
        for(var x = 0;x < width;x++) {
            var off = y*width*4+x*4;
            var srcOff = (height-1-y)*width*4+x*4;
            var rd = targetPixels[off]  -sourcePixels[srcOff];
            var gd = targetPixels[off+1]-sourcePixels[srcOff+1];
            var bd = targetPixels[off+2]-sourcePixels[srcOff+2];
            var distance=rd*rd+gd*gd+bd*bd;
            if(distance >= distanceThreshold) {
                ctxt.putImageData(redPixel, x, y); // mark pixel mismatch
                mismatch++;
            }
        }
    }

    if(mismatch < mismatchThreshold) {
        ok(true, message);
    } else {
        // show the diff image 
        var errorId = _.uniqueId();
        var errorElement = document.createElement("span");
        errorElement.innerHTML = imageFuzzyOkErrorTemplate({
            id: errorId,
            targetSrc: targetDataUrl,
            outputSrc: canvas.toDataURL(),
            diffSrc: tempCanvas.toDataURL()
        });
        document.body.appendChild(errorElement);
        ok(false, message + " ImageMismatch #" + errorId);
    }
}
