/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function() {

var dancer, webvs;
var clientId = "e818e8c85bb8ec3e90a9bbca23ca5e2a";
var dimensionFactor = 2;
var codeMirror;

//var samplePreset = {
//    clearFrame: true,
//    components: [
//        {
//            type: "SuperScope",
//            dots: false,
//            code: {
//                init: "n=4",
//                perPoint: "x=i;y=i"
//            }
//        },
//        {
//            type: "DynamicMovement",
//            code: {
//                perPixel: "x=x;y=y"
//            }
//        }
//    ]
//};


var samplePreset = {
    "clearFrame": false,
    "components": [
        {
            "type": "EffectList",
            "output": "ADDITIVE",
            "components": [
                {
                    "type": "FadeOut",
                    "speed": 0.4
                },
                {
                    "type": "SuperScope",
                    "code": {
                        "init": "n=800",
                        "onBeat": "t=t+0.3;n=100+rand(900);",
                        "perFrame": "t=t-v*0.5",
                        "perPoint": "d=D/n;r=(i-(t*3)); x=(atan(r+d-t)*cos(r+d-t+i)); y=((i+cos(d+v*1.2))-1.5)*1.7;z=-(cos(t+i)+log(v)*cos(r*3))*3;red=cos(r)+1;blue=sin(r);green=sin(i)/2"
                    }
                },
                {
                    "type": "DynamicMovement",
                    "enabled": true,
                    "code": "rollingGridley",
                    "coord": "RECT"
                },
                {
                    "type": "ChannelShift",
                    "enabled": false,
                    "onBeatRandom": true
                }
            ]
        },
        {
            "type": "Convolution",
            "kernel": "blur"
        },
        {
            "type": "Convolution",
            "kernel": "blur"
        },
        {
            "type": "OnBeatClear"
        }
    ]
};

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
    var canvasDim = {
        width: dimension.width/dimFactor,
        height: dimension.height/dimFactor
    };
    $("#my-canvas").attr(canvasDim).css(dimension);
}

function initEditor() {
    codeMirror = CodeMirror($("#preset-code").get(0), {
        value: JSON.stringify(samplePreset, undefined, 2),
        tabSize: 2
    });
}

function initUi() {
    setCanvasDim();

    initEditor();

    $("#btn-play").on("click", loadScTrack);

    $("#btn-runpreset").on("click", function() {
        webvs.loadPreset(JSON.parse(codeMirror.getValue()));
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
    webvs.loadPreset(samplePreset);

    webvs.start();
});

})();