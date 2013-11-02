/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM("Effectlist Code", 2, function(canvas, gl, fm, copier) {
    var el = new Webvs.EffectList({
        code: {
            init: "counter = 1;",
            perFrame: "counter=counter+1;enabled=counter%2;"
        },
        components: [
            {
                type: "ClearScreen",
                color: "#ff0000"
            }
        ]
    });
    el.init(gl, new DummyMain(canvas, copier), new DummyParent(fm));

    fm.setRenderTarget();
    el.update();
    fm.restoreRenderTarget();
    copier.run(null, null, fm.getCurrentTexture());
    equal(canvas.toDataURL(),
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABbUlEQVR4Xu3TsQkAMAzEQHv/oZMUGULFGdwLid+ZOe9dxMAKEinxMQRp9RhBBIkZiOFYiCAxAzEcCxEkZiCGYyGCxAzEcCxEkJiBGI6FCBIzEMOxEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIYLEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDsRBBYgZiOBYiSMxADMdCBIkZiOFYiCAxAzEcCxEkZiCGYyGCxAzEcCxEkJiBGI6FCBIzEMOxEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIYLEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDsRBBYgZiOBYiSMxADMdCYkEuN71kAdKuUAcAAAAASUVORK5CYII=",
          "Effectlist code test: no rendering the first time");

    fm.setRenderTarget();
    el.update();
    fm.restoreRenderTarget();
    copier.run(null, null, fm.getCurrentTexture());
    equal(canvas.toDataURL(),
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABbUlEQVR4Xu3V0QkAIAzE0Hb/oVVwifcR6QAh4XDPzLueYmALoqT4HAWxehQE61GQgmgGMJ7+kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhtJCCYAYwnBZSEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhtJCCYAYwnBZSEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDOcCFY7HnQ4xRsoAAAAASUVORK5CYII=",
          "Effectlist code test: red cleared screen the second time");

    el.destroy();
});

CanvasTestWithFM("Container operations", 5, function(canvas, gl, fm, copier) {
    var el = new Webvs.EffectList({
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
    el.init(gl, new DummyMain(canvas, copier), new DummyParent(fm));
    
    function renderFrame(message, imageData) {
        fm.setRenderTarget();
        el.update();
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());
        equal(canvas.toDataURL(), imageData, message);
    }

    var images = {
        yellow: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABa0lEQVR4Xu3VwQkAQAjEQO2/aA+uinnECkLC4t7NTccY2IIwLT5IQaweBcF6FKQgmgGMpx9SEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhtJCCYAYwnBZSEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhPI+0K0jeZ1sXAAAAAElFTkSuQmCC",
        magenta: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABa0lEQVR4Xu3VwQkAQAjEQO2/aA+uinnECkLC4t7cTccY2IIwLT5IQaweBcF6FKQgmgGMpx9SEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhtJCCYAYwnBZSEMwAhtNCCoIZwHBaSEEwAxhOCykIZgDDaSEFwQxgOC2kIJgBDKeFFAQzgOG0kIJgBjCcFlIQzACG00IKghnAcFpIQTADGE4LKQhmAMNpIQXBDGA4LaQgmAEMp4UUBDOA4bSQgmAGMJwWUhDMAIbTQgqCGcBwWkhBMAMYTgspCGYAw2khBcEMYDgtpCCYAQynhRQEM4DhPCwYK0j2qLoHAAAAAElFTkSuQmCC",
        halfMagenta: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABbElEQVR4Xu3VUQkAMAzE0NV5nW8wFfl4VRASjs6evcdlDIwgmRYfRJBWD0FiPQQRpGYgxuOHCBIzEMOxEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIYLEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDsRBBYgZiOBYiSMxADMdCBIkZiOFYiCAxAzEcCxEkZiCGYyGCxAzEcCxEkJiBGI6FCBIzEMOxEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIYLEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDsRBBYgZiOBYiSMxADMdCBIkZiOFYiCAxAzEcCxEkZiCGYyGCxAzEcB6ZRsgBX2l/MAAAAABJRU5ErkJggg==",
        blue: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABa0lEQVR4Xu3VwQkAQAjEQO2/aA+uijzGCkLC4s7cjcsYWEEyLT6IIK0egsR6CCJIzUCMxw8RJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDsRBBYgZiOBYiSMxADMdCBIkZiOFYiCAxAzEcCxEkZiCGYyGCxAzEcCxEkJiBGI6FCBIzEMOxEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIYLEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDsRBBYgZiOBYiSMxADMdCBIkZiOFYiCAxAzEcCxEkZiCGYyGCxAzEcCxEkJiBGI6FCBIzEMOxEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIYLEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhPE5Hx53K44yoAAAAAElFTkSuQmCC"
    };

    renderFrame(
      "Container code: yellow first time",
      images.yellow
    );
    
    // add component 1
    el.addComponent("el2", {
        id: "cs12",
        type: "ClearScreen",
        color: "#0000ff"
    });
    renderFrame(
      "Container code: adding new component in subcomponent should work",
      images.magenta
    );

    // add component 2
    el.addComponent("root", {
        id: "cs123",
        type: "ClearScreen",
        color: "#0000ff"
    });
    renderFrame(
      "Container code: adding new component should work",
      images.blue
    );

    // remove component
    el.detachComponent("cs123").destroyPool();
    renderFrame(
      "Container code: removing new component should work",
      images.magenta
    );

    // update component
    el.updateComponent("el2", {
        id: "el2",
        type: "EffectList",
        output: "AVERAGE",
        components: [
            {
                id: "cs21",
                type: "ClearScreen",
                color: "#000000" // this change shouldnt affect 
                                 //anything since subcomponents are not updated
            },
        ]
    });
    renderFrame(
      "Container code: updating component should work",
      images.halfMagenta
    );

});
