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
