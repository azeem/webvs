/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM(
    "ColorMap", 7,
    {
        images: _.extend(imagesRange("ColorMap", 6), {
            "ColorMap6": "/assert/blank.png"
        })
    },
    function(canvas, gl, fm, copier, images) {
        var gprogram = new GradientProgram(gl, 0);

        var maps = [
            [{index:0, color: "#000000"},{index:255, color: "#FFFFFF"}]
        ];
        var testValues = [
            {maps:maps, key: "RED"},
            {maps:maps, output: "AVERAGE", key: "RED"},
            {maps:maps, key: "GREEN"},
            {maps:maps, key: "(R+G+B)/2"},
            {maps:maps, key: "(R+G+B)/3"},
            {maps:maps, key: "MAX"},
            {maps:maps, key: "BLUE"},
        ];

        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);

        _.each(testValues, function(opts, index) {
            var colormap = new Webvs.ColorMap(gl, main, parent, opts);
            fm.setRenderTarget();

            // clear
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // generate gradient
            gprogram.run(fm, null);
            colormap.draw();

            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());

            imageFuzzyOk("ColorMap " + index, gl, canvas, images["ColorMap"+index]);
            colormap.destroy();
        });

        gprogram.destroy();
    }
);
