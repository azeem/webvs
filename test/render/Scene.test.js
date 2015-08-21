CanvasTestWithFM(
    "Scene", 1,
    {
        async: true,
        images: {
            "blank": "assert/blank.png"
        }
    },
    function(canvas, gl, fm, copier, images, resume) {
        var main = new DummyMain(canvas);
        var parent = new DummyParent(fm);

        var testValue = {
            camera: "testCamera",
            components: [
                {
                    type: "Mesh",
                    model: "teddy.obj",
                    material: {
                        type: "NORMAL",
                        color: "cyan"
                    },
                    rotation: {x:0, y:0, z:0},
                    scale: {x: 1, y: 1, z: 1},
                    position: {x: 0, y: 0, z: 0}
                },
                {
                    type: "PerspectiveCamera",
                    id: "testCamera",
                    position: {x: 0, y: 0, z: 1}
                }
            ]
        };

        var scene;
        main.rsrcMan.on("ready", function () {
            fm.setRenderTarget();

            // clear
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            scene.draw();

            fm.restoreRenderTarget();
            copier.run(null, null, fm.getCurrentTexture());

            imageFuzzyOk("Scene", gl, canvas, images.blank,1,1);
            scene.destroy();
            resume();
        });
        scene = new Webvs.SceneComponent(gl, main, parent, testValue);
    }
);
