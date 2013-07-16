(function() {

var tree, rootNode, form;
var contextMenu;
var uiMap;
var nodeIdCounter = 2;
var dancer, webvs;
var currentTrack;
var SCClientId = "e818e8c85bb8ec3e90a9bbca23ca5e2a";

var unknownUi = {
    schema: {
        json: {
            type: "string",
            title: "json",
            default: "{}"
        }
    },
    form: [
        { key: "json", type: "textarea"}
    ]
};

var samplePreset = {
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
                ].join("\n"),
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
                ].join("\n"),
                "onBeat" : [
                    "zmt=rand(100)*.01+.2;",
                    "oxt=rand(200)*.01-1;oyt=rand(200)*.01-1;ozt=rand(200)*.01-1;"
                ].join("\n")
            }
        },
        {
            "type": "SuperScope",
            "clone" : 18,
            "code" : {
                "init" : [
                    "n=90;",
                    "md1=rand(100)*.1;md2=rand(100)*.1;"
                ].join("\n"),
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
                ].join("\n"),
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
                    "blue=if(above(cid, 15), red, red*.5);"
                ].join("\n")
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
            "output": "ADDITIVE",
            "maps": [
                [
                    {color: "#521237", index:43}
                ]
            ]
        }
    ]
};

function addNode() {
    var ui = $(this).data("webvs-ui");
    var data = {
        id: nodeIdCounter++,
        ui: ui,
        label: ui.disp,
        enabled: true,
        clone: 1,
        values: {}
    };
    if(ui.isJson) {
        data.values.json = "{}";
    }
    tree.tree("appendNode", data, rootNode);
    tree.tree("openNode", rootNode);
}

function removeNode(e) {
    var node = tree.tree("getSelectedNode");
    if(node.id === 1) {
        return;
    }
    tree.tree("selectNode", node.parent);
    tree.tree("removeNode", node);
}

function nodeSelect(e) {
    var node = e.node;
    form.empty();
    if(!node) {
        return;
    }
    form.jsonForm({
        schema: node.ui.schema,
        form: node.ui.form || ["*"],
        onSubmitValid: formSubmitValid,
        value: node.values,
        forceDefaults: true
    });
}

function formSubmitValid(values) {
    var selectedNode = tree.tree("getSelectedNode");
    selectedNode.values = values;
    generateAndLoadPreset();
}

function generateJson(node) {
    var json = {};
    if(!node) {
        node = rootNode;
    } else {
        json.type = node.ui.type;
    }

    if(!node.enabled) {
        json.enabled = false;
    }

    if(node.clone > 1) {
        json.clone = node.clone;
    }

    if(node.children && node.children.length > 0) {
        json.components = _.map(node.children, generateJson);
    }

    if(node.ui.isJson) {
        json = _.extend(json, JSON.parse(node.values.json));
    } else {
        json = _.extend(json, node.values);
    }
    
    return json;
}

function generateAndLoadPreset() {
    var preset = generateJson();
    try {
        webvs.loadPreset(preset);
        webvs.start();
        $("#load-status").removeClass("fail");
    } catch(e) {
        $("#load-status").addClass("fail");
        console.log("Error loading preset " + e);
    }
}

function loadPresetJson(preset) {
    nodeIdCounter = 1;
    function makeNode(preset) {
        var ui, label;
        if(preset.type) {
            ui = uiMap[preset.type];
        } else {
            ui = Webvs.ui;
        }

        var node = {
            id: nodeIdCounter++,
            ui: ui,
            enabled: (!_.isBoolean(preset.enabled) || preset.enabled),
            clone: (preset.clone > 1)?preset.clone:1
        };
        node.label = makeNodeLabel(node.enabled, ui.disp, node.clone);

        // add children
        if(preset.components) {
            node.children = _.map(preset.components, makeNode);
        }

        // add remaining preset values
        var values = {};
        _.chain(_.keys(preset)).filter(function(key) {
            return (key != "components" && key != "type" && key != "enabled" && key != "clone");
        }).each(function(key) {
            values[key] = preset[key];
        });

        if(ui.isJson) {
            node.values = {
                json: JSON.stringify(values, undefined, 2)
            };
        } else {
            node.values = values;
        }
        return node;
    }

    var treeData = makeNode(preset);
    tree.tree("loadData", [treeData]);
    rootNode = tree.tree("getNodeById", 1);
    tree.tree("selectNode", rootNode);
    nodeSelect({node: rootNode});
}

function search(e) {
    e.preventDefault();
    var input = $("#search-form input");
    var list = $("#search-result ul");
    var query = input.val();
    SC.get("/tracks", {q: query}, function(tracks) {
        input.val("");
        list.empty();
        _.each(tracks, function(track) {
            var link = $("<a href='#'/>").data("webvs-track", track).text(track.title);
            $("<li/>").append(link).appendTo(list);
        });
    });
}

function queueTrack() {
    var track = $(this).data("webvs-track");
    var list = $("#play-queue ul");
    $("<li/>").data("webvs-track", track).text(track.title).appendTo(list);
}

function loadTrack() {
    $("#play-queue ul li.playing").remove();
    var trackItem = $("#play-queue ul li:first");
    if(trackItem.length === 0) {
        return false;
    }
    currentTrack = trackItem.data("webvs-track");
    trackItem.addClass("playing");
    dancer.pause();
    dancer.load({
        src: currentTrack.stream_url + "?client_id=" + SCClientId
    });
    return true;
}

