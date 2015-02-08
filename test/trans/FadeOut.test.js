/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM(
    "FadeOut", 2,
    {
        images: {
            "fadeTriangle": "/assert/FadeTriangle.png"
        }
    },
    function(canvas, gl, fm, copier, images) {
        var polyProgram = new PolygonProgram(gl);

        var testValues = [
            {opts: {speed: 1, color: "#FF0000"}, iter: 2, expectedImage: images.fadeTriangle},
            {opts: {speed: 0.1, color: "#FF0000"}, iter: 20, expectedImage: images.fadeTriangle}
        ];

        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);

        _.each(testValues, function(testValue, index) {
            var fadeout = new Webvs.FadeOut(gl, main, parent, testValue.opts);
            fm.setRenderTarget();

            // clear
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // generate gradient
            polyProgram.run(fm, null, "#00FFFF", [0,0.5, -0.5,-0.5, 0.5,-0.5]);
            for(var i = 0;i < testValue.iter;i++) {
                fadeout.draw();
            }

            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());

            imageFuzzyOk("FadeOut " + index, gl, canvas, testValue.expectedImage);
        });

        polyProgram.destroy();
    }
);
