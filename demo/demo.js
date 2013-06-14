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
        clearFrame: false,
        components: [
            //new Webvs.Picture("me.png", 100, 150),
            new Webvs.EffectList({
                output: Webvs.MAXIMUM,
                components: [
                    new Webvs.FadeOut({speed: 0.05}),
                    new Webvs.SuperScope({
                        dots: false,
                        spectrum: false,
                        code: (function() {
                            var t = 0;
                            return {
                                n: 1000,
                                onBeat: function() {
                                    t = t+0.2;
                                },
                                perFrame: function() {
                                    t = t-0.3;
                                },
                                perPoint: function() {
                                    var d = 1/this.n;
                                    var r=(this.i-(t*3));
                                    this.x=(Math.atan(r+d-t)*Math.cos(r+d-t+this.i));
                                    this.y=((this.i+Math.cos(d+this.v*1.5))-1.5)*1.7;
                                    //var z=-(Math.cos(t+i)+Math.log(v)*Math.cos(r*3))*3;
                                    //return [x,y];
                                }
                            };
                        }),
                        colors:[
                            [255, 255, 255],
                            [255, 91, 91],
                            [111, 255, 111],
                            [64, 255, 255],
                            [255, 182, 108],
                            [255, 89, 172],
                            [255, 255, 132],
                            [128, 128, 255]
                        ]
                    })
                ]
            }),
            new Webvs.OnBeatClear({blend: true, n:1}),
            new Webvs.Convolution("blur"),
            new Webvs.Convolution("blur")
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