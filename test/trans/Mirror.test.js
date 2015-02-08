/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

var QuadrantColorProgram = function(gl) {
    QuadrantColorProgram.super.constructor.call(this, gl, {
        fragmentShader: [
            "void main() {",
            "    if(v_position.x < 0.5 && v_position.y < 0.5) {",
            "        setFragColor(vec4(1.0,0.0,0.0,1.0));",
            "    }",
            "    if(v_position.x < 0.5 && v_position.y > 0.5) {",
            "        setFragColor(vec4(0.0,1.0,0.0,1.0));",
            "    }",
            "    if(v_position.x > 0.5 && v_position.y > 0.5) {",
            "        setFragColor(vec4(0.0,0.0,1.0,1.0));",
            "    }",
            "    if(v_position.x > 0.5 && v_position.y < 0.5) {",
            "        setFragColor(vec4(1.0,1.0,0.0,1.0));",
            "    }",
            "}"
        ]
    });
};
QuadrantColorProgram = Webvs.defineClass(QuadrantColorProgram, Webvs.QuadBoxProgram);

CanvasTestWithFM(
    "Mirror", 7,
    {
        images: _.extend(imagesRange("Mirror", 6), {
            "Mirror6": "/assert/Blue.png"
        })
    },
    function(canvas, gl, fm, copier, images) {
        var quadProgram = new QuadrantColorProgram(gl);
        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);

        var testValues = [
            {opts: {topToBottom: true}},
            {opts: {topToBottom:false, bottomToTop: true}},
            {opts: {topToBottom:false, leftToRight: true}},
            {opts: {topToBottom: false, rightToLeft: true}}, 
            {opts: {topToBottom: true, rightToLeft: true, onBeatRandom: true, smoothTransition: true, transitionDuration: 10}, animCount: 5, beatFrame: [0]},
            {opts: {topToBottom: true, bottomToTop: true, rightToLeft: true, leftToRight: true, onBeatRandom: true, smoothTransition: true, transitionDuration: 15}, animCount: 15, beatFrame: [0, 10]},
            {opts: {topToBottom: true, rightToLeft: true}},
        ];

        Math.seedrandom("mirror_test2"); // fixed seed
        _.each(testValues, function(data, index) {
            var mirror = new Webvs.Mirror(gl, main, parent, data.opts);
            fm.setRenderTarget();

            // clear
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            if(data.animCount) {
                for(var i = 0;i < data.animCount;i++) {
                    main.analyser.beat = _.contains(data.beatFrame, i);
                    quadProgram.run(fm, null);
                    mirror.draw();
                }
            } else {
                quadProgram.run(fm, null);
                mirror.draw();
            }

            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());

            imageFuzzyOk("Mirror " + index, gl, canvas, images["Mirror"+index]);
            mirror.destroy();
        });

        quadProgram.destroy();
        Math.seedrandom(); // random seed
    }
);
