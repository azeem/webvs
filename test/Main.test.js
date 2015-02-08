/**
 * Copyright (c) 2014 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTest(
    "Main test", 1,
    {
        async: true,
        images: imagesRange("Main", 1)
    },
    function(canvas, gl, images) {
        var main = new Webvs.Main({
            canvas: canvas,
            analyser: new DummyAnalyser()
        });
        main.loadPreset({
            components: [
                {
                    type: "ClearScreen",
                    color: "#ffff00"
                },
                {
                    type: "SuperScope",
                    thickness: 12,
                    code: {
                        perPoint: "x=i*2-1;y=v*0.5"
                    }
                }
            ]
        });
        main.start();
        window.setTimeout(function() {
            canvas.width = 200;
            canvas.height = 200;
            main.notifyResize();
            window.setTimeout(function() {
                imageFuzzyOk("main test", gl, canvas, images.Main0);
                main.stop();
                canvas.width = 100;
                canvas.height = 100;
                gl.viewport(0, 0, 100, 100);
                QUnit.start();
            }, 1000);
        }, 1000);
    }
);
