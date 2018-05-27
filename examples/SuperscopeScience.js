addExamplePreset({
  "name": "Science of Superscope",
  "description": "Original Author: Marco",
  "clearFrame": false,
  "resources": {
    "uris": {
    }
  },
  "components": [
    {
      "type": "EffectList",
      "code": {
        "init": "",
        "perFrame": ""
      },
      "output": "ADDITIVE",
      "input": "IGNORE",
      "clearFrame": false,
      "enableOnBeat": false,
      "enableOnBeatFor": 1,
      "id": "EffectList_509",
      "enabled": true,
      "components": [
        {
          "type": "FadeOut",
          "speed": 0.4,
          "color": "#000000",
          "id": "FadeOut_493",
          "enabled": true
        },
        {
          "type": "SuperScope",
          "code": {
            "init": "n=800",
            "perFrame": "t=t-v*0.5",
            "onBeat": "t=t+0.3;n=100+rand(900);",
            "perPoint": "d=D\/n;r=(i-(t*3)); x=(atan(r+d-t)*cos(r+d-t+i)); y=((i+cos(d+v*1.2))-1.5)*1.7;z=-(cos(t+i)+log(v)*cos(r*3))*3;red=cos(r)+1;blue=sin(r);green=sin(i)\/2"
          },
          "blendMode": "REPLACE",
          "channel": "CENTER",
          "source": "WAVEFORM",
          "drawMode": "LINES",
          "thickness": 1,
          "clone": 1,
          "colors": [
            "#ffffff"
          ],
          "cycleSpeed": 0.01,
          "id": "SuperScope_409",
          "enabled": true
        }
      ]
    },
    {
      "type": "Convolution",
      "edgeMode": "EXTEND",
      "autoScale": true,
      "scale": 0,
      "kernel": [
        0,
        1,
        0,
        1,
        1,
        1,
        0,
        1,
        0
      ],
      "bias": 0,
      "id": "Blur1",
      "enabled": true
    },
    {
      "type": "ClearScreen",
      "beatCount": 1,
      "color": "#000000",
      "blendMode": "REPLACE",
      "id": "ClearScreen_543",
      "enabled": true
    },
    {
      "type": "Convolution",
      "edgeMode": "EXTEND",
      "autoScale": true,
      "scale": 0,
      "kernel": [
        0,
        1,
        0,
        1,
        1,
        1,
        0,
        1,
        0
      ],
      "bias": 0,
      "id": "Blur2",
      "enabled": true
    }
  ]
});
