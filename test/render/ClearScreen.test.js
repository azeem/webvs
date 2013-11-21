/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM("ClearScreen", 3, function(canvas, gl, fm, copier, comparator) {
    var gprogram = new GradientProgram(0);
    gprogram.init(gl);

    var testValues = [
        {opts: {color: "#00FFFF"}, beat: false, iter: 1},
        {opts: {n: 5, color: "#00FFFF"}, beat: true, iter: 8},
        {opts: {n: 5, color: "#00FFFF"}, beat: true, iter: 10},
    ];

    var expectedImages = [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABa0lEQVR4Xu3VwQkAQAjEQO2/aA+uinnECkLC4s7dTccY2IIwLT5IQaweBcF6FKQgmgGMpx9SEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhtJCCYAYwnBZSEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhPMhtK0hKRQvwAAAAAElFTkSuQmCC",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACAklEQVR4Xu3ST0SEcRCA4e/XJrJEIpFIRCKRSCQikUisiBWJRCIRiUQiEYlEIrEiViQSiUgkEolEJBKJRCQS/TtEhw7p9B7ewxjGzBzmmRDeovdYFEUZn/Ez/1b7T8/3jPv+duMQXgX5ehbKw4TwIggL5FkQFsiTICyQR0FYIA+CsEDuBWGB3AnCArkVhAVyIwgL5FoQFsiVICyQS0FYIBeCsEDOBWGBnAnCAjkVhAVyIggL5FgQFsiRICyQQ0FYIAeCsED2BWGB7AnCAtkVhAWyIwgLZFsQFsiWICyQTUFYIBuCsEDWBWGBrAnCAkkLwgJZFYQFsiIICyQlCAtkWRAWyJIgLJBFQVggC4KwQOYFYYHMCcICmRWEBTIjCAtkWhAWyJQgLJBJQVggE4KwQMYFYYGMCcICGRWEBTIiCAtkWBAWyJAgLJBBQVggA4KwQPoFYYH0CcIC6RWEBdIjCAukWxAWSJcgLJBOQVggSUFYIB2CsEDaBWGBJARhgbQJwgJpFYQF0iIIC6RZEBZIkyAskEZBWCANgrBA6gVhgdQJwgKpFYQFUiMIC6RaEBZIlSAskEpBWCAVgrBAygVhgZQJwgIpFYQFUiIIC6RYEBZIkSAskEJBWCAFgrBA8gVhgeQJwgLJFYQFkiMICyQuCAskWxAWSJYgLJBMQVggQRASyAfhYPkHiTFucwAAAABJRU5ErkJggg==",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABa0lEQVR4Xu3VwQkAQAjEQO2/aA+uinnECkLC4s7dTccY2IIwLT5IQaweBcF6FKQgmgGMpx9SEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhtJCCYAYwnBZSEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhPMhtK0hKRQvwAAAAAElFTkSuQmCC"
    ];

    var main = new DummyMain(canvas);
    var parent = new DummyParent(fm);

    _.each(testValues, function(testValue, index) {

        var clearscreen = new Webvs.ClearScreen(gl, main, parent, testValue.opts);
        fm.setRenderTarget();

        // clear
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // generate gradient
        gprogram.run(fm, null);
        for(var i = 0;i < testValue.iter;i++) {
            if(testValue.beat) {
                main.analyser.beat = ((i%2)===0);
            }
            clearscreen.draw();
        }
        
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());

        imageFuzzyOk("ClearScreen " + index, gl, canvas, expectedImages[index]);
        clearscreen.destroy();
    });

    gprogram.cleanup();
});
