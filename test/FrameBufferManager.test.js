CanvasTestWithFM(
    "FrameBufferManager NamedRefs test", 2,
    function(canvas, gl, fm, copier) {
        console.log(fm.frameAttachments.length);
        fm.createAttachment("Test1");
        equal(fm.frameAttachments.length, 3);

        fm.createAttachment("Test2");
        fm.createAttachment("Test2");
        equal(fm.frameAttachments.length, 4);

        fm.setRenderTarget("Test2");
        equal(fm.currAttachment, )
    }
);
