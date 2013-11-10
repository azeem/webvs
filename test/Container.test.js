/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM("Container crud", 5, function(canvas, gl, fm, copier) {
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
    el.detachComponent("cs123").destroy();
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
                                 // anything since subcomponents are not updated
            },
        ]
    });
    renderFrame(
      "Container code: updating component should work",
      images.halfMagenta
    );

    el.destroy();
});

CanvasTestWithFM("Container Move & JSON", 2, function(canvas, gl, fm, copier) {
    var el = new Webvs.EffectList({
        dummy: "dummy",
        id: "root",
        clearFrame: true,
        components: [
            {
                id: "el1",
                type: "EffectList",
                input: "REPLACE",
                components: [
                    {
                        type: "SuperScope",
                        id: "ss",
                        clone: 6,
                        drawMode: "DOTS",
                        code: {
                            init: "n=1;",
                            perPoint: "x=((cid+1)*2/10)-1;y=0",
                        }
                    }
                ]
            },
            {
                id: "el2",
                type: "EffectList",
                input: "REPLACE",
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

    var component;

    component = el.detachComponent("ss");
    el.addComponent("el2", component);
    renderFrame("6 dots", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAB3UlEQVR4Xu2TQQrCUBTEfu9/6KrgWmEgECWFruoMz4S5zjn38+2RELgSIjHxPiMhLh8nIQmREZCd00ISIiMgO6eFJERGQHZOC0mIjIDsnBaSEBkB2TktJCEyArJzWkhCZARk57SQhMgIyM5pIQmREZCd00ISIiMgO6eFJERGQHZOC0mIjIDsnBaSEBkB2TktJCEyArJzWkhCZARk57SQhMgIyM5pIQmREZCd00ISIiMgO6eFJERGQHZOC0mIjIDsnBaSEBkB2TktJCEyArJzWkhCZARk57SQXxRy3/e5rpe7z8+//O7b/yS/txCS7tCdkAEaGUkISXfoTsgAjYwkhKQ7dCdkgEZGEkLSHboTMkAjIwkh6Q7dCRmgkZGEkHSH7oQM0MhIQki6Q3dCBmhkJCEk3aE7IQM0MpIQku7QnZABGhlJCEl36E7IAI2MJISkO3QnZIBGRhJC0h26EzJAIyMJIekO3QkZoJGRhJB0h+6EDNDISEJIukN3QgZoZCQhJN2hOyEDNDKSEJLu0J2QARoZSQhJd+hOyACNjCSEpDt0J2SARkYSQtIduhMyQCMjCSHpDt0JGaCRkYSQdIfuhAzQyEhCSLpDd0IGaGQkISTdoTshAzQykhCS7tD9AJl9dgHDlZa2AAAAAElFTkSuQmCC");

    equal(JSON.stringify(el.getOptions()), '{"dummy":"dummy","id":"root","clearFrame":true,"components":[{"id":"el1","type":"EffectList","input":"REPLACE","components":[],"output":"REPLACE","clearFrame":false,"enableOnBeat":false,"enableOnBeatFor":1},{"id":"el2","type":"EffectList","input":"REPLACE","output":"REPLACE","clearFrame":false,"enableOnBeat":false,"enableOnBeatFor":1,"components":[{"type":"SuperScope","id":"ss","clone":6,"drawMode":"DOTS","code":{"init":"n=1;","perPoint":"x=((cid+1)*2/10)-1;y=0"},"source":"SPECTRUM","colors":["#ffffff"]}]}],"output":"REPLACE","input":"IGNORE","enableOnBeat":false,"enableOnBeatFor":1}');

    el.destroy();
});
