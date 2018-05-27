addExamplePreset({
    "name": "pillow fight (re-feathered)",
    "author": "yiA2 yathosho",
    "date": "2010-11-21T17:59:52.000Z",
    "clearFrame": true,
    "components": [
        {
            "type": "Texer",
            "imageSrc": "avsres_texer_square_sharp_64x64.bmp",
            "resizing": false,
            "wrapAround": false,
            "colorFiltering": true,
            "code": {
                "init": "n=4;pi=acos(-1);xasp=min(h/w,1);yasp=min(w/h,1);s2=sqrt(2);",
                "perFrame": "t=t-0.005;u1=0;u2=0;mi=mi*0.9+mo*0.1;rx=rx+rxo;ry=ry+ryo;rz=rz+rzo;rzo=rzo*0.97;cx=cos(sin(rx));sx=sin(sin(rx));cy=cos(ry);sy=sin(ry);cz=cos(rz);sz=sin(rz);",
                "onBeat": "mo=bnot(mo);rxo=getosc(0.5,0.02,0)/15;ryo=getosc(0.3,0.02,0)/15;rzo=getosc(0.7,0.02,0)/15;",
                "perPoint": "r=i*pi*2-pi/2+t;d=1.8;\r\nu=(i+t*0.15)*10000%10000/10000*4;\r\nxi=if(below(u,1),u*2-1,if(below(u,2),1,if(below(u,3),(1-(u-2))*2-1,-1)));\r\nyi=if(below(u,1),-1,if(below(u,2),(u-1)*2-1,if(below(u,3),1,(1-(u-3))*2-1)));\r\nx1=xi*mi+cos(r)*d*(1-mi);y1=yi*mi+sin(r)*d*(1-mi);z1=0;\r\nx1d=x1*cz-y1*sz;y1d=x1*sz+y1*cz;\r\ny2d=y1d*cx-z1*sx;z2d=y1d*sx+z1*cx;\r\nx3d=x1d*cy-z2d*sy;z3d=x1d*sy+z2d*cy;\r\nzi=1/(z3d+3);\r\nx=if(above(z3d+3,0.1),x3d*zi,x);\r\ny=if(above(z3d+3,0.1),y2d*zi,y);\r\nalpha=if(below(z3d+2.4,0),0,1);\r\nred=alpha;\r\nblue=alpha;\r\ngreen=alpha;\r\nx=x*xasp;\r\ny=y*yasp;"
            }
        },
        {
            "type": "EffectList",
            "clearFrame": false,
            "input": "REPLACE",
            "output": "REPLACE",
            "code": {
                "init": "u=.5;",
                "perFrame": "u=if(beat,-u,u);\r\nuu=.5+u;\r\nenabled=uu;",
            },
            "components": [
                {
                    "type": "DynamicMovement",
                    "noGrid": true,
                    "coord": "CARTESIAN",
                    "code": {
                        "perPixel": "x=-x"
                    }
                }
            ]
        },
        {
            "type": "Texer",
            "imageSrc": "avsres_texer_square_sharp_72x72.bmp",
            "resizing": false,
            "wrapAround": false,
            "colorFiltering": true,
            "code": {
                "init": "n=7;pi=acos(-1);xasp=min(h/w,1);yasp=min(w/h,1);s2=sqrt(2);",
                "perFrame": "t=t-0.005;u1=0;u2=0;mi=mi*0.9+mo*0.1;rx=rx+rxo;ry=ry+ryo;rz=rz+rzo;rzo=rzo*0.97;cx=cos(sin(rx));sx=sin(sin(rx));cy=cos(ry);sy=sin(ry);cz=cos(rz);sz=sin(rz);",
                "onBeat": "mo=bnot(mo);rxo=getosc(0.5,0.02,0)/15;ryo=getosc(0.3,0.02,0)/15;rzo=getosc(0.7,0.02,0)/15;",
                "perPoint": "r=i*pi*2-pi/2+t;d=1.8;\r\nu=(i+t*0.15)*10000%10000/10000*4;\r\nxi=if(below(u,1),u*2-1,if(below(u,2),1,if(below(u,3),(1-(u-2))*2-1,-1)));\r\nyi=if(below(u,1),-1,if(below(u,2),(u-1)*2-1,if(below(u,3),1,(1-(u-3))*2-1)));\r\nx1=xi*mi+cos(r)*d*(1-mi);y1=yi*mi+sin(r)*d*(1-mi);z1=0;\r\nx1d=x1*cz-y1*sz;y1d=x1*sz+y1*cz;\r\ny2d=y1d*cx-z1*sx;z2d=y1d*sx+z1*cx;\r\nx3d=x1d*cy-z2d*sy;z3d=x1d*sy+z2d*cy;\r\nzi=1/(z3d+3);\r\nx=if(above(z3d+3,0.1),x3d*zi,x);\r\ny=if(above(z3d+3,0.1),y2d*zi,y);\r\nalpha=if(below(z3d+2.4,0),0,1);\r\nred=alpha;\r\nblue=alpha;\r\ngreen=alpha;\r\nx=x*xasp;\r\ny=y*yasp;"
            }
        },
        {
            "type": "Texer",
            "imageSrc": "avsres_texer_square_sharp_96x96.bmp",
            "resizing": false,
            "wrapAround": false,
            "colorFiltering": true,
            "code": {
                "init": "n=7;pi=acos(-1);xasp=min(h/w,1);yasp=min(w/h,1);s2=sqrt(2);",
                "perFrame": "t=t+0.005;u1=0;u2=0;mi=mi*0.9+mo*0.1;rx=rx+rxo;ry=ry+ryo;rz=rz+rzo;rzo=rzo*0.97;cx=cos(sin(rx));sx=sin(sin(rx));cy=cos(ry);sy=sin(ry);cz=cos(rz);sz=sin(rz);",
                "onBeat": "mo=bnot(mo);rxo=getosc(0.5,0.02,0)/15;ryo=getosc(0.3,0.02,0)/15;rzo=getosc(0.7,0.02,0)/15;",
                "perPoint": "r=i*pi*2-pi/2+t;d=2;\r\nu=(i+t*0.15)*10000%10000/10000*4;\r\nxi=if(below(u,1),u*2-1,if(below(u,2),1,if(below(u,3),(1-(u-2))*2-1,-1)));\r\nyi=if(below(u,1),-1,if(below(u,2),(u-1)*2-1,if(below(u,3),1,(1-(u-3))*2-1)));\r\nx1=xi*mi+cos(r)*d*(1-mi);y1=yi*mi+sin(r)*d*(1-mi);z1=0;\r\nx1d=x1*cz-y1*sz;y1d=x1*sz+y1*cz;\r\ny2d=y1d*cx-z1*sx;z2d=y1d*sx+z1*cx;\r\nx3d=x1d*cy-z2d*sy;z3d=x1d*sy+z2d*cy;\r\nzi=1/(z3d+3);\r\nx=if(above(z3d+3,0.1),x3d*zi,x);\r\ny=if(above(z3d+3,0.1),y2d*zi,y);\r\nalpha=if(below(z3d+2.4,0),0,1);\r\nred=alpha;\r\nblue=alpha;\r\ngreen=alpha;\r\nx=x*xasp;\r\ny=y*yasp;"
            }
        },
        {
            "type": "EffectList",
            "clearFrame": false,
            "input": "REPLACE",
            "output": "REPLACE",
            "code": {
                "init": "u=.5;",
                "perFrame": "u=if(beat,-u,u);\r\nuu=.5+u;\r\nenabled=uu;",
            },
            "components": [
                {
                    "type": "DynamicMovement",
                    "noGrid": true,
                    "coord": "CARTESIAN",
                    "code": {
                        "perPixel": "y=-y"
                    }
                }
            ]
        },
        {
            "type": "ColorMap",
            "key": "RED",
            "blendMode": "REPLACE",
            "mapCycleMode": "SINGLE",
            "maps": [
                {
                    "enabled": true,
                    "colors": [
                        {"color": "#ffffff", "position": 0},
                        {"color": "#000000", "position": 255}
                    ]
                }
            ]
        },
        {
            "type": "BufferSave",
            "action": "SAVE",
            "bufferId": 1,
            "blendMode": "REPLACE",
        },
        {
            "type": "DynamicMovement",
            "coord": "POLAR",
            "noGrid": true,
            "bFilter": true,
            "code": {
                "perPixel": "r=r+$PI*.25;"
            }
        },
        {
            "type": "EffectList",
            "enabled": true,
            "clearFrame": false,
            "input": "IGNORE",
            "output": "FIFTY_FIFTY",
            "components": [
                {
                    "type": "BufferSave",
                    "action": "RESTORE",
                    "bufferId": 1,
                    "blendMode": "REPLACE",
                },
                {
                    "type": "DynamicMovement",
                    "coord": "CARTESIAN",
                    "noGrid": true,
                    "bFilter": false,
                    "code": {
                        "perPixel": "y=0"
                    }
                }
            ]
        },
        {
            "type": "BufferSave",
            "action": "SAVE",
            "bufferId": 2,
            "blendMode": "REPLACE",
        },
        {
            "type": "DynamicMovement",
            "coord": "POLAR",
            "bFilter": true,
            "code": {
                "perPixel": "r=r+$PI*.75;"
            }
        },
        {
            "type": "BufferSave",
            "action": "RESTORE",
            "bufferId": 2,
            "blendMode": "ADDITIVE"
        },
        {
            "type": "ColorMap",
            "key": "RED",
            "blendMode": "REPLACE",
            "mapCycleMode": "ONBEAT_SEQUENTIAL",
            "maps": [
                {
                    "enabled": true,
                    "colors": [
                        {"color": "#ff3900", "position": 63},
                        {"color": "#000000", "position": 71},
                        {"color": "#000000", "position": 181},
                        {"color": "#ffffff", "position": 191}
                    ]
                },
                {
                    "enabled": true,
                    "colors": [
                        {"color": "#fec501", "position": 63},
                        {"color": "#000000", "position": 71},
                        {"color": "#000000", "position": 181},
                        {"color": "#ffffff", "position": 191}
                    ]
                },
                {
                    "enabled": true,
                    "colors": [
                        {"color": "#75e00a", "position": 63},
                        {"color": "#000000", "position": 71},
                        {"color": "#000000", "position": 181},
                        {"color": "#ffffff", "position": 191}
                    ]
                },
                {
                    "enabled": true,
                    "colors": [
                        {"color": "#00d9d9", "position": 63},
                        {"color": "#000000", "position": 71},
                        {"color": "#000000", "position": 181},
                        {"color": "#ffffff", "position": 191}
                    ]
                },
                {
                    "enabled": true,
                    "colors": [
                        {"color": "#0080c0", "position": 63},
                        {"color": "#000000", "position": 71},
                        {"color": "#000000", "position": 181},
                        {"color": "#ffffff", "position": 191}
                    ]
                },
                {
                    "enabled": true,
                    "colors": [
                        {"color": "#be02fd", "position": 63},
                        {"color": "#000000", "position": 71},
                        {"color": "#000000", "position": 181},
                        {"color": "#ffffff", "position": 191}
                    ]
                },
                {
                    "enabled": true,
                    "colors": [
                        {"color": "#ff0040", "position": 63},
                        {"color": "#000000", "position": 71},
                        {"color": "#000000", "position": 181},
                        {"color": "#ffffff", "position": 191}
                    ]
                }
            ]
        },
        {
            "type": "ColorMap",
            "key": "MAX",
            "blendMode": "MULTIPLY",
            "mapCycleMode": "ONBEAT_SEQUENTIAL",
            "maps": [
                {
                    "enabled": true,
                    "colors": [
                        {"color": "#000000", "position": 0},
                        {"color": "#e0e0c0", "position": 255}
                    ]
                },
                {
                    "enabled": true,
                    "colors": [
                        {"color": "#000000", "position": 0},
                        {"color": "#e0c0e0", "position": 255}
                    ]
                },
                {
                    "enabled": true,
                    "colors": [
                        {"color": "#000000", "position": 0},
                        {"color": "#c0e0e0", "position": 255}
                    ]
                }
            ]
        },
        {
            "type": "DynamicMovement",
            "coord": "CARTESIAN",
            "noGrid": true,
            "code": {
                "perPixel": "x=x-(1/6)"
            }
        }
    ]
});