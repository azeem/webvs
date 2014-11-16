CanvasTestWithFM(
    "FrameBufferManager Test", 6,
    {
        images: imagesRange("FrameBufferManager", 2)
    },
    function(canvas, gl, fm, copier, images) {
        fm.addTexture("Test1");
        equal(fm.textures.length, 3);

        fm.addTexture("Test2");
        fm.addTexture("Test2");
        equal(fm.textures.length, 4);

        var gprogram = new GradientProgram(gl);
        fm.setRenderTarget();
        fm.switchTexture("Test1");
        gprogram.run(fm, null);
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());
        imageFuzzyOk("Framebuffer test 3", gl, canvas, images.FrameBufferManager0);
        gprogram.destroy();

        var gprogram2 = new GradientProgram(gl, 0.5);
        fm.setRenderTarget();
        fm.switchTexture("Test2");
        gprogram2.run(fm, null);
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());
        imageFuzzyOk("Framebuffer test 4", gl, canvas, images.FrameBufferManager1);
        gprogram2.destroy();

        fm.removeTexture("Test2");
        equal(fm.textures.length, 4);
        fm.removeTexture("Test2");
        equal(fm.textures.length, 3);
    }
);
