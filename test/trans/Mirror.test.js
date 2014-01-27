/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

function QuadrantColorProgram(gl) {
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
}
QuadrantColorProgram = Webvs.defineClass(QuadrantColorProgram, Webvs.QuadBoxProgram);

CanvasTestWithFM("Mirror", 7, function(canvas, gl, fm, copier) {
    var quadProgram = new QuadrantColorProgram(gl);
    var main = new DummyMain(canvas);
    var parent = new DummyParent(fm);

    var testValues = [
        [{topToBottom: true}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAB+klEQVR4Xu2U0QnAIBDFvP2Htp0hEJAj+v0CTaRz7n83nFnyGQV56zVOQQriGOiX5XjF1IJgdc6wII5XTC0IVucMC+J4xdSCYHXOsCCOV0wtCFbnDAvieMXUgmB1zrAgjldMLQhW5wwL4njF1IJgdc6wII5XTC0IVucMC+J4xdSCYHXOsCCOV0wtCFbnDAvieMXUgmB1zrAgjldMLQhW5wwL4njF1IJgdc6wII5XTC0IVucMC+J4xdSCYHXOsCCOV0wtCFbnDAvieMXUgmB1zrAgjldMLQhW5wwL4njF1IJgdc6wII5XTC0IVucMC+J4xdSCYHXOsCCOV0wtCFbnDAvieMXUgmB1zrAgjldMLQhW5wwL4njF1IJgdc6wII5XTC0IVucMC+J4xdSCYHXOsCCOV0wtCFbnDAvieMXUgmB1zrAgjldMLQhW5wwL4njF1IJgdc6wII5XTC0IVucMC+J4xdSCYHXOsCCOV0wtCFbnDAvieMXUgmB1zrAgjldMLQhW5wwL4njF1IJgdc6wII5XTC0IVucMC+J4xdSCYHXOsCCOV0wtCFbnDAvieMXUgmB1zrAgjldMLQhW5wwL4njF1IJgdc6wII5XTC0IVucMC+J4xdSCYHXOsCCOV0wtCFbnDAvieMXUgmB1zrAgjldMLQhW5wyXBPkAiz4rrH/ZpOYAAAAASUVORK5CYII="],
        [{topToBottom:false, bottomToTop: true}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAB+klEQVR4Xu2V0QmAMBDF2v2Hts4QCBxHpL8v0ETxfuf8Z8Gz4xbnFmTWy1iQWT36Qob1KEhBLAP91C2zkFsQKM6aFcQyC7kFgeKsWUEss5BbECjOmhXEMgu5BYHirFlBLLOQWxAozpoVxDILuQWB4qxZQSyzkFsQKM6aFcQyC7kFgeKsWUEss5BbECjOmhXEMgu5BYHirFlBLLOQWxAozpoVxDILuQWB4qxZQSyzkFsQKM6aFcQyC7kFgeKsWUEss5BbECjOmhXEMgu5BYHirFlBLLOQWxAozpoVxDILuQWB4qxZQSyzkFsQKM6aFcQyC7kFgeKsWUEss5BbECjOmhXEMgu5BYHirFlBLLOQWxAozpoVxDILuQWB4qxZQSyzkFsQKM6aFcQyC7kFgeKsWUEss5BbECjOmhXEMgu5BYHirFlBLLOQWxAozpoVxDILuQWB4qxZQSyzkFsQKM6aFcQyC7kFgeKsWUEss5BbECjOmhXEMgu5BYHirFlBLLOQWxAozpoVxDILuQWB4qxZQSyzkFsQKM6aFcQyC7kFgeKsWUEss5BbECjOmhXEMgu5BYHirFlBLLOQWxAozpoVxDILuQWB4qxZQSyzkFsQKM6aFcQyC7kFgeKsWUEss5BbECjOmhXEMgu5BYHirFlBLLOQWxAozpotCfIAuUIrSPM8cuoAAAAASUVORK5CYII="],
        [{topToBottom:false, leftToRight: true}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABcklEQVR4Xu3cuQ0AIBDEQK7/ovmqmMDQgGVrRcasfW+HMTAFYVp8kIJYPQqC9ShIQTQDGE9vSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhtJCCYAYwnLnfyfWjHBSlIFCMh1KQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhtJCCYAYwnBZSEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4RzjscedfsvjPQAAAABJRU5ErkJggg=="],
        [{topToBottom: false, rightToLeft: true}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABc0lEQVR4Xu3cwQ0AIQzEwKT/ormDKuZhKrBsrfhlZ86ZHmNgC8K0eCAFsXoUBOtRkIJoBjCe/pCCYAYwnBZSEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDj735ProhwUpSBQjItSkIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhtJCCYAYwnBZSEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOF8ILb5a4dyAKgAAAAASUVORK5CYII="],
        [{topToBottom: true, rightToLeft: true}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABa0lEQVR4Xu3VwQkAQAjEQO2/aA+uijzGCkLC4s7cjcsYWEEyLT6IIK0egsR6CCJIzUCMxw8RJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDsRBBYgZiOBYiSMxADMdCBIkZiOFYiCAxAzEcCxEkZiCGYyGCxAzEcCxEkJiBGI6FCBIzEMOxEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIYLEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDsRBBYgZiOBYiSMxADMdCBIkZiOFYiCAxAzEcCxEkZiCGYyGCxAzEcCxEkJiBGI6FCBIzEMOxEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIYLEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhPE5Hx53K44yoAAAAAElFTkSuQmCC"],
        [{_animCount: 5, _beatFrame: [0], topToBottom: true, rightToLeft: true, onBeatRandom: true, smoothTransition: true, transitionDuration: 10}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACBElEQVR4Xu2cwQnEMBDE1s3makq1uR4EArMo/xFEwvjnM+/zzYbv9274izkFuatjQe7q0Qm5rEdBCmIZ6FK3zEJuQaA4a1YQyyzkFgSKs2YFscxCbkGgOGtWEMss5BYEirNmBbHMQm5BoDhrVhDLLOQWBIqzZgWxzEJuQaA4a1YQyyzkFgSKs2YFscxCbkGgOGtWEMss5BYEirNmBbHMQm5BoDhrVhDLLOQWBIqzZgWxzEJuQaA4a1YQyyzkFgSKs2YFscxCbkGgOGtWEMss5BYEirNmBbHMQm5BoDhrVhDLLOQWBIqzZgWxzEJuQaA4a1YQyyzkFgSKs2YFscxCbkGgOGtWEMss5BYEirNmW4J8z+x4UW7Hg3JzCmIdWcYtCPOmrQqiqWXggjBv2qogmloGLgjzpq0Koqll4IIwb9qqIJpaBi4I86atCqKpZeCCMG/aqiCaWgYuCPOmrQqiqWXggjBv2qogmloGLgjzpq0Koqll4IIwb9qqIJpaBi4I86atCqKpZeCCMG/aqiCaWgYuCPOmrQqiqWXggjBv2qogmloGLgjzpq0Koqll4IIwb9qqIJpaBi4I86atCqKpZeCCMG/aqiCaWgYuCPOmrQqiqWXggjBv2qogmloGLgjzpq0Koqll4IIwb9qqIJpaBi4I86atCqKpZeCCMG/aqiCaWgb+A9n7K3rXdTuiAAAAAElFTkSuQmCC"],

        [{_animCount: 15, _beatFrame: [0, 10], topToBottom: true, bottomToTop: true, rightToLeft: true, leftToRight: true, onBeatRandom: true, smoothTransition: true, transitionDuration: 15}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACIElEQVR4Xu3cwYnDUBAEUenisBScM3NktjNoaOhCiPJ1+DO4HsvefH6u43s84fO6nvAtjlOQezkKci8P/0Ju5iGIIKsC/lNflS33ClKGWz0TZFW23CtIGW71TJBV2XKvIGW41TNBVmXLvYKU4VbPBFmVLfcKUoZbPRNkVbbcK0gZbvVMkFXZcq8gZbjVM0FWZcu9gpThVs8EWZUt9wpShls9E2RVttwrSBlu9UyQVdlyryBluNUzQVZly72ClOFWzwRZlS33ClKGWz0TZFW23CtIGW71TJBV2XKvIGW41TNBVmXLvYKU4VbPBFmVLfcKUoZbPRNkVbbcK0gZbvVMkFXZcq8gZbjVM0FWZcu9gpThVs8EWZUt9wpShls9E2RVttwrSBlu9ewpIP+fk3vGL8q9V9Ls3lMQNni6JkgqBM8FgYOnc4KkQvBcEDh4OidIKgTPBYGDp3OCpELwXBA4eDonSCoEzwWBg6dzgqRC8FwQOHg6J0gqBM8FgYOnc4KkQvBcEDh4OidIKgTPBYGDp3OCpELwXBA4eDonSCoEzwWBg6dzgqRC8FwQOHg6J0gqBM8FgYOnc4KkQvBcEDh4OidIKgTPBYGDp3OCpELwXBA4eDonSCoEzwWBg6dzgqRC8FwQOHg6J0gqBM8FgYOnc4KkQvBcEDh4OidIKgTPBYGDp3OCpELwXBA4eDonSCoEzwWBg6dzgqRC8FwQOHg69wPvlu5JFgTzcgAAAABJRU5ErkJggg=="]
    ];

    Math.seedrandom("mirror_test2"); // fixed seed
    _.each(testValues, function(testValue, index) {
        var mirror = new Webvs.Mirror(gl, main, parent, testValue[0]);
        fm.setRenderTarget();

        // clear
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if(testValue[0]._animCount) {
            for(var i = 0;i < testValue[0]._animCount;i++) {
                main.analyser.beat = _.contains(testValue[0]._beatFrame, i);
                quadProgram.run(fm, null);
                mirror.draw();
            }
        } else {
            quadProgram.run(fm, null);
            mirror.draw();
        }

        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());

        imageFuzzyOk("Mirror " + index, gl, canvas, testValue[1]);
        mirror.destroy();
    });

    quadProgram.destroy();
    Math.seedrandom(); // random seed
});
