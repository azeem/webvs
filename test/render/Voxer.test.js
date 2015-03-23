/**
 * Copyright (c) 2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM(
    "Voxer", 1,
    {
        async: true,
        images: {
            "blank": "assert/blank.png"
        }
    },
    function(canvas, gl, fm, copier, images, resume) {
        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);

        var testValues = {
            modelSrc: "teddy.obj",
            code: {
                init: "n=2"
            }
        };

        var voxer;
        main.rsrcMan.on("ready", function () {
            fm.setRenderTarget();

            // clear
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            voxer.draw();

            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());

            imageFuzzyOk("Voxer", gl, canvas, images.blank);
            voxer.destroy();
            resume();
        });
        voxer = new Webvs.Voxer(gl, main, parent, testValues);
    }
);
