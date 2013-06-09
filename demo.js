/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/9/13
 * Time: 4:27 PM
 * To change this template use File | Settings | File Templates.
 */

function webvsInit(audio) {
    var context = new webkitAudioContext();
    var source = context.createMediaElementSource(audio);
    var analyser = context.createAnalyser();
    source.connect(analyser);
    analyser.connect(context.destination);

    var webvs = new Webvs({
        canvas: document.getElementById("my-canvas"),
        components: [
            new Webvs.DrawImage("me.png", 100, 150),
            new Webvs.SuperScope(analyser, "threeDScopeDish"),
            new Webvs.Convolution("gaussianBlur")
        ]
    });
    webvs.start();
}

function loadAudio(e) {
    e.preventDefault();
    var clientId = "e818e8c85bb8ec3e90a9bbca23ca5e2a";

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
        $("#my-audio").show().attr("src", response.stream_url + "?client_id=" + clientId).on("canplay", function() {
            $("#my-canvas").show();
            webvsInit(this);
        });
    });
    prms.fail(function() {
        alert("Unable to resolve soundcloud track");
    });
}

$(document).ready(function () {

    $("#my-canvas, #my-audio").hide();
    $("#soundcloudurl").on('submit', loadAudio);

});