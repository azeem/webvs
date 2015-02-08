/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM(
    "ClearScreen", 3,
    {
        images: {
            cyan: "/assert/Cyan.png",
            gradient: "/assert/ClearScreen_1.png"
        }
    },
    function(canvas, gl, fm, copier, images) {
        var gprogram = new GradientProgram(gl, 0);

        var testValues = [
            {opts: {color: "#00FFFF"}, beat: false, iter: 1, expectedImage: images.cyan},
            {opts: {beatCount: 5, color: "#00FFFF"}, beat: true, iter: 8, expectedImage: images.gradient},
            {opts: {beatCount: 5, color: "#00FFFF"}, beat: true, iter: 10, expectedImage: images.cyan},
        ];

        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);

        _.each(testValues, function(testValue, index) {

            var clearscreen = new Webvs.ClearScreen(gl, main, parent, testValue.opts);
            fm.setRenderTarget();

            // clear
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // generate gradient
            gprogram.run(fm, null);
            main.analyser.beat = false;
            for(var i = 0;i < testValue.iter;i++) {
                if(testValue.beat) {
                    main.analyser.beat = ((i%2)===0);
                }
                clearscreen.draw();
            }

            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());

            imageFuzzyOk("ClearScreen " + index, gl, canvas, testValues[index].expectedImage);
            clearscreen.destroy();
        });

        gprogram.destroy();
    }
);
