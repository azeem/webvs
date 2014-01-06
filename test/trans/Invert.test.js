/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM("Invert", 1, function(canvas, gl, fm, copier) {
    var main = new DummyMain(canvas);
    var parent = new DummyParent(fm);
    var gprogram = new GradientProgram(gl);

    var invert = new Webvs.Invert(gl, main, parent, {});
    fm.setRenderTarget();

    // clear
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // generate gradient
    gprogram.run(fm, null);
    invert.draw();

    fm.restoreRenderTarget();
    copier.run(null, null, fm.getCurrentTexture());

    imageFuzzyOk("invert", gl, canvas, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACAklEQVR4Xu3STURFYRCA4XNIJCKXRCIRiSsSiUQkEolEJBKJRCISiUQiEolEIhHXJZFIRCKRSCQikUgkIpH09bOIFi3S6l28izGMmVnMM3GIo/e3KIrCZ/zMv9X+0/M9476/3TgOGYJ8PQvlYeKQKQgLJEsQFki2ICyQHEFYILmCsEASgrBA8gRhgeQLwgIpEIQFUigIC6RIEBZIsSAskBJBWCClgrBAygRhgSQFYYGUC8ICqRCEBVIpCAukShAWSLUgLJAaQVggtYKwQOoEYYHUC8ICaRCEBdIoCAukSRAWSLMgLJAWQVggrYKwQNoEYYG0C8IC6RCEBdIpCAukSxAWSLcgLJAeQVggvYKwQPoEYYH0C8ICGRCEBTIoCAtkSBAWyLAgLJARQVggo4KwQMYEYYGMC8ICmRCEBTIpCAtkShAWyLQgLJAZQVggs4KwQOYEYYHMC8ICWRCEBbIoCAtkSRAWyLIgLJAVQVggq4KwQNYEYYGkBGGBpAVhgawLwgLZEIQFsikIC2RLEBbItiAskB1BWCC7grBA9gRhgewLwgI5EIQFcigIC+RIEBbIsSAskBNBWCCngrBAzgRhgZwLwgK5EIQFcikIC+RKEBbItSAskBtBWCC3grBA7gRhgdwLwgJ5EIQF8igIC+RJEBbIsyAskBdBWCCvgrBAgiAkkA8pOER8c983agAAAABJRU5ErkJggg==");
    invert.destroy();

    gprogram.destroy();
});
