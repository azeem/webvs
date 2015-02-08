/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM(
    "Container crud", 4,
    {
        images: {
            "yellow": "/assert/Yellow.png",
            "magenta": "/assert/Magenta.png",
            "halfMagenta": "/assert/HalfMagenta.png",
            "blue": "/assert/Blue.png"
        }
    },
    function(canvas, gl, fm, copier, images) {
        var main = new DummyMain(canvas, copier);
        var parent = new DummyParent(fm);

        var el = new Webvs.EffectList(gl, main, parent, {
            id: "root",
            clearFrame: true,
            components: [
                {
                    id: "cs1",
                    type: "ClearScreen",
                    color: "#ff0000"
                },
                {
                    id: "el2",
                    type: "EffectList",
                    output: "ADDITIVE",
                    components: [
                        {
                            id: "cs21",
                            type: "ClearScreen",
                            color: "#00ff00"
                        },
                    ]
                }
            ]
        });

        function renderFrame(message, imageData) {
            fm.setRenderTarget();
            el.draw();
            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());
            imageFuzzyOk(message, gl, canvas, imageData);
        }

        renderFrame(
          "Container code: yellow first time",
          images.yellow
        );

        // add component 1
        el.findComponent("el2").addComponent({
            id: "cs12",
            type: "ClearScreen",
            color: "#0000ff"
        });
        renderFrame(
          "Container code: adding new component in subcomponent should work",
          images.magenta
        );

        // add component 2
        el.addComponent({
            id: "cs123",
            type: "ClearScreen",
            color: "#0000ff"
        });
        renderFrame(
          "Container code: adding new component should work",
          images.blue
        );

        // remove component
        el.detachComponent("cs123").destroy();
        renderFrame(
          "Container code: removing new component should work",
          images.magenta
        );

        el.destroy();
    }
);
