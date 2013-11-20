/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM("FadeOut", 2, function(canvas, gl, fm, copier) {
    var polyProgram = new PolygonProgram();
    polyProgram.init(gl);

    var testValues = [
        {opts: {speed: 1, color: "#FF0000"}, iter: 2},
        {opts: {speed: 0.1, color: "#FF0000"}, iter: 20}
    ];
    var expectedImages = [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACJ0lEQVR4Xu2dUW7CUAwEw824eblZq7aiHwiauMXPs2j4xk+rHQ9ECRKnt21733xhGjgJBMPiK4hAWDwEAuMhEIHQGoDl8TtEILAGYHE0RCCwBmBxNEQgsAZgcTREILAGYHE0RCCwBmBxNEQgsAZgcTREILAGYHE0RCCwBmBxNEQgsAZgcTREILAGYHFew5Dz+bvWywVWbz2OQOqdtU7kA7naca0p3BKBtO57/fBsILd2vIAlAqkvcetELpBHdoRbIpDWfa8fnglkz45gSwRSX+LWiTwgR+0ItUQgrftePzwLSNWOQEsEUl/i1okcIH+1I8wSgbTue/3wDCD/tSPIEoHUl7h1gg/kWXaEWCKQ1n2vH84G8mw7AiwRSH2JWye4QLrsgFsikNZ9rx/OBNJtB9gSgdSXuHWCB2SVHVBLBAL7YR0LyGo7gJYI5BMKyBIOkCk7YJYIRCB3rhqn7QBBYRgikJ8tnQdCgQGxRCC3n6DDV1yzQGh2ACwRyL07U4OWzAGh2jFsiUAe3bsdsmQGCN2OQUsE8tvTjQFL1gNJsWPIEoHsPf9bbMlaIGl2DFgikD1DFj8vWQck1Y7FlgjkiCELLVkDJN2OhZasAXJ0C32f/2NI2wENgRERiEBgDcDiaIhAYA3A4miIQGANwOJoiEBgDcDiaIhAYA3A4miIQGANwOJoiEBgDcDiaIhAYA3A4miIQGANwOJoiEBgDcDiaIhAYA3A4nwA+9MQrDnLBVkAAAAASUVORK5CYII=",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACJ0lEQVR4Xu2dUW7CUAwEw824eblZq7aiHwiauMXPs2j4xk+rHQ9ECRKnt21733xhGjgJBMPiK4hAWDwEAuMhEIHQGoDl8TtEILAGYHE0RCCwBmBxNEQgsAZgcTREILAGYHE0RCCwBmBxNEQgsAZgcTREILAGYHE0RCCwBmBxNEQgsAZgcTREILAGYHFew5Dz+bvWywVWbz2OQOqdtU7kA7naca0p3BKBtO57/fBsILd2vIAlAqkvcetELpBHdoRbIpDWfa8fnglkz45gSwRSX+LWiTwgR+0ItUQgrftePzwLSNWOQEsEUl/i1okcIH+1I8wSgbTue/3wDCD/tSPIEoHUl7h1gg/kWXaEWCKQ1n2vH84G8mw7AiwRSH2JWye4QLrsgFsikNZ9rx/OBNJtB9gSgdSXuHWCB2SVHVBLBAL7YR0LyGo7gJYI5BMKyBIOkCk7YJYIRCB3rhqn7QBBYRgikJ8tnQdCgQGxRCC3n6DDV1yzQGh2ACwRyL07U4OWzAGh2jFsiUAe3bsdsmQGCN2OQUsE8tvTjQFL1gNJsWPIEoHsPf9bbMlaIGl2DFgikD1DFj8vWQck1Y7FlgjkiCELLVkDJN2OhZasAXJ0C32f/2NI2wENgRERiEBgDcDiaIhAYA3A4miIQGANwOJoiEBgDcDiaIhAYA3A4miIQGANwOJoiEBgDcDiaIhAYA3A4miIQGANwOJoiEBgDcDiaIhAYA3A4nwA+9MQrDnLBVkAAAAASUVORK5CYII=",
    ];

    var main = new DummyMain(canvas);
    var parent = new DummyParent(fm);

    _.each(testValues, function(testValue, index) {
        var fadeout = new Webvs.FadeOut(gl, main, parent, testValue.opts);
        fm.setRenderTarget();

        // clear
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // generate gradient
        polyProgram.run(fm, null, "#00FFFF", [0,0.5, -0.5,-0.5, 0.5,-0.5]);
        for(var i = 0;i < testValue.iter;i++) {
            fadeout.draw();
        }
        
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());

        imageFuzzyOk("FadeOut " + index, gl, canvas, expectedImages[index]);
    });

    polyProgram.cleanup();
});
