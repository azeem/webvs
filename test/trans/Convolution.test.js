/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM(
    "Convolution", 1,
    {
        images: imagesRange("Convolution", 1)
    },
    function(canvas, gl, fm, copier, images) {
        var polyProgram = new PolygonProgram(gl);

        var smileyKernel = [ // @QOAL's smiley test
            1,1,1,0,0,0,1,1,1,
            1,1,1,0,0,0,1,1,1,
            1,1,1,0,0,0,1,1,1,
            1,1,1,0,0,0,1,1,1,
            1,1,1,0,0,0,1,1,1,
            1,1,1,0,0,0,1,1,1,
            1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,
        ];
        var testValues = [
            {opts: {kernel:smileyKernel, scale:1, autoScale: false}, mismatch: 50}
            // TODO: add more tests
        ];

        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);

        _.each(testValues, function(data, index) {
            var convo = new Webvs.Convolution(gl, main, parent, data.opts);
            fm.setRenderTarget();

            // clear
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            polyProgram.run(fm, null, "#00FFFF", [0, 0], gl.POINTS);
            convo.draw();

            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());

            imageFuzzyOk("Convolution " + index, gl, canvas, images["Convolution"+index], data.mismatch);
        });

        polyProgram.destroy();
    }
);
