/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */


CanvasTestWithFM(
    "Simple scope", 18,
    {
        images: imagesRange("Simple", 18)
    },
    function(canvas, gl, fm, copier, images) {
        var testValues = [
            {source: "SPECTRUM", align: "CENTER", drawMode: "SOLID"},
            {source: "SPECTRUM", align: "CENTER", drawMode: "LINES"},
            {source: "SPECTRUM", align: "CENTER", drawMode: "DOTS"},

            {source: "SPECTRUM", align: "TOP", drawMode: "SOLID"},
            {source: "SPECTRUM", align: "TOP", drawMode: "LINES"},
            {source: "SPECTRUM", align: "TOP", drawMode: "DOTS"},

            {source: "SPECTRUM", align: "BOTTOM", drawMode: "SOLID"},
            {source: "SPECTRUM", align: "BOTTOM", drawMode: "LINES"},
            {source: "SPECTRUM", align: "BOTTOM", drawMode: "DOTS"},


            {source: "WAVEFORM", align: "CENTER", drawMode: "SOLID"},
            {source: "WAVEFORM", align: "CENTER", drawMode: "LINES"},
            {source: "WAVEFORM", align: "CENTER", drawMode: "DOTS"},

            {source: "WAVEFORM", align: "TOP", drawMode: "SOLID"},
            {source: "WAVEFORM", align: "TOP", drawMode: "LINES"},
            {source: "WAVEFORM", align: "TOP", drawMode: "DOTS"},

            {source: "WAVEFORM", align: "BOTTOM", drawMode: "SOLID"},
            {source: "WAVEFORM", align: "BOTTOM", drawMode: "LINES"},
            {source: "WAVEFORM", align: "BOTTOM", drawMode: "DOTS"}
        ];

        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);

        _.each(testValues, function(opts, index) {
            var simple = new Webvs.Simple(gl, main, parent, opts);

            fm.setRenderTarget();
            // clear
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            simple.draw();
            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());

            imageFuzzyOk("Simple " + index, gl, canvas, images["Simple"+index], 100);
            simple.destroy();
        });
    }
);
