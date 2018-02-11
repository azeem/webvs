var webvsMain;
var isFF = !!window.sidebar; // check for firefox. http://browserhacks.com/#hack-bc74b0938bafbf5176b9430961353b77
var SMReady = function () {
    // initialize dancer and webvs
    var clientId = "e818e8c85bb8ec3e90a9bbca23ca5e2a";

    var analyser;
    if(isFF) { 
        analyser = new Webvs.SMAnalyser();
    } else {
        analyser = new Webvs.WebAudioAnalyser();
    }

    webvsMain = new Webvs.Main({
        canvas: document.getElementById("canvas"),
        analyser: analyser,
        showStat: true,
        resourcePrefix: "../resources/"
    });
    webvsMain.loadPreset(samplePreset);
    webvsMain.start();

    var msgElement = document.getElementById("msg-container");
    msgElement.style.display = "none";
    webvsMain.rsrcMan.on("wait", function() {
        msgElement.style.display = "block";
    });
    webvsMain.rsrcMan.on("ready", function() {
        msgElement.style.display = "none";
    });

    // load and play the track
    var trackUrl = "https://soundcloud.com/bigsean-1/bounce-back";
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var json = JSON.parse(xhr.responseText);
            if(isFF) {
                analyser.createSound({autoPlay: true, url: json.stream_url + "?client_id=" + clientId}).play();
            } else {
                analyser.load(json.stream_url + "?client_id=" + clientId).play();
            }
        }
    };
    var apiUrl = "http://api.soundcloud.com/resolve.json?url="+encodeURI(trackUrl)+"&client_id="+clientId
    xhr.open("GET", apiUrl, true);
    xhr.send();
};
if(isFF) { 
    soundManager.setup({
        debugMode: false,
        url: "../bower_components/soundmanager2/swf",
        flashVersion: 9,
        preferFlash: true,
        useHighPerformance: true,
        useFastPolling: true,
        onready: SMReady
    });
} else {
    window.addEventListener("load", SMReady);
}

