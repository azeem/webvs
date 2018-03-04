addExamplePreset({
    "name": "dynamic duo - random anja",
    "description": "    // comment \\\\\r\n          \r\n          random anja\r\n                by sander kupers / skupers\r\n                www: skupers.deviantart.com\r\n                email: skupers@softhome.net\r\n                original preset \"anja rand (tm)\" by jan t. sott / yathosho",
    "clearFrame": true,
    "components": [
        {
            "type": "EffectList",
            "clearFrame": false,
            "input": "IGNORE",
            "output": "REPLACE",
            "enableOnBeat": false,
            "enableOnBeatFor": 1,
            "components": [
                {
                    "type": "EffectList",
                    "clearFrame": true,
                    "input": "IGNORE",
                    "output": "REPLACE",
                    "enableOnBeat": true,
                    "enableOnBeatFor": 1,
                    "components": [
                        {
                            "type": "SuperScope",
                            "clone": 41,
                            "code": {
                                "init": "n=2",
                                "perFrame": "t=t-0.05",
                                "onBeat": "",
                                "perPoint": [
                                    "y=i*2-1;x=-1+0.05*cid;",
                                    "red  =select(cid, 1, 1, 1, 1, 0.75, 0.75, 0.75,   0,   0, 0.75, 1, 0.49, 0.49,    0,    0,    0,    0,    0,    0,    0,    0,   0,   0,   0,   0,   0,   0,     0,    0,    0, 1, 1, 1, 1, 1, 0.75, 0.75, 0.75,   0,   0,   0);",
                                    "green=select(cid, 1, 1, 1, 1,  0.9,  0.9,  0.9, 0.5, 0.5,  0.9, 1, 0.54, 0.54,  0.5,  0.5,  0.5,  0.5,  0.5,  0.5,    0,    0, 0.5, 0.5, 0.5, 0.5, 0.5,   0,     0,    0,    0, 1, 1, 1, 1, 1,  0.9,  0.9,  0.9, 0.5, 0.5, 0.5);",
                                    "blue =select(cid, 1, 1, 1, 1, 0.12, 0.12, 0.12,   0,   0, 0.12, 1,  0.2,  0.2, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.62, 0.62,   0,   0,   0,   0,   0, 0.62, 0.62, 0.62, 0.62, 1, 1, 1, 1, 1, 0.12, 0.12, 0.12,   0,   0,   0);",
                                ]
                            },
                            "thickness": 50,
                            "channel": "CENTER",
                            "source": "WAVEFORM",
                            "drawMode": "LINES"
                        },
                    ]
                }
            ]
        },
        {
            "type": "DynamicMovement",
            "code": {
                "init": "",
                "perFrame": "x1=x1+x1r;x1r=x1r*0.9;\r\nxm=sin(x1)*0.3;",
                "onBeat": "x1r=rand(50)/100-0.25;",
                "perPixel": "x=x+xm;"
            },
            "noGrid": true,
            "bFilter": true,
            "coord": "RECT",
            "gridW": 0,
            "gridH": 0,
            "blend": false,
        },
        {
            "type": "DynamicMovement",
            "code": {
                "init": "pi=acos(-1);",
                "perFrame": "x1=if(equal(x1,x1c),x1,x1+x1r);\r\nx2=x2+x2r;x2r=x2r*0.95;\r\ny1=if(equal(y1,y1c),y1,y1+y1r);\r\ny2=y2+y2r;y2r=y2r*0.94;",
                "onBeat": "x1c=rand(314)*0.01;x1r=(x1c-x1)/30;\r\nx2r=rand(60)/100-0.3;\r\ny1c=rand(314)*0.01;y1r=(y1c-y1)/30;\r\ny2r=rand(60)/100-0.3;",
                "perPixel": "dm=(1-sin(x*x1+x2)*cos(y*y1+y2)/2);\r\nd=d*dm;\r\nalpha=4-dm*3;"
            },
            "bFilter": true,
            "coord": "POLAR",
            "gridW": 30,
            "gridH": 30,
            "blend": true,
        },
        {
            "type": "DynamicMovement",
            "code": {
                "init": "",
                "perFrame": "x1=x1+x1r;y1=y1+y1r;x1r=x1r*0.9;y1r=y1r*0.9;\r\nxm=sin(x1)/3;ym=sin(y1)/3;",
                "onBeat": "x1r=rand(50)/100-0.25;y1r=rand(50)/100-0.25;",
                "perPoint": "x=x+xm;y=y+ym;"
            },
            "bFilter": true,
            "coord": "RECT",
            "gridW": 0,
            "gridH": 0,
            "blend": false,
        },
        {
            "type": "DynamicMovement",
            "code": {
                "init": "pi=acos(-1);",
                "perFrame": "x1=if(equal(x1,x1c),x1,x1+x1r);\r\nx2=x2+x2r;x2r=x2r*0.95;\r\ny1=if(equal(y1,y1c),y1,y1+y1r);\r\ny2=y2+y2r;y2r=y2r*0.94;",
                "onBeat": "x1c=rand(314)*0.01;x1r=(x1c-x1)/30;\r\nx2r=rand(60)/100-0.3;\r\ny1c=rand(314)*0.01;y1r=(y1c-y1)/30;\r\ny2r=rand(60)/100-0.3;",
                "perPoint": "dm=(1-sin(x*x1+x2)*cos(y*y1+y2)/2);\r\nd=d*dm;\r\nalpha=4-dm*3;"
            },
            "bFilter": true,
            "coord": "POLAR",
            "gridW": 30,
            "gridH": 30,
            "blend": true,
        },
        {
            "type": "DynamicMovement",
            "code": {
                "init": "",
                "perFrame": "x1=x1+x1r;y1=y1+y1r;x1r=x1r*0.9;y1r=y1r*0.9;\r\nxm=sin(x1)*0.2;ym=sin(y1)*0.2;",
                "onBeat": "x1r=rand(50)/100-0.25;y1r=rand(50)/100-0.25;",
                "perPoint": "x=x+xm;y=y+ym;"
            },
            "bFilter": true,
            "coord": "RECT",
            "gridW": 0,
            "gridH": 0,
            "blend": false,
        }
    ]
});