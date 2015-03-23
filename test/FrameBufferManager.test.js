var DepthGradientProgram = function(gl, blue, swap) {
    DepthGradientProgram.super.constructor.call(this, gl, {
        vertexShader:  [
            "attribute vec2 a_position;",
            "void main() {",
            "   float depth;",
            "   if(a_position.x > 0.0) {",
            "       depth = "+(swap?"-0.5":"0.0")+";",
            "   } else {",
            "       depth = "+(swap?"0.0":"-0.5")+";",
            "   }",
            "   setPosition4(vec4(a_position, depth, 1.0));",
            "}"
        ],
        fragmentShader: [
            "void main() {",
            "   setFragColor(vec4(v_position, "+Webvs.glslFloatRepr(blue)+", 1));",
            "}"
        ]
    });
};
DepthGradientProgram = Webvs.defineClass(DepthGradientProgram, Webvs.QuadBoxProgram);

CanvasTestWithFM(
    "FrameBufferManager Test", 7,
    {
        images: imagesRange("FrameBufferManager", 3)
    },
    function(canvas, gl, fm, copier, images) {
        fm.addTexture("Test1");
        QUnit.equal(fm.textures.length, 3);

        fm.addTexture("Test2");
        fm.addTexture("Test2");
        QUnit.equal(fm.textures.length, 4);

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
        QUnit.equal(fm.textures.length, 4);
        fm.removeTexture("Test2");
        QUnit.equal(fm.textures.length, 3);

        var gprogram3 = new DepthGradientProgram(gl, 1, true);
        var gprogram4 = new DepthGradientProgram(gl, 0.5, false);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        fm.setRenderTarget();
        gprogram3.run(fm, null);
        gprogram4.run(fm, null);
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());
        imageFuzzyOk("Framebuffer test 5", gl, canvas, images.FrameBufferManager2);
        gprogram3.destroy();
        gprogram4.destroy();
        gl.disable(gl.DEPTH_TEST);
    }
);
