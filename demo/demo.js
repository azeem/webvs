/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/9/13
 * Time: 4:27 PM
 * To change this template use File | Settings | File Templates.
 */

(function() {

var dancer;
var clientId = "e818e8c85bb8ec3e90a9bbca23ca5e2a";

function webvsInit() {
    var webvs = new Webvs({
        canvas: document.getElementById("my-canvas"),
        analyser: new Webvs.DancerAdapter(dancer),
        components: [
            new Webvs.OnBeatClear({blend: true}),
            new Webvs.Picture("me.png", 100, 150),
            new Webvs.SuperScope("spiralGraphFun"),
            new Webvs.Convolution("gaussianBlur")
        ]
    });
    webvs.start();
}

function loadAudio(e) {
    e.preventDefault();
//    dancer.load({
//        src: "music.mp3"
//    });
//    dancer.play();

    var input = $("#soundcloudurl").find("input[type=text]");
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
        $("#my-canvas").show();
        dancer.load({
            src: response.stream_url + "?client_id=" + clientId
        });
        dancer.play();
    });
    prms.fail(function() {
        alert("Unable to resolve soundcloud track");
    });
}

$(document).ready(function () {
    $("#soundcloudurl").on('submit', loadAudio);
    dancer = new Dancer();
    webvsInit();
});

})();