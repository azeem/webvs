/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

function LineProgram() {
    LineProgram.super.constructor.call(this, {
        copyOnSwap: true,
        vertexShader: [
            "attribute vec2 a_position;",
            "attribute vec3 a_color;",
            "varying vec3 v_color;",

            "void main() {",
            "   v_color = a_color;",
            "   setPosition(a_position);",
            "}"
        ],
        fragmentShader: [
            "varying vec3 v_color;",
            "void main() {",
            "   setFragColor(vec4(v_color,1));",
            "}"
        ]
    });
}
LineProgram = Webvs.defineClass(LineProgram, Webvs.ShaderProgram, {
    draw: function() {
        this.setVertexAttribArray(
            "a_position", 
            new Float32Array([
                0,  0,
                0, -0.5,

                0,  0,
                0, 0.5,

                0,  0,
                0.5, 0,

                0,  0,
                -0.5, 0,
            ])
        );
        this.setVertexAttribArray(
            "a_color",
            new Float32Array([
                1,  0, 0,
                1,  0, 0,

                0,  1, 0,
                0,  1, 0,

                0,  0, 1,
                0,  0, 1,

                1,  1, 0,
                1,  1, 0,
            ]), 
            3
        );
        this.gl.drawArrays(this.gl.LINES, 0, 8);
    }
});

CanvasTestWithFM("DynamicMovement", 1,
    [322, 285],
    function(canvas, gl, fm, copier) {
        var lineProgram = new LineProgram();
        lineProgram.init(gl);

        var dm = new Webvs.DynamicMovement({
            noGrid: true,
            code: {
                perPixel: "d=sin(d*(1+d*sin(r*150)*.15))*.5+d*.5;r=r+.01;"
            }
        });
        dm.init(gl, new DummyMain(canvas), new DummyParent(fm));


        fm.setRenderTarget();
        _.times(500, function() {
            lineProgram.run(fm, null);
            dm.update();
        });
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());

        console.log(canvas.toDataURL());
    }
);
