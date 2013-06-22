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
var samplePreset = "{\r\n\tclearFrame: false,\r\n\tcomponents: [\r\n\t\t{\r\n\t\t\ttype: \"EffectList\",\r\n\t\t\toutput: Webvs.ADDITIVE,\r\n\t\t\tcomponents: [\r\n\t\t\t\t{type:\"FadeOut\", speed: 0.4},\r\n\t\t\t\t{\r\n\t\t\t\t\ttype: \"SuperScope\",\r\n\t\t\t\t\tcode: {\r\n\t\t\t\t\t\tinit: \"n=800\",\r\n\t\t\t\t\t\tonBeat: \"t=t+0.3;n=100+rand(900);\",\r\n\t\t\t\t\t\tperFrame: \"t=t-v*0.5\",\r\n\t\t\t\t\t\tperPoint: \"d=D\/n;r=(i-(t*3)); x=(atan(r+d-t)*cos(r+d-t+i)); y=((i+cos(d+v*1.2))-1.5)*1.7;z=-(cos(t+i)+log(v)*cos(r*3))*3;red=cos(r)+1;blue=sin(r);green=sin(i)\/2\"\r\n\t\t\t\t\t}\r\n\t\t\t\t}\r\n\t\t\t]\r\n\t\t},\r\n\t\t{type: \"Convolution\", kernel: \"blur\"},\r\n    {type: \"Convolution\", kernel: \"blur\"},\r\n\t\t{type: \"OnBeatClear\"}\r\n\t]\r\n}";
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