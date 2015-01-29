var webvsMain;
window.onload = function () {
    // initialize dancer and webvs
    var clientId = "e818e8c85bb8ec3e90a9bbca23ca5e2a";
    var analyser = new Webvs.WebAudioAnalyser();
    webvsMain = new Webvs.Main({
        canvas: document.getElementById("canvas"),
        analyser: analyser,
        showStat: true,
        resourcePrefix: "/resources/"
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
    var trackUrl = "https://soundcloud.com/kartell/kartell-minimum-move";
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var json = JSON.parse(xhr.responseText);
            analyser.load(json.stream_url + "?client_id=" + clientId).play();
        }
    };
    var apiUrl = "http://api.soundcloud.com/resolve.json?url="+encodeURI(trackUrl)+"&client_id="+clientId
    xhr.open("GET", apiUrl, true);
    xhr.send();
};
