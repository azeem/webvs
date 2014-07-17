/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM(
    "Invert", 1,
    {
        images: {
            "Invert0": "/assert/Invert_0.png"
        }
    },
    function(canvas, gl, fm, copier, images) {
        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);
        var gprogram = new GradientProgram(gl);

        var invert = new Webvs.Invert(gl, main, parent, {});
        fm.setRenderTarget();

        // clear
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // generate gradient
        gprogram.run(fm, null);
        invert.draw();

        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());

        imageFuzzyOk("invert", gl, canvas, images.Invert0);
        invert.destroy();

        gprogram.destroy();
    }
);
