/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM(
    "ColorClip", 4,
    {
        images: imagesRange("ColorClip", 4)
    },
    function(canvas, gl, fm, copier, images) {
        var gprogram = new GradientProgram(gl);

        var testOptions = [
            {mode: "BELOW", color: "#7F7FFF", outColor: "#000000"},
            {mode: "ABOVE", color: "#7F7FFF", outColor: "#000000"},
            {mode: "NEAR", color: "#7F7FFF", outColor: "#000000", level: 0.5},
            {mode: "NEAR", color: "#7F7FFF", outColor: "#000000", level: 1}
        ];

        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);

        _.each(testOptions, function(opts, index) {
            var colorclip = new Webvs.ColorClip(gl, main, parent, opts);
            fm.setRenderTarget();

            // clear
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // generate gradient
            gprogram.run(fm, null);
            // clip
            colorclip.draw();

            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());

            imageFuzzyOk("ColorClip " + index, gl, canvas, images["ColorClip"+index], 5);
            colorclip.destroy();
        });

        gprogram.destroy();
    }
);
