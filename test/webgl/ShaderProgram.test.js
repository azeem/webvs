/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */



CanvasTest(
    "ShaderProgram BasicTest", 1,
    {images: {ShaderProgram0: "/assert/ShaderProgram_0.png"}},
    function(canvas, gl, images) {
        var program = new PolygonProgram(gl);
        program.run(null, null, "#0000FF", [-0.8,-0.6, 0.46,-0.5, -0.7,0.7]);
        imageFuzzyOk("ShaderProgram Basic", gl, canvas, images.ShaderProgram0, 190);
        program.destroy();
    }
);

var AlphaGradientProgram = function(gl) {
    AlphaGradientProgram.super.constructor.call(this, gl, {
        varyingPos: true,
        blendMode: Webvs.ALPHA,
        fragmentShader: [
            "uniform vec3 u_color;",
            "void main() {",
            "   setFragColor(vec4(u_color, distance(v_position, vec2(0.5,0.5))*2.0/sqrt(2.0)));",
            "}",
        ]
    });
};
AlphaGradientProgram = Webvs.defineClass(AlphaGradientProgram, Webvs.QuadBoxProgram, {
    draw: function(color) {
        this.setUniform.apply(this, ["u_color", "3f"].concat(Webvs.parseColorNorm(color)));
        AlphaGradientProgram.super.draw.call(this);
    }
});

CanvasTestWithFM(
    "ShaderProgram Alpha BlendTest", 1,
    {images: {ShaderProgram1: "/assert/ShaderProgram_1.png"}},
    function(canvas, gl, fm, copier, images) {
        var fillProgram = new PolygonProgram(gl);
        var gradProgram = new AlphaGradientProgram(gl);

        fm.setRenderTarget();

        // clear
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        fillProgram.run(fm, null, "#00FFFF", [-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
        gradProgram.run(fm, null, "#FF0000");

        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());

        imageFuzzyOk("ShaderProgram Alpha BlendTest", gl, canvas, images.ShaderProgram1);

        fillProgram.destroy();
        gradProgram.destroy();
    }
);

CanvasTestWithFM(
    "ShaderProgram BlendTest", 22,
    {
        images: imagesRange("ShaderProgramBlend", 11)
    },
    function(canvas, gl, fm, copier, images) {
        var testData = [
            [Webvs.REPLACE, 0.5],
            [Webvs.MAXIMUM, 0.5],
            [Webvs.AVERAGE, 0.5],
            [Webvs.ADDITIVE, 0.5],
            [Webvs.SUBTRACTIVE1, 0.5],
            [Webvs.SUBTRACTIVE2, 0.5],
            [Webvs.MULTIPLY, 0.5],
            [Webvs.MULTIPLY2, 0.5],
            [Webvs.ADJUSTABLE, 0.5],
            [Webvs.ADJUSTABLE, 0.25],
            [Webvs.ADJUSTABLE, 1]
        ];

        _.each(testData, function(data, index) {
            _.each([true, false], function(dynamicBlend) {
                fm.setRenderTarget();

                // clear
                gl.clearColor(0,0,0,1);
                gl.clear(gl.COLOR_BUFFER_BIT);

                // draw a red triangle
                var program = new PolygonProgram(gl);
                program.run(fm, null, "#804000", [-0.8,-0.6, 0.46,-0.5, -0.7,0.7]);

                // draw a blue triangle
                var program2;
                if(dynamicBlend) {
                    program2 = new PolygonProgram(gl, {blendValue: data[1], dynamicBlend: true});
                    program2.run(fm, data[0], "#004080", [-0.6,-0.4, 0.66,-0.3, -0.5,0.9]);
                } else {
                    program2 = new PolygonProgram(gl, {blendMode: data[0], blendValue: data[1]});
                    program2.run(fm, null, "#004080", [-0.6,-0.4, 0.66,-0.3, -0.5,0.9]);
                }

                fm.restoreRenderTarget();
                copier.run(null, null, fm.getCurrentTexture());

                imageFuzzyOk("ShaderProgram Blend", gl, canvas, images["ShaderProgramBlend"+index]);

                program.destroy();
                program2.destroy();
            });
        });
    }
);
