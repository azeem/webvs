addExamplePreset({
    "name" : "Silk Strings",
    "author" : "Steven Wittens / UnConeD (http://acko.net)",

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
            "clone" : 18,
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
                    "red=(1-sqr(i))*cv;",
                    "green=if(above(cid, 15), red, red*.5);",
                    "blue=if(above(cid, 15), red, red*.3);"
                ]
            }
        },
        {
            "type": "EffectList",
            "input": "REPLACE",
            "output": "ADDITIVE",
            "components":[
                {
                    "type": "Convolution",
                    "scale": 8,
                    "kernel": [
                        0, 0, 1, 0, 0,
                        0, 1, 0, 1, 0,
                        1, 0, 0, 0, 1,
                        0, 1, 0, 1, 0,
                        0, 0, 1, 0, 0
                    ]
                },
                {
                    "type": "Convolution",
                    "scale": 4,
                    "kernel": [
                        0, 0, 0, 1, 0, 0, 0,
                        0, 0, 1, 0, 1, 0, 0,
                        0, 1, 1, 0, 1, 1, 0,
                        1, 0, 0, 0, 0, 0, 1,
                        0, 1, 1, 0, 1, 1, 0,
                        0, 0, 1, 0, 1, 0, 0,
                        0, 0, 0, 1, 0, 0, 0,
                    ]
                }
            ]
        },
        {
            "type": "ColorMap",
            "blendMode": "ADDITIVE",
            "maps": [
                {
                    "enabled": true,
                    "colors": [
                        {color: "rgb(82,18,55)", position:43}
                    ]
                }
            ]
        }
    ]
});