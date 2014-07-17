/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */


CanvasTestWithFM(
    "UniqueTone", 6,
    {
        images: imagesRange("UniqueTone", 6)
    },
    function(canvas, gl, fm, copier, images) {
        var polyProgram = new PolygonProgram(gl);

        var testValues = [
            {color: "#800000", invert: false, blendMode: "REPLACE"},
            {color: "#800000", invert: false, blendMode: "ADDITIVE"},
            {color: "#800000", invert: false, blendMode: "AVERAGE"},
            {color: "#800000", invert: true,  blendMode: "REPLACE"},
            {color: "#800000", invert: true,  blendMode: "ADDITIVE"},
            {color: "#800000", invert: true,  blendMode: "AVERAGE"}
        ];

        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);


        _.each(testValues, function(opts, index) {
            var uniquetone = new Webvs.UniqueTone(gl, main, parent, opts);

            fm.setRenderTarget();
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            polyProgram.run(fm, null, "#008000", [-0.8,-0.6, 0.46,-0.5, -0.7,0.7]);
            uniquetone.draw();
            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());

            imageFuzzyOk("UniqueTone "+index, gl, canvas, images["UniqueTone"+index]);

            uniquetone.destroy();
        });

        polyProgram.destroy();
    }
);
