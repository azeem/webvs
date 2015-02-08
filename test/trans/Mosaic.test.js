/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM(
    "Mosaic", 4,
    {
        images: imagesRange("Mosaic", 4)
    },
    function(canvas, gl, fm, copier, images) {
        var gprogram = new GradientProgram(gl);

        var testOptions = [
            {squareSize: 1},
            {squareSize: 0.2},
            {squareSize: 0.011},
            {squareSize: 0.01, onBeatSizeChange: true, onBeatSquareSize: 0.07, onBeatSizeDuration: 10},
        ];

        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);

        _.each(testOptions, function(opts, index) {
            var mosaic = new Webvs.Mosaic(gl, main, parent, opts);
            fm.setRenderTarget();

            // clear
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            if(opts.onBeatSizeChange) {
                for(var i = 0;i < 5;i++) {
                    main.analyser.beat = (i === 0);
                    gprogram.run(fm, null);
                    mosaic.draw();
                }
            } else {
                gprogram.run(fm, null);
                mosaic.draw();
            }

            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());

            imageFuzzyOk("Mosaic " + index, gl, canvas, images["Mosaic"+index]);
            mosaic.destroy();
        });

        gprogram.destroy();
    }
);
