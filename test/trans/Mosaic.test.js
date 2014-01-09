/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM("Mosaic", 4, function(canvas, gl, fm, copier) {
    var gprogram = new GradientProgram(gl);

    var testOptions = [
        {squareSize: 1},
        {squareSize: 0.2},
        {squareSize: 0.011},
        {squareSize: 0.01, onBeatSizeChange: true, onBeatSquareSize: 0.07, onBeatSizeDuration: 10},
    ];

    var expectedImages = [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACAklEQVR4Xu3SQUSEYRCA4f+rRCISiUQiViQSiUQkVqwlEYlEIpGIRCKRiEQikUgsiUQiEYlEIpGIRCKRiESirQ7RoUM6vYf3MIYxM4d5JoT3dDoziqKMz/iZf6v9p+d7xn1/u3EIb4J8PQvlYUJ4FYQF8iIIC+RZEBbIkyAskEdBWCAPgrBA7gVhgdwJwgK5FYQFciMIC+RaEBbIlSAskEtBWCAXgrBAzgVhgZwJwgI5FYQFciIIC+RYEBbIkSAskENBWCAHgrBA9gVhgewJwgLZFYQFsiMIC2RbEBbIliAskE1BWCAbgrBA1gVhgawJwgJJCcICWRWEBbIiCAtkWRAWyJIgLJBFQVggC4KwQOYFYYHMCcICmRWEBTIjCAtkWhAWyJQgLJBJQVggE4KwQMYFYYGMCcICGRWEBTIiCAtkWBAWyJAgLJBBQVggA4KwQPoFYYH0CcIC6RWEBdIjCAukWxAWSJcgLJBOQVggHYKwQNoFYYG0CcICaRWEBZIUhAWSEIQF0iIICyQuCAukWRAWSJMgLJBGQVggDYKwQOoFYYHUCcICqRWEBVIjCAukWhAWSJUgLJBKQVggFYKwQGKCsEDKBWGBlAnCAikVhAVSIggLpFgQFkiRICyQQkFYIAWCsEDyBWGB5AnCAskVhAWSIwgLJFsQFkiWICyQIAgJ5AP36lyyKEENagAAAABJRU5ErkJggg==",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAB10lEQVR4Xu3ZQU1DQRiFUd7mrWCFAQwgAAMYwEAF1EAN1AACMIABDCAAAxjAAKu2pEkXTfNnSJOXO5nDDhIg4Xt3TjtM8+9ud3P2cXf+hcPnrV+7veJ7L/2O0X7eJEj7w7bEAyPIP9YvyOGP5cgKe2LGC/ID9dYXLMscWYI0v4IUZEhDLMRC/t47tp7b46H+DfXWh2MZQwRpXqsgQ6JuIRYC9eOV+KUjcJq/oJ6FuiBhR5YggjCEIad/LKe/85/mT6hnoS5ImCGCCAL1CnULCVvIB9SzUBfEQhhSGWIhFmIh1ULeoZ6FuiBhR5YggjCEIR1dv79BPQt1QcIMEUQQqFeoW0jYQl6hnoW6IBbCkMoQC7EQC6kWsoV6FuqChB1ZggjCEIZ0dP2+gXoW6oKEGSKIIFCvULeQsIWsoZ6FuiAWwpDKEAuxEAupFrKCehbqgoQdWYIIwhCGdHT9/gL1LNQFCTNEEEGgXqFuIWELeYZ6FuqCWAhDKkMsxEIspFrIE9SzUBck7MgSRBCGMKSj6/dHqGehLkiYIYIIAvUKdQsJW8gD1LNQF8RCGFIZYiEWYiHVQu6hnoW6IGFHliCCMIQhHV2/z1DPQl2QMEMEEQTqFeoWErWQPQvVWr72UiopAAAAAElFTkSuQmCC",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACA0lEQVR4Xu2cwQnAIADE6mhu1tU6mcUVAgGR9J8Dk0p/HfNb67ngeS84wz7CKMhZJQtyVo9uyGE9ClIQyUAfdUksnS0INSdxBZHE0tmCUHMSVxBJLJ0tCDUncQWRxNLZglBzElcQSSydLQg1J3EFkcTS2YJQcxJXEEksnS0INSdxBZHE0tmCUHMSVxBJLJ0tCDUncQWRxNLZglBzElcQSSydLQg1J3EFkcTS2YJQcxJXEEksnS0INSdxBZHE0tmCUHMSVxBJLJ0tCDUncQWRxNLZglBzElcQSSydLQg1J3EFkcTS2YJQcxJXEEksnS0INSdxBZHE0tmCUHMSVxBJLJ0tCDUncQWRxNLZglBzEndPkNkf5aR3BM2OWRAkzoIKYpmFuwWB4iysIJZZuFsQKM7CCmKZhbsFgeIsrCCWWbhbECjOwgpimYW7BYHiLKwgllm4WxAozsIKYpmFuwWB4iysIJZZuFsQKM7CCmKZhbsFgeIsrCCWWbhbECjOwgpimYW7BYHiLKwgllm4WxAozsIKYpmFuwWB4iysIJZZuFsQKM7CCmKZhbsFgeIsrCCWWbhbECjOwgpimYW7BYHiLKwgllm4WxAozsIKYpmFuwWB4iysIJZZuFsQKM7CCmKZhbsFgeIsrCCWWbhbECjOwgpimYW7BYHiLKwgllm4WxAozsJ+ynRFdAmaw00AAAAASUVORK5CYII=",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACV0lEQVR4Xu3bzU3DUBBF4bgLl4GERBNURUn0RB8hrMPm6YyjRP5YJ5Y4Z+7M+3G2/ed6vQz+vQ8+6+9RH8PPext+3vT/uxHSDBHS+F0kJALUsiLA6QgTQsgSgekCNNSX8N9/mJAI0FCPAM2QCHA6woQQskRgugAN9SX8hrqzrFgwl+kImyHRCCENoBnS+I13BEIIWSNghqzxuvu0GdIAalmN3wEz5NudenEy3RG2nZDiQ0ISvduXn//4XUKSYy0r4ZOQiO+ML8ppWalotKyET8uK+LSsDHA6wuc7yzJDUhFOF6CdetJxsVOP/OzUK0AzJBKc7qmEELJEYLoADfUl/I94Uc6yNymRkITP0UnEd8ajky936qVq5lsWIcXHATt1QghZIXC+jaGErNTH4W9qbjshhKwQ0LJWaP3z2ellICGELBGYLkAzZAn/Iw4XDfWkREISvlc4XJSQpFhCEj4Jifgcv2eA0xG2D4lKCGkA7UMaP/chkd8LvLlo2ZscT7fobf90p16MEFLo3b77/D+LlpCkWEISPgmJ+M64U9eyUtFoWQmflhXxaVkZ4HSEz3e4aIakIpwuQDv1pOOIn0VLSFIiIQmfVVbEZ5WVAU5H2CorKiGkAbTKavwOuMK1ykpKpjuChCQd9iER3ysse3d36sXyfMsipPg4YKgTQsgKgfNtDCVkpT7uPmuGJHxWWRHfGQ8XtaxUNFpWwqdlRXxaVgY4HWHL3qiEkAZw2w31RHC6AAlJOo44fpeQpERCEj7L3ojPsjcDnI6wZW9UQkgDaJXV+I3fGP4Cw7hSMBmamZQAAAAASUVORK5CYII="
    ];

    var main = new DummyMain(canvas);
    var parent = new DummyParent(fm);

    _.each(testOptions, function(opts, index) {
        var mosaic = new Webvs.Mosaic(gl, main, parent, opts);
        fm.setRenderTarget();

        // clear
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if(opts.onBeatSizeChange) {
            for(var i = 0;i < 5;i++) {
                main.analyser.beat = i == 0;
                gprogram.run(fm, null);
                mosaic.draw();
            }
        } else {
            gprogram.run(fm, null);
            mosaic.draw();
        }


        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());

        imageFuzzyOk("Mosaic " + index, gl, canvas, expectedImages[index]);
        mosaic.destroy();
    });

    gprogram.destroy();
});
