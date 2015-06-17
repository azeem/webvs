/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

var LineProgram = function(gl) {
    LineProgram.super.constructor.call(this, gl, {
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
};
LineProgram = Webvs.defineClass(LineProgram, Webvs.ShaderProgram, {
    init: function() {
        this.pointBuffer = new Webvs.Buffer(this.gl, false, 
            [
                0,  0,
                0, -0.5,
                0,  0,
                0, 0.5,
                0,  0,
                0.5, 0,
                0,  0,
                -0.5, 0,
            ]
        );
        this.colorBuffer = new Webvs.Buffer(this.gl, false,
            [
                1,  0, 0,
                1,  0, 0,
                0,  1, 0,
                0,  1, 0,
                0,  0, 1,
                1,  1, 0,
                0,  0, 1,
                1,  1, 0
            ] 
        );
    },

    draw: function() {
        this.setAttrib("a_position", this.pointBuffer);
        this.setAttrib("a_color", this.colorBuffer);
        this.gl.drawArrays(this.gl.LINES, 0, 8);
    },

    destroy: function() {
        this.pointBuffer.destroy();
        this.colorBuffer.destroy();
        LineProgram.super.destroy.call(this);
    }
});

CanvasTestWithFM(
    "DynamicMovement", 5,
    {
        images: imagesRange("DynamicMovement", 5)
    },
    function(canvas, gl, fm, copier, images) {
        var lineProgram = new LineProgram(gl);

        var code = {
            perPixel: "alpha=0.5;d=sin(d*(1+d*sin(r*150)*.15))*.5+d*.5;r=r+.01;"
        };
        var testValues = [
            {noGrid: true, compat: true, blend: false, code: code},
            {noGrid: false, compat: true, blend: false, code: code},
            {noGrid: false, compat: false, blend: false, code: code},
            {noGrid: false, compat: false, blend: true, code: code},
            {noGrid: true, compat: false, blend: true, code: code},
        ];

        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);

        _.each(testValues, function(opts, index) {
            var dm = new Webvs.DynamicMovement(gl, main, parent, opts);

            fm.setRenderTarget();
            // clear
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            // do dynamic movement for 500 frames
            _.times(500, function() {
                lineProgram.run(fm, null);
                dm.draw();
            });
            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());
            dm.destroy();

            imageFuzzyOk("Dynamic Movement "+index, gl, canvas, images["DynamicMovement"+index], null, 15);
        });

        lineProgram.destroy();
    }
);

/*
TODO: fix this bug

CanvasTestWithFM("DynamicMovement Blend Artifact", 1, function(canvas, gl, fm, copier) {
    var main = new DummyMain(canvas);
    var parent = new DummyParent(fm);

    var dm = new Webvs.DynamicMovement(gl, main, parent, {
        coord: "POLAR",
        noGrid: true,
        compat: true,
        bFilter: true,
        code: {
            "perPixel": "r=r;d=d;"
        }
    });
    var cc = new Webvs.ColorClip(gl, main, parent, {
        mode: "ABOVE",
        color: "rgb(254,254,254)",
        outColor: "#FF0000",
    });

    fm.setRenderTarget();
    // clear
    gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    dm.draw();
    cc.draw();

    fm.restoreRenderTarget();
    copier.run(null, null, fm.getCurrentTexture());
    dm.destroy();
    cc.destroy();

    imageFuzzyOk("Dynamicmovement blend artifact", gl, canvas, "");
});

*/
