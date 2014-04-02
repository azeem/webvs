/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM("Container crud", 4, function(canvas, gl, fm, copier) {
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
});
