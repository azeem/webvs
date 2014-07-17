/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM(
    "Texer", 3,
    {
        async: true,
        images: imagesRange("Texer", 3)
    },
    function(canvas, gl, fm, copier, images, resume) {
        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);

        var testValues = [
            {
                imageSrc: "avsres_texer_circle_edgeonly_29x29.bmp",
                resizing: true,
                wrapAround: true,
                code: {
                    init: "n=3",
                    perPoint: "x=i;y=0;sizey=i+1;"
                }
            },
            {
                imageSrc: "avsres_texer_circle_edgeonly_29x29.bmp",
                wrapAround: true,
                code: {
                    init: "n=1",
                    perPoint: "x=-1;y=-1;"
                }
            },
            {
                imageSrc: "avsres_texer_circle_slightblur_21x21.bmp",
                colorFiltering: true,
                code: {
                    init: "n=5",
                    perPoint: "x=i*1.8-.9;y=0;j=abs(x);red=1-j;green=1-abs(.5-j);blue=j;"
                }
            },
        ];

        var texers;
        main.rsrcMan.on("ready", function() {
            _.each(texers, function(texer, index) {
                fm.setRenderTarget();

                // clear
                gl.clearColor(0,0,0,1);
                gl.clear(gl.COLOR_BUFFER_BIT);

                texer.draw();

                fm.restoreRenderTarget();
                copier.run(null, null, fm.getCurrentTexture());

                imageFuzzyOk("Texer " + index, gl, canvas, images["Texer"+index]);
                texer.destroy();
            });
            resume();
        });

        texers = _.map(testValues, function(opts) {
            return new Webvs.Texer(gl, main, parent, opts);
        });
    }
);

