/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM(
    "Superscope test", 1,
    {
        images: imagesRange("SuperScope", 7)
    },
    function(canvas, gl, fm, copier, images) {
        var code = {
            init: "n=4",
            perFrame: "c=0",
            perPoint: [
                "x=select(c, -0.75, -0.15, 0.5, 0);",
                "y=select(c, -0.5,  0.5, -0.23, -1);",
                "red  =select(c, 1, 0, 0, 1);",
                "green=select(c, 0, 1, 0, 1);",
                "blue =select(c, 0, 0, 1, 1);",
                "c=c+1;"
            ]
        };
        var code2 = {
            init: "n=3",
            perFrame: "c=0",
            perPoint: [
                "x=select(c, -0.75, -0.15, 0.8);",
                "y=select(c, -0.5,  0.5, 0);",
                "red  =select(c, 1, 0, 0);",
                "green=select(c, 0, 1, 0);",
                "blue =select(c, 0, 0, 1);",
                "c=c+1;"
            ]
        };

        var testData = [
            // {opts: {code: code, thickness: 1, drawMode: "DOTS"}, mismatch: 1},
            {opts: {code: code, thickness: 3, drawMode: "DOTS"}, mismatch: 25},
            // {opts: {code: code, thickness: 300, drawMode: "DOTS"}},
            // {opts: {code: code, thickness: 1, drawMode: "LINES"}, mismatch: 4},
            // {opts: {code: code, thickness: 3, drawMode: "LINES"}},
            // {opts: {code: code, thickness: 25, drawMode: "LINES"}},
            // {opts: {code: code2, thickness: 25, drawMode: "LINES"}}
        ];

        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);
        _.each(testData, function(data, i) {
            var scope = new Webvs.SuperScope(gl, main, parent, data.opts);
            fm.setRenderTarget();
            // clear
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            scope.draw();
            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());
            imageFuzzyOk("superscope test " + i, gl, canvas, images.SuperScope1, data.mismatch);
            scope.destroy();
        });
    }
);
