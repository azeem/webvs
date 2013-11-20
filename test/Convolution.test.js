/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM("Convolution", 1, function(canvas, gl, fm, copier) {
    var polyProgram = new PolygonProgram();
    polyProgram.init(gl);

    var smileyKernel = [ // @QOAL's smiley test
        0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,
        1,0,0,0,0,0,1,
        0,1,0,0,0,1,0,
        0,0,1,1,1,0,0,
        0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,
    ]
    var testValues = [
        {kernel:smileyKernel, scale:1}
        // TODO: add more tests
    ];
    var expectedImages = [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAB6ElEQVR4Xu2cuwoCURTEdv//o32AhQhCqiEXsmAhDJwx2Wm9r+t6vD49EgJ3QiQmPjUS4vJxJSQhMgKyOi0kITICsjotJCEyArI6LSQhMgKyOi0kITICsjotJCEyArI6LSQhMgKyOi0kITICsjotJCEyArI6LSQhMgKyOi0kITICsjotJCEyArI6LSQhMgKyOi0kITICsjotJCEyArI6LSQhMgKyOi0kITICsjotJCEyArI6LSQhMgKyOi0kITICsjotJCEyArI6LSQhMgKyOi0kITICsjrnL+Tx9f9r9/vnnP2cLeQt41vC7/cD3Zwr5B/8w6WcK+TAt59UTgihNMwkZAibnEoIoTTMJGQIm5xKCKE0zCRkCJucSgihNMwkZAibnEoIoTTMJGQIm5xKCKE0zCRkCJucSgihNMwkZAibnEoIoTTMJGQIm5xKCKE0zCRkCJucSgihNMwkZAibnEoIoTTMJGQIm5xKCKE0zCRkCJucSgihNMwkZAibnEoIoTTMJGQIm5xKCKE0zCRkCJucSgihNMwkZAibnEoIoTTMJGQIm5xKCKE0zCRkCJucSgihNMwkZAibnEoIoTTMJGQIm5xKCKE0zCRkCJucSgihNMwkZAibnEoIoTTMJGQIm5xKCKE0zDwBvcFuAVc9ynoAAAAASUVORK5CYII="
    ];

    var main = new DummyMain(canvas);
    var parent = new DummyParent(fm);

    _.each(testValues, function(opts, index) {
        var convo = new Webvs.Convolution(gl, main, parent, opts);
        fm.setRenderTarget();

        // clear
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        polyProgram.run(fm, null, "#00FFFF", [0, 0], gl.POINTS);
        convo.draw();
        
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());

        imageFuzzyOk("Convolution " + index, gl, canvas, expectedImages[index]);
    });

    polyProgram.cleanup();
});
