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
    "name" : "Silk Strings",
    "author" : "Steven Wittens / UnConeD",

    "clearFrame" : true,
    "components" : [
        {
            "type" : "GlobalVar",
            "code" : {
                "init" : [
                    "n=0; /*global*/",
                    "off=.015;sweep=.75;",
                    "zm=1;zmt=1;",
                    "oxt=rand(200)*.01-1;oyt=rand(200)*.01-1;ozt=rand(200)*.01-1;",
                    "ox=oxt;oy=oyt;oz=ozt;vx=ox;vy=oy;vz=oz;",
                    "t=0;",
                ],
                "perFrame" : [
                    "tm=gettime(0);",
                    "dec=dec*.7+(1-pow(.9,(27*(tm-lt))))*.3;",
                    "reg90=dec;",
                    "lt=tm;",

                    "zm=zm*.8+zmt*.2;",
                    "ox=ox+(oxt-ox)*dec;oy=oy+(oyt-oy)*dec;oz=oz+(ozt-oz)*dec;",
                    "ot=.1+zm*invsqrt(sqr(ox)+sqr(oy)+sqr(oz));",
                    "ox=ox*ot;oy=oy*ot;oz=oz*ot;",

                    "vx=vx+(ox-vx)*dec;vy=vy+(oy-vy)*dec;vz=vz+(oz-vz)*dec;",

                    "rz=0;",
                    "rry=atan2(-vx,vz);",
                    "rrx=-atan2(vy,sqrt(sqr(vx)+sqr(vz)));",
                    "ry=if(t,ry+sin(rry-ry)*dec,rry);rx=if(t,rx+sin(rrx-rx)*dec,rrx);",
                    "cx=cos(rx);sx=sin(rx);cy=cos(ry);sy=sin(ry);cz=cos(rz);sz=sin(rz);",

                    "reg41=off;",
                    "reg01=ry;reg02=cos(ry);reg03=sin(ry);",
                    "reg04=rx;reg05=cos(rx);reg06=sin(rx);",
                    "reg10=vx;reg11=vy;reg12=vz;",

                    "reg40=reg40+off;",

                    "reg80=reg80+(reg79-reg80)*sweep;",
                    "reg79=reg79+(reg78-reg79)*sweep;",
                    "reg78=reg78+(reg77-reg78)*sweep;",
                    "reg77=reg77+(reg76-reg77)*sweep;",
                    "reg76=reg76+(reg75-reg76)*sweep;",
                    "reg75=reg75+(reg74-reg75)*sweep;",
                    "reg74=reg74+(reg73-reg74)*sweep;",
                    "reg73=reg73+(reg72-reg73)*sweep;",
                    "reg72=reg72+(reg71-reg72)*sweep;",
                    "reg71=reg71+(reg70-reg71)*sweep;",
                    "reg70=reg70+(b*3-reg70)*sweep;",
                    "t=1;"
                ],
                "onBeat" : [
                    "zmt=rand(100)*.01+.2;",
                    "oxt=rand(200)*.01-1;oyt=rand(200)*.01-1;ozt=rand(200)*.01-1;"
                ]
            }
        },
        {
            "type": "SuperScope",
            "code" : {
                "init" : [
                    "n=90;",
                    "md1=rand(100)*.1;md2=rand(100)*.1;"
                ],
                "perFrame" : [
                    "ox=reg10;oy=reg11;oz=reg12;",
                    "ry=reg01;cy=reg02;sy=reg03;",
                    "rx=reg04;cx=reg05;sx=reg06;",
                    "off=reg41;",
                    "asp=w/h;",

                    "t=reg40;",
                    "pt=t;",

                    "cx=cos(rx);sx=-sin(rx);cy=cos(ry);sy=-sin(ry);cz=cos(rz);sz=-sin(rz);",
                    "j=0;",
                    "dt=1;"
                ],
                "perPoint" : [
                    "lj=j;",
                    "j=i*10;j=j-floor(j);j=(3-2*j)*sqr(j);",
                    "cv=if(below(i,.1),reg70+(reg71-reg70)*j,if(below(i,.2),reg71+(reg72-reg71)*j,if(below(i,.3),reg72+(reg73-reg72)*j,if(below(i,.4),reg73+(reg74-reg73)*j,if(below(i,.5),reg74+(reg75-reg74)*j,if(below(i,.6),reg75+(reg76-reg75)*j,if(below(i,.7),reg76+(reg77-reg76)*j,if(below(i,.8),reg77+(reg78-reg77)*j,if(below(i,.9),reg78+(reg79-reg78)*j,reg79+(reg80-reg79)*j)))))))));",
                    "rd=sqrt(i);",
                    "tth=sin(pt)*cos(pt*1.123+md1)+cos(pt*4.411+md2)+pt*4+sin(pt*.31);",
                    "tph=2*(cos(pt*1.66)+sin(pt*2.32+md2)*cos(pt*3.217-md1))-pt*.081-cos(pt*9.167)*cos(tth);",
                    "ss=sin(tth)*rd;",
                    "px=cos(tph)*ss;py=sin(tph)*ss;pz=cos(tth)*rd;",
                    "pt=pt-off;",

                    "px=px+ox;py=py+oy;pz=pz+oz;",
                    "x1=px*cy-pz*sy;z1=px*sy+pz*cy;",
                    "y2=py*cx-z1*sx;z2=py*sx+z1*cx;",
                    "x3=x1*cz-y2*sz;y3=x1*sz+y2*cz;",
                    "ldt=dt;",
                    "dt=if(above(z2,.01),1/z2,0);",
                    "x=if(dt,x3*dt,x);y=if(dt,y3*dt*asp,y);",
                    "cv=band(dt,ldt)*(.5+cv*5);",
                    "red=(1-sqr(i))*cv;green=red*.5;blue=red*.2;"
                ]
            }
        }
    ]
};

var samplePreset1 = {
    "name" : "Science of Superscope",
    "author" : "Marco",
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
    dancer.load({
        src: "music.mp3"
    });
    dancer.play();

/*    var input = $("#sc-url");
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
    });*/
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
