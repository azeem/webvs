/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */


CanvasTestWithFM("BufferSave", 1, function(canvas, gl, fm, copier) {
    var polyProgram = new PolygonProgram();
    polyProgram.init(gl);

    var main = new DummyMain(canvas, copier);
    var parent = new DummyParent(fm);

    var bufferSave = new Webvs.BufferSave(gl, main, parent, {
        action: "SAVE"
    });

    fm.setRenderTarget();

    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    polyProgram.run(fm, null, "#00FFFF", [-0.8,-0.6, 0.46,-0.5, -0.7,0.7]);

    // save, clear and restore
    bufferSave.draw();
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    bufferSave.setOption("action", "RESTORE");
    bufferSave.draw();

    fm.restoreRenderTarget();
    copier.run(null, null, fm.getCurrentTexture());

    imageFuzzyOk("BufferSave", gl, canvas, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACXklEQVR4Xu3d0W7CMBBE0fD/H02hKhKlDYwTZzO7e5H6UMmtrTmMQ9xIvSzLcr198TJJ4AKIicTPMgDx8lgAAcQsAbPl0BBAzBIwWw4NAcQsAbPl0BBAzBIwWw4NAcQsAbPl0BBAzBIwWw4NKQVyvf0p5XI35TUrgX0NuYPcX6DM8th5/P4AAcUQBJQpKHO2rOelsH3tgtkO8rxdvS4BlM0ox4CwfRmCgLIJ5biGPJbD9jUEczwITTEEAUVGiWkI25cpCE35CBPbEJpiCkJTVmHOaQhNMQWhKX9gzm0ITZkE8u5g8eNla2UAd/TfwWxryBEgbF+GIKCYNYRriilI46Z4XUNer/cNL/TeIA2b4g/SDCUHSCOUPCBNUHKBNEABZOtRz0E/lw+keEvGQY46xxp9xxW9R8kLUrQpuUEKouQHKYZSA6QQSh2QIii1QAqg1ANJjlITJDFKXZCkKLVBEqLUB0mG0gMkEcoYiMvB4uhBZKLHi3qBJGhKPxBzlJ4gxih9QUxReoMYogBihgKI2UdiQJ7vaQwenADE7Il7QP676z+xKYCsHcOchALIu3OxE1B0kOwHi0kOJAFRoAKbAkjaj73ZtqzAd7VSMnVMjoYkDVdF+FXS2zfaf4ue2ZBGAY+i7G8I4Y5m/na8DjJ1Wn7Z6v2ovGWRYUgCNCQkZn0SQPSsQkYCEhKzPgkgelYhIwEJiVmfBBA9q5CRgITErE8CiJ5VyEhAQmLWJwFEzypkJCAhMeuTAKJnFTISkJCY9UkA0bMKGQlISMz6JIDoWYWMBCQkZn0SQPSsQkZ+AYdv5AG3g7SiAAAAAElFTkSuQmCC");

    bufferSave.destroy();

    polyProgram.cleanup();
});
