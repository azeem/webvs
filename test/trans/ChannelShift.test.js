/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM(
    "ChannelShift", 5,
    {
        images: imagesRange("ChannelShift", 5)
    },
    function(canvas, gl, fm, copier, images) {
        var gradientProgram = new GradientProgram(gl);

        var testOptions = [
            {channel: "RBG"},
            {channel: "BRG"},
            {channel: "BGR"},
            {channel: "GBR"},
            {channel: "GRB"}
        ];

        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);

        _.each(testOptions, function(opts, index) {
            var cshift = new Webvs.ChannelShift(gl, main, parent, opts);
            fm.setRenderTarget();
            // clear
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            //draw gradient
            gradientProgram.run(fm, null);
            // run effect
            cshift.draw();
            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());

            imageFuzzyOk("ChannelShift " + index, gl, canvas, images["ChannelShift"+index]);

            cshift.destroy();
        });

        gradientProgram.destroy();
    }
);
