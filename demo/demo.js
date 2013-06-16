/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/9/13
 * Time: 4:27 PM
 * To change this template use File | Settings | File Templates.
 */

(function() {

var dancer, webvs;
var clientId = "e818e8c85bb8ec3e90a9bbca23ca5e2a";
var dimensionFactor = 2;
var codeMirror;
var samplePreset = "{\r\n\tclearFrame: false,\r\n\tcomponents: [\r\n\t\t{\r\n\t\t\ttype: \"EffectList\",\r\n\t\t\toutput: Webvs.ADDITIVE,\r\n\t\t\tcomponents: [\r\n\t\t\t\t{type:\"FadeOut\", speed: 0.5},\r\n\t\t\t\t{\r\n\t\t\t\t\ttype: \"SuperScope\",\r\n\t\t\t\t\tcode: (function() {\r\n\t\t\t\t\t\tvar t = 0;\r\n\t\t\t\t\t\treturn {\r\n\t\t\t\t\t\t\tn: 800,\r\n\t\t\t\t\t\t\tonBeat: function() {\r\n\t\t\t\t\t\t\t\tt = t+0.3;\r\n\t\t\t\t\t\t\t\tthis.n = 100+Webvs.rand(900);\r\n\t\t\t\t\t\t\t},\r\n\t\t\t\t\t\t\tperFrame: function() {\r\n\t\t\t\t\t\t\t\tt = t-0.5;\r\n\t\t\t\t\t\t\t},\r\n\t\t\t\t\t\t\tperPoint: function() {\r\n\t\t\t\t\t\t\t\tvar d = 1\/this.n;\r\n\t\t\t\t\t\t\t\tvar r=(this.i-(t*3));\r\n\t\t\t\t\t\t\t\tthis.x=(Math.atan(r+d-t)*Math.cos(r+d-t+this.i));\r\n\t\t\t\t\t\t\t\tthis.y=((this.i+Math.cos(d+this.v*1.2))-1.5)*1.7;\r\n\t\t\t\t\t\t\t\tthis.red=Math.cos(r)+1;\r\n\t\t\t\t\t\t\t\tthis.blue=Math.sin(r);\r\n\t\t\t\t\t\t\t\tthis.green=Math.sin(this.i)\/2;\r\n\t\t\t\t\t\t\t}\r\n\t\t\t\t\t\t};\r\n\t\t\t\t\t})\r\n\t\t\t\t}\r\n\t\t\t]\r\n\t\t},\r\n\t\t{type: \"Convolution\", kernel: \"blur\"},\r\n\t\t{type: \"OnBeatClear\"}\r\n\t]\r\n}";
//var samplePreset = "{\r\n\tclearFrame: false,\r\n    components: [\r\n      {\r\n        type: \"SuperScope\",\r\n        dots: false,\r\n        code: (function() {\r\n          return {\r\n            n: 100,\r\n            perPoint: function() {\r\n              this.x=this.i+(Math.random()*2-1)\/100;\r\n              this.y=this.i+(Math.random()*2-1)\/100;\r\n              this.red=this.i;\r\n              this.green=this.i;\r\n              this.blue=this.i;\r\n            }\r\n          };\r\n        })\r\n      }\r\n    ]\r\n}";
function loadScTrack() {
//    dancer.load({
//        src: "music.mp3"
//    });
//    dancer.play();

    var input = $("#sc-url");
    var url = input.val();

    var prms = $.ajax({
        url: "http://api.soundcloud.com/resolve.json",
        data: {
            client_id: clientId,
            url: url
        }
    });
    prms.done(function(response) {
        input.val("");
        dancer.pause();
        dancer.load({
            src: response.stream_url + "?client_id=" + clientId
        });
        dancer.play();
    });
    prms.fail(function() {
        alert("Unable to resolve soundcloud track");
    });
}

function setCanvasDim() {
    var dimFactor = $("#dim-factor").val();
    var dimension = {
        width: $(window).outerWidth(),
        height:$(window).outerHeight()
    };
    console.dir(dimension);
    var canvasDim = {
        width: dimension.width/dimFactor,
        height: dimension.height/dimFactor
    };
    $("#my-canvas").attr(canvasDim).css(dimension);
}

function initEditor() {
    codeMirror = CodeMirror($("#preset-code").get(0), {
        value: samplePreset,
        tabSize: 2
    });
}

function initUi() {
    setCanvasDim();

    initEditor();

    $("#preset-code").val(samplePreset);

    $("#btn-play").on("click", loadScTrack);

    $("#btn-runpreset").on("click", function() {
        webvs.loadPreset(eval("("+codeMirror.getValue()+")"));
        webvs.start();
    });

    $("#btn-panel-toggle").on("click", function() {
        var button = $(this);
        var panel = $("#panel");
        panel.fadeToggle({
            complete: function() {
                if(panel.is(":visible")) {
                    button.text("Hide Panel");
                } else {
                    button.text("Show Panel");
                }
            }
        });
    });

    function resetCanvas() {
        setCanvasDim();
        webvs.resetCanvas();
        webvs.start();
    }

    $("#dim-factor").on("change", resetCanvas);

    var resizeTimer;
    $(window).on("resize", function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resetCanvas, 100);
    });
}

$(document).ready(function () {
    initUi();
    dancer = new Dancer();

    webvs = new Webvs({
        canvas: $("#my-canvas").get(0),
        analyser: new Webvs.DancerAdapter(dancer)
    });
    webvs.loadPreset(eval("("+codeMirror.getValue()+")"));
    webvs.start();
});

})();