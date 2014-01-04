/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTestWithFM("Superscope test", 7, function(canvas, gl, fm, copier) {
    var code = {
        init: "n=4",
        perFrame: "c=0",
        perPoint: [
            "x=select(c, -0.75, -0.15, 0.5, 0);",
            "y=select(c, -0.5,  0.5, -0.23, -1);",
            "red  =select(c, 1, 0, 0, 1);",
            "green=select(c, 0, 1, 0, 1);",
            "blue =select(c, 0, 0, 1, 1);",
            "c=c+1;"
        ]
    };
    var code2 = {
        init: "n=3",
        perFrame: "c=0",
        perPoint: [
            "x=select(c, -0.75, -0.15, 0.8);",
            "y=select(c, -0.5,  0.5, 0);",
            "red  =select(c, 1, 0, 0);",
            "green=select(c, 0, 1, 0);",
            "blue =select(c, 0, 0, 1);",
            "c=c+1;"
        ]
    };

    var testData = [
        [{code: code, thickness: 1, drawMode: "DOTS"}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAB5klEQVR4Xu2bQarCABTE2vsfuv8Luo8Lh7REcDf4pgmzET2P47j+37d+Xdd1nOd562f4lH89xe2FPMLE+yESIrOZkITICMjqtJCEyAjI6rSQhMgIyOq0kITICMjqtJCEyAjI6rSQhMgIyOq0kITICMjqtJCEyAjI6rSQhMgIyOq0kITICMjqtJCEyAjI6ny9kNePuJ7xkzSZiXedr4U4H+M5rRIic5mQhMgIyOq0kITICMjqtJCEyAjI6rSQhMgIyOq0kITICMjqtBAsZPO1akKwkE0wIRvO+EpCMKpNMCEbzvhKQjCqTTAhG874SkIwqk0wIRvO+EpCMKpNMCEbzvhKQjCqTTAhG874SkIwqk0wIRvO+EpCMKpNMCEbzvhKQjCqTTAhG874SkIwqk0wIRvO+EpCMKpNMCEbzvhKQjCqTTAhG874SkIwqk0wIRvO+EpCMKpNMCEbzvhKQjCqTTAhG874SkIwqk0wIRvO+EpCMKpNMCEbzvhKQjCqTTAhG874yn2EbP5zicH9KngfIb8iIPvchCRERkBWp4UkREZAVqeFJERGQFanhSRERkBWp4UkREZAVqeFJERGQFanhSRERkBWp4UkREZAVqeFJERGQFanhSRERkBWp4UkREZAVqeFyIT8AbfGagEPkP+yAAAAAElFTkSuQmCC"],
        [{code: code, thickness: 3, drawMode: "DOTS"}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACHUlEQVR4Xu2bMU7DABAE7f8/2kCBQkGxicartTSR6I699QxHESXncRzX989jX9f1qn+e52Of47f4zxMoZEjj44UMsUSqKATByIUohGOJJCkEwciFKIRjiSQpBMHIhSiEY4kkKQTByIUohGOJJCkEwciFKIRjiSQpBMHIhSiEY4kkKQTByIUohGOJJCkEwciFKIRjiSQpBMHIhSiEY4kkKQTByIUohGOJJCkEwciFvCXk7+eFnv8JKA4imaQQkiaQpRAAIhnxlhBysVn/E1DI2F+GQhQyRmCsjheikDECY3W8EIWMERir44UoZIzAWB0vJBLSe1tVIQqJCIwNeSFjQnp1/JfVYx1tUkiEqTekkB7raJNCIky9IYX0WEebFBJh6g0ppMc62qSQCFNvSCE91tEmhUSYekMK6bGONikkwtQbUkiPdbRJIRGm3pBCeqyjTQqJMPWGFNJjHW1SSISpN6SQHutok0IiTL0hhfRYR5sUEmHqDSmkxzrapJAIU29IIT3W0SaFRJh6QwrpsY42KSTC1BtSSI91tEkhEabekEJ6rKNNCokw9YYU0mMdbXqGkN43yiJodw4p5E66H2Qr5ANod/7KM4TcSWAsWyEKGSMwVscLUcgYgbE6XohCxgiM1fFCFDJGYKyOF6KQMQJjdbwQhYwRGKvjhShkjMBYHS9EIWMExup4IQoZIzBWxwtRyBiBsTpeiELGCIzV+QKK03MBa1P8JgAAAABJRU5ErkJggg=="],
        [{code: code, thickness: 300, drawMode: "DOTS"}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABa0lEQVR4Xu3V0QkAMAjE0Lr/0LV0inw8JwgJh3PfHZcxMIJkWnwQQVo9BIn1EESQmoEYjx8iSMxADMdCBIkZiOFYiCAxAzEcCxEkZiCGYyGCxAzEcCxEkJiBGI6FCBIzEMOxEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIYLEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDsRBBYgZiOBYiSMxADMdCBIkZiOFYiCAxAzEcCxEkZiCGYyGCxAzEcCxEkJiBGI6FCBIzEMOxEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIYLEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDWaY+juTHHe4vAAAAAElFTkSuQmCC"],

        [{code: code, thickness: 1, drawMode: "LINES"}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACfElEQVR4Xu3c7W6DMAyFYbj/i2ajUqVVK20Af7x2zqT9y8Dxwwm0RFuXZdl+f8v/bNu2rOtafh77DAQCYmwDsve0Q0pagXRAEQhoudpLaQdSPSUtQSqjCERLVlwHKj51tU3Ik70aikDiAjt0pvYg1W7wU4BUQhHI0EISN2gakCopmQqkAopA4lajoTNNB0JPyZQgZBSBDC0kcYOmBaGmRCCwjRFTgxBTMj0IDUUgsN0q50H2XVz196P9e2yivDc5D/LIuFC8HoQF8qezhJRcA1FKvAJyc1+Wli5zmOsJUUrMMfYD3gMRijmKQD60NOMmfx9EKTFNiQ2IUMxQBDLQysilyw5EKRmg/T5EIN979BgRlRJbEKVkkPd4mD1IW5SYryUEMnRNx2DYfFI/mlDcHIZaen1Q7ER8EtJm2YrF8E1IeZR4DH+Qsig5GAJ5e2PJw4gBKZWSXAyBvCQkHyMOpERKZgNBozAwYhOCBeFgxIPgUFgYk4PwMHJAEClhYuSBpKJwMSYEYWPkgoSnhI8hkOsvSdz+0u99yGjJIRduyElGZ/xxXD6I+9JVByN/yXpeK249czuwSRreHYSREJeU1MPgJMQcpCYGC8QMpS4GD+Q2Sm2MZiD1MZggl1MiELdHv/P/mKAHBjchp1LSB4MNMoTSC6M4SD8MPshhSnpiFAXpi1ED5CUlvTHqgDwesPtjFAPx+9hDOjLn63dSVxJrEUhi89kvqGCNySpHCcnq/MF5BSIQWAdg5SghAoF1AFaOEiIQWAdg5SghAoF1AFaOEiIQWAdg5SghAoF1AFaOEiIQWAdg5SghAoF1AFaOEiIQWAdg5SghAoF1AFbOD/fdLhCWJrtIAAAAAElFTkSuQmCC"],
        [{code: code, thickness: 3, drawMode: "LINES"}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACj0lEQVR4Xu3a0VKEMAyF4eX9H3oVx9V1naUptMmf9DjjlQXSfJwCwna73e6fv6l/7vffKWzblnoue/UCARGWANn7WSUlZUCqoAgEtFztpZQCqZCSciDZUQSiJcunA1nvukom5EGeEUUgPoE1H6U0SMYLfHmQbCgCMS8mPgOXAMmUkmVAsqAIxGclMh9lKZAMKVkOhI4iENgr3yVByCkRyP5SCJSSZUGoKVkahIgiENg3XX0gz19w5f4e7c+DGum9SR/IV8af5iIU8xO4daBAvjtFSUk/iFJiPdlPjTsHIpRTzbZsJJCXLkUvXedBlBLLCd89RiBvWhaVlGsgSkl3AlobXAcRSqvHXX8XSKNd3kvXGBClpCsFR4MFYmilZ0rGgSglBtr2kLEgZVH8/qMqkOZJ64exlzIepFRKfDEEcpgOf4x5IOlTEoMxFyQtShyGQP4tWbEY80FSpSQeQyA/CWFg+ICkSMlqIGgUDoZfQrAgLAxfEBwKD2NhECaGPwgiJVyMGJBQFDbGYiB8jDgQ95TkwBBI8+WU/4A5L6is83A5cV0OYp1xc1wsyPSlKxdG7JL1OFem9Wzajptn+ZUB8QmZkpKcGIyEDAfJi8EBGYaSG4MFchklP0YhkBoYPJDTKRHIlTu74227e9u9wbzaB+yZcdv7OhFzj80DB7TKZxdMENPSVQ+DeQ0xPcHXxGCDvE1JXYyEILUx+CDPKdnqY+QA+bqmrIGRCMTnlpNwFO5tL6E7ATUIJKDpR4cUiEBgHYCVo4QIBNYBWDlKiEBgHYCVo4QIBNYBWDlKiEBgHYCVo4QIBNYBWDlKiEBgHYCVo4QIBNYBWDlKiEBgHYCVo4QIBNYBWDlKiEBgHYCV8wEZzS4Qrueh0QAAAABJRU5ErkJggg=="],
        [{code: code, thickness: 25, drawMode: "LINES"}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACrElEQVR4Xu3a65aDIAwEYHn/h+56WXd161aCJEyS6Tn9hzXwOaDYMk3Ta/7CfV4v/bJKKXD9XirS73lDtwnSMGjah2REgU3Ijp0NhSCzPNJaAg+yJCVTSlyAZEIhyOHOBGHqcgOSJSWuQDKgEOTiYWrk1OUOJHpKXIJERiHIh/2fEVOXW5CoKXENEhGFIBVb1pZTl3uQaCkJARIJhSAVU9bexGLqCgMSJSUEESRkaaqdklAgEVISDsQ7CkGEU5b2Al/mf2Xp/y9rwP/RvL6H3xKiTzKvho2X4oPDPKIQ5AG4xl3X7xrClDTT9LwVPi/qRBmOQpBmgvOBvVLyftvLlDQT9UBJA+LlgfH6wZApGZaS/5/UiTIEJR0I+tT1eS+LKTFPSUoQ5JTc7/YyJaYpuQdZL6fmmuoPNN98xOxUUhBMjHWzsvr6x+1DfQrXltgdSQaCjSFLCP7FdZMUfAw5iFsUHxhJQPxgtIG4SokvjOAg/jDaQVykJBsINIpPjGcJgQXxi/EcBA7FN0YwEP8YfUAgUhIDox/IUJQ4GAFAYmH0BTFPSTwMgty+STF/jSl4QXVb/HcDkwvX5CS1Pe7arv4FleS0muNVNH9876R9Mo5n7t/D/r+41Rsco/8ackxRb5QEGH5AkmDogvS6DU6EoQ/yFCUZBjZIQgwbkNaUEETyoCFsK73jSophlxBJShJj2ILUoCTHwAIhxrYZMX+lM7xwAfnT/OpsxPgZpPEgxDhdsfYgx7WEGG+zzRiQtQyLmXLcNnrrvD4QpLXk2McRBMyXIAQBGwGwcpgQgoCNAFg5TAhBwEYArBwmhCBgIwBWDhNCELARACuHCSEI2AiAlcOEEARsBMDKYUIIAjYCYOUwIQQBGwGwcpgQgoCNAFg5TAhBwEYArBwmBAzkC5E3LhC2e1ZbAAAAAElFTkSuQmCC"],
        [{code: code2, thickness: 25, drawMode: "LINES"}, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACvElEQVR4Xu3b7XKCMBCFYbj/i27VyhQVSMzH7tnkdaa/BLPZh5MIY9dlWX5uf7xEOrACIiLxLAMQLY8FEEDEOiBWDgkBRKwDYuWQEEDEOiBWDgkBRKwDYuWQEEDEOiBWDgkBRKwDYuWQEEDEOiBWDgkBRKwDYuWQEEDEOiBWDgkBRKwDYuWQEEDEOiBWznr7mVz/H8rdc8grqwN/S1Z/kuXxgyNeyQ4AkmyR7QH/mzopse38yWiv37JAcUcBxJ3gtYDP+xBS4koEiGv7Pwc/vlMnJW5M549OQHFBAcSl7eeDXj9cJCXmXICYt/x6wPTjd1JSSbY1MO9hXhrkXg4oBSjvTQOkoIktTjm7eluCkJIMqdQyAkhGE1sckoLYxmgNQkoO9HIx7qf2AAHlifINRM+ETA9SAtEbZEqUGghAWuzUFUvT2fC99pBtvBYXTap1eXNIfUrB+z0mlzeZvDv1syn1qPt9rLx5FDT96JSeE8qbCCAPl54QFnvI/uLSmUtBSiyKByQDxhLCGkQr8aIYPe/Uw27wHqnYN8tiUw+xl3hDeCxZkvcmKhDTg6hBeIK4bvCqEN4g5ijqENOARIFQAOmZkjUaxKggYSFUQFqnJCxI3g3hnq3vGtDq08OBfAcBSMZTr7JDyiDsQFotXfIJqYMApOzyPzirDYQtSIuUSCakLcb2kL7Vtpu+5mpGkgJpD2GfkNqUSID0g/ABqUFxBekPAUh6gb0dYQfhB1KaEtOE2EP4gpSgmID4QfiDZC0Z+4NqvqKlBvOHAOTRAR2IyUH0ICYG0cWwv1NPLeWX79fuIdoQEyUkBsQEILEgBgaJCTEgSGyIgUDGgBgAZCyIwCBjQgQEqbqJCXNy3X/hhplmnEIBEbMCBBCxDoiVQ0IAEeuAWDkkBBCxDoiVQ0IAEeuAWDkkBBCxDoiV8wui4scB/MM9zgAAAABJRU5ErkJggg=="]
    ];

    var main = new DummyMain(canvas);
    var parent = new DummyParent(fm);
    _.each(testData, function(data, i) {
        var scope = new Webvs.SuperScope(gl, main, parent, data[0]);
        fm.setRenderTarget();
        // clear
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        scope.draw();
        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());
        imageFuzzyOk("superscope test " + i, gl, canvas, data[1]);
        scope.destroy();
    });
});
