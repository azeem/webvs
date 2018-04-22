(function() {

var exampleTracks = [
    {
        url: './tracks/mindmapthat_-_Pulse_of_the_Party.mp3',
        title: 'Pulse of the Party',
        attribution: 'Pulse of the Party by Kara Square (c) copyright 2014 Licensed under a Creative Commons Attribution Noncommercial  (3.0) license. http://dig.ccmixter.org/files/mindmapthat/48167 Ft: Vidian'
    },
    {
        url: './tracks/Robbero_-_Butterfly_(Robbero_Mix).mp3',
        title: 'Butterfly (Robbero Mix)',
        attribution: 'Butterfly (Robbero Mix) by Robbero (c) copyright 2013 Licensed under a Creative Commons Attribution Noncommercial  (3.0) license. http://dig.ccmixter.org/files/Robbero/44313'
    },
    {
        url: './tracks/cdk_-_Reuse_Noise_-_With_The_Light_(cdk_Mix).mp3',
        title: 'Reuse Noise - With The Light (cdk Mix)',
        attribution: 'Reuse Noise - With The Light (cdk Mix) by Analog By Nature (c) copyright 2016 Licensed under a Creative Commons Attribution Noncommercial  (3.0) license. http://dig.ccmixter.org/files/cdk/55052 Ft: Reuse Noise'
    },
    {
        url: './tracks/Citizen_X0_-_Dinosaur_Bones_2.mp3',
        title: 'Dinosaur Bones',
        attribution: 'Dinosaur Bones by Abstract Audio (c) copyright 2017 Licensed under a Creative Commons Attribution Noncommercial  (3.0) license. http://dig.ccmixter.org/files/Citizen_X0/56514 Ft: Kara'
    }
];

var examplePresets = [];
var editor;
var webvsMain;

function loadExampleHandler(event, id) {
    var exampleSelect = document.getElementById('example-select');
    if(id === undefined) {
        if(exampleSelect.value === '-1') {
            return;
        }
        id = exampleSelect.value;
    }
    editor.getDoc().setValue(JSON.stringify(examplePresets[id], null, 2));
    exampleSelect.value = '-1';
}

function loadPresetHandler(event) {
    var presetString = editor.getValue();
    var preset;
    try {
        preset = JSON.parse(presetString);
    } catch(e) {
        window.alert('Preset is not valid JSON');
        return;
    }
    webvsMain.loadPreset(preset);
}

function changeTrackHandler(event, id, noAutoPlay) {
    var trackSelect = document.getElementById('track-select');
    if(id === undefined) {
        if(trackSelect.value === '-1') {
            return;
        }
        id = trackSelect.value;
    }
    var track = exampleTracks[id];
    trackSelect.value = -1;

    var audioPlayer = document.getElementById('audio-player');
    audioPlayer.src = track.url;
    if(!noAutoPlay) {
        audioPlayer.play();
    }
    var attributionText = document.getElementById('attribution-text');
    attributionText.innerHTML = track.attribution;
}

function initButtons() {
    var loadExampleBtn = document.getElementById('load-example-btn');
    loadExampleBtn.addEventListener('click', loadExampleHandler);

    var loadPresetBtn = document.getElementById('load-preset-btn');
    loadPresetBtn.addEventListener('click', loadPresetHandler)

    var changeTrackBtn = document.getElementById('change-track-btn');
    changeTrackBtn.addEventListener('click', changeTrackHandler);
}

function initSelects() {
    var exampleSelect = document.getElementById('example-select');
    examplePresets.forEach(function(preset, index) {
        var presetName = preset.name || 'Preset' + examplePresets.length;
        var option = document.createElement('option');
        option.innerHTML = presetName;
        option.setAttribute('value', index);
        exampleSelect.appendChild(option);
    });

    var trackSelect = document.getElementById('track-select');
    exampleTracks.forEach(function(track, index) {
        var option = document.createElement('option');
        option.innerHTML = track.title;
        option.setAttribute('value', index);
        trackSelect.appendChild(option);
    });
}

function initPresetInput() {
    var presetInput = document.getElementById('preset-input');
    editor = CodeMirror.fromTextArea(presetInput, {
        mode: {
            name: "javascript",
            json: true
        },
        lineNumbers: true
    });
}

function initWebvs() {
    var audioPlayer = document.getElementById('audio-player');
    var canvas = document.getElementById('canvas');
    var analyser = new Webvs.WebAudioAnalyser();
    analyser.load(audioPlayer);

    webvsMain = new Webvs.Main({
        canvas: canvas,
        analyser: analyser
    });

    var msgElement = document.getElementById("msg-container");
    msgElement.style.display = "none";
    webvsMain.rsrcMan.on("wait", function() {
        msgElement.style.display = "block";
    });
    webvsMain.rsrcMan.on("ready", function() {
        msgElement.style.display = "none";
    });
}


window.addExamplePreset = function(preset) {
    examplePresets.push(preset);
}

window.initPage = function() {
    initPresetInput();
    initButtons();
    initSelects();
    initWebvs();
    changeTrackHandler(null, 0, true);
    loadExampleHandler(null, 0);
    loadPresetHandler();

    webvsMain.start();
}

})();