/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM(
    "Effectlist Code", 2,
    {
        images: {
            "blank": "/assert/blank.png",
            "red": "/assert/Red.png"
        }
    },
    function(canvas, gl, fm, copier, images) {
        var main = new DummyMain(canvas, copier);
        var parent = new DummyParent(fm);

        var el = new Webvs.EffectList(gl, main, parent, {
            code: {
                init: "counter = 1;",
                perFrame: "counter=counter+1;enabled=counter%2;"
            },
            components: [
                {
                    type: "ClearScreen",
                    color: "#ff0000"
                }
            ]
        });

        fm.setRenderTarget();
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        el.draw();
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());
        imageFuzzyOk("Effectlist code test: no rendering the first time", gl, canvas, images.blank);

        fm.setRenderTarget();
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        el.draw();
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());
        imageFuzzyOk("Effectlist code test: red cleared screen the second time", gl, canvas, images.red);

        el.destroy();
    }
);

CanvasTestWithFM(
    "EffectList EnableOnBeat", 2,
    {
        images: {
            "blank": "/assert/blank.png",
            "threeQuarterRed": "/assert/ThreeQuarterRed.png",
        }
    },
    function(canvas, gl, fm, copier, images) {
        var main = new DummyMain(canvas, copier);
        var parent = new DummyParent(fm);

        var el = new Webvs.EffectList(gl, main, parent, {
            enableOnBeat: true,
            enableOnBeatFor: 2,
            output: "AVERAGE",
            components: [
                {
                    type: "ClearScreen",
                    color: "#ff0000"
                }
            ]
        });

        fm.setRenderTarget();
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        el.draw();
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());
        imageFuzzyOk("Effectlist enableOnBeatFor: should'nt render when there is no beat", gl, canvas, images.blank);

        fm.setRenderTarget();
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        for(var i = 0;i < 10;i++) {
            if(i == 5) {
                main.analyser.beat = true;
            } else {
                main.analyser.beat = false;
            }
            el.draw();
        }
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());
        imageFuzzyOk("Effectlist enableOnBeatFor: should render for 2 frames", gl, canvas, images.threeQuarterRed);
    }
);
