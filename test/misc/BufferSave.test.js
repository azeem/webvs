/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */


CanvasTestWithFM(
    "BufferSave", 1,
    { images:{bufferSave0: "/assert/BufferSave_0.png"} },
    function(canvas, gl, fm, copier, images) {
        var polyProgram = new PolygonProgram(gl);

        var main = new DummyMain(canvas, copier);
        var parent = new DummyParent(fm);

        var bufferSave = new Webvs.BufferSave(gl, main, parent, {
            action: "SAVE"
        });

        fm.setRenderTarget();

        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        polyProgram.run(fm, null, "#00FFFF", [-0.8,-0.6, 0.46,-0.5, -0.7,0.7]);

        // save, clear and restore
        bufferSave.draw();
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        bufferSave.set("action", "RESTORE");
        bufferSave.draw();

        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());

        imageFuzzyOk("BufferSave", gl, canvas, images.bufferSave0);

        bufferSave.destroy();

        polyProgram.destroy();
    }
);