function playPause() {
    if(currentTrack) {
        if(dancer.isPlaying()) {
            dancer.pause();
            $(this).text("Play");
        } else {
            dancer.play();
            $(this).text("Pause");
        }
    } else {
        if(loadTrack()) {
            var that = this;
            dancer.onceAt(Math.floor(currentTrack.duration/1000), function() {
                currentTrack = null;
                playPause.call(that);
            });
            $(this).text("Pause");
            dancer.play();
        }
    }
}

function skipTrack() {
    dancer.pause();
    loadTrack();
    dancer.play();
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
    $("#webvs-canvas").attr(canvasDim).css(dimension);
}

function resetCanvas() {
    setCanvasDim();
    webvs.resetCanvas();
    webvs.start();
}

function makeNodeLabel(enabled, disp, clone) {
    return (!enabled?"! ":"") + disp + (clone > 1?" x"+clone:"");
}

function toggleEnable() {
    var node = tree.tree("getSelectedNode");
    var newState = !node.enabled;
    tree.tree("updateNode", node, {
        enabled: newState,
        label: makeNodeLabel(newState, node.ui.disp, node.clone)
    });
    generateAndLoadPreset();
}

function setClone() {
    var node = tree.tree("getSelectedNode");
    var clone = prompt("Enter the number of times this component should be cloned", node.clone);
    clone = parseInt(clone, 10);
    clone = _.isNaN(clone)?node.clone:clone;
    tree.tree("updateNode", node, {
        clone: clone,
        label: makeNodeLabel(node.enabled, node.ui.disp, clone)
    });
    generateAndLoadPreset();
}

function isSubClassOf(classA, classB) {
    if(classA.super) {
        if(classA.super.constructor == classB) {
            return true;
        } else {
            return isSubClassOf(classA.super.constructor, classB);
        }
    } else {
        return false;
    }
}

function initUI() {
    uiMap = {};
    // initialize the add effect menu and ui object map
    _.chain(Webvs).pairs().filter(function(pair) {
        return isSubClassOf(pair[1], Webvs.Component);
    }).map(function(pair) { 
        var className = pair[0];
        var componentClass = pair[1];

        var ui = componentClass.ui;
        if(!ui) {
            ui = _.extend({
                type: className,
                disp: className,
                isJson: true
            }, unknownUi);
        }
        ui = _.defaults(ui, {
            leaf: true
        });
        return ui;
    }).each(function(ui) {
        uiMap[ui.type] = ui;
        $("<li><a href='#'>"+ui.disp+"</a></li>").data("webvs-ui", ui).appendTo(".new-button .dropdown-menu");
    });

    //initialize form
    form = $('.form');

    // initialize context menu
    contextMenu = $("#tree-context-menu");

    // initialize main window
    $("#main-window").draggable();

    // initialize the tree
    tree = $(".tree");
    tree.tree({
        dragAndDrop: true,
        onCanMoveTo: function(movedNode, targetNode, position) {
            var targetUi = targetNode.ui;
            return ((position != "inside" || !targetUi.leaf) && (targetNode.id !== 1 || position == "inside"));
        },
        data: []
    });
    tree.bind("tree.contextmenu", function(event) {
        var node = tree.tree("getSelectedNode");
        if(node.id != event.node.id) {
            tree.tree("selectNode", event.node);
        }
        if(node.id === 1) {
            return;
        }

        if(node.enabled) {
            contextMenu.find(".toggle-enable").text("Disable");
        } else {
            contextMenu.find(".toggle-enable").text("Enable");
        }
        contextMenu.show().css({left: event.click_event.pageX, top: event.click_event.pageY});
    });
    $(document).click(function() {
        contextMenu.hide();
    });
    loadPresetJson(samplePreset);

    // set the canvas dimensions
    setCanvasDim();

    // ---- Begin event Bindings ----
    $(".new-button .dropdown-menu li").click(addNode);
    $(".remove-button").click(removeNode);
    tree.bind("tree.select", nodeSelect);
    form.change(function() { form.submit(); }); // submit the form on change so that we get values from jsonform
    $("#dim-factor").on("change", resetCanvas);
    $("#tree-context-menu .toggle-enable").click(toggleEnable);
    $("#tree-context-menu .clone").click(setClone);

    var resizeTimer;
    $(window).on("resize", function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resetCanvas, 100);
    });

    $("#search-form").submit(search);
    $(document).on("click", "#search-result ul li a", queueTrack);
    $("#play-btn").click(playPause);
    $("#skip-btn").click(skipTrack);
}

function loadAndPlayDefaultTrack() {
    SC.get("/tracks/88460121", function(track) {
        var list = $("#play-queue ul");
        $("<li/>").data("webvs-track", track).text(track.title).appendTo(list);
        $("#play-btn").click();
    });
}

$(document).ready(function() {
    initUI();
    SC.initialize({
        client_id:  SCClientId   
    });
    dancer = new Dancer();

    webvs = new Webvs({
        canvas: $("#webvs-canvas").get(0),
        analyser: new Webvs.DancerAdapter(dancer),
        showStat: true
    });
    webvs.loadPreset(samplePreset);
    webvs.start();
    loadAndPlayDefaultTrack();
});

})();
