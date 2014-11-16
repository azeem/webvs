/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */


CanvasTestWithFM(
    "BufferSave", 3,
    { images: imagesRange("BufferSave", 1) },
    function(canvas, gl, fm, copier, images) {
        var polyProgram = new PolygonProgram(gl);

        var buffers = new Webvs.FrameBufferManager(canvas.width,
                                                   canvas.height,
                                                   gl, copier, false, 0);
        var main = new DummyMain(canvas, copier, null, buffers);
        var parent = new DummyParent(fm);

        var bufferSave = new Webvs.BufferSave(gl, main, parent, {
            action: "SAVE"
        });

        // do a save and a restore
        fm.setRenderTarget();
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        polyProgram.run(fm, null, "#00FFFF", [-0.8,-0.6, 0.46,-0.5, -0.7,0.7]);
        bufferSave.draw();
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        bufferSave.set("action", "RESTORE");
        bufferSave.draw();
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());
        imageFuzzyOk("BufferSave Test 1", gl, canvas, images.BufferSave0);

        // switch to a second buffer.
        // This should not affect subsequent buffersaves
        buffers.addTexture("buffer2");
        buffers.setRenderTarget();
        buffers.switchTexture("buffer2");
        buffers.restoreRenderTarget();

        // restore previous buffer
        fm.setRenderTarget();
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        bufferSave.draw();
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());
        imageFuzzyOk("BufferSave Test 2", gl, canvas, images.BufferSave0);

        buffers.removeTexture("buffer2");
        bufferSave.destroy();

        // test that buffersave component destroy
        // has triggered destroy for the texture
        equal(buffers.textures.length, 0);
        buffers.destroy();

        polyProgram.destroy();
    }
);
