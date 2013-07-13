// get URL parameters
$.urlParam = function(name){
var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
if (results) return results[1] || 0;
}

// set initial zoom
zoom = $.urlParam('zoom')
if ( $.isNumeric(zoom) ) $('#dim-factor').val(zoom);

// load soundcloud track
sound = $.urlParam('sound')
if (sound) $('#sc-url').val(sound);

// document ready
$(function() {
    // make draggable
    $( ".draggable" ).draggable();

    // panel fader
    var t = null; //timer
    var is_url_focused = false, is_panel_hovered = false;

    function hide_panel(){
        if (t) {
            clearTimeout(t);
        }
        t = setTimeout(function(){
            if (is_url_focused || is_panel_hovered) {
                return;
            }
            $('#panel,#btn-fps-toggle').stop().animate({
                opacity:0
            },5000);
        },5000);
    }

    hide_panel();
    
    function show_panel(){
        $('#panel,#btn-fps-toggle').stop().animate({
            opacity:1
        },200);
    }

    $('#my-canvas').mousemove(function(){
        show_panel();
        hide_panel();
    })
    
    $('#panel').mouseenter(function(){
        is_panel_hovered = true;
        show_panel();
    }).mouseleave(function(){
        is_panel_hovered = false;
        hide_panel();
    });
    $('#sc-url').focus(function(){
        is_url_focused = true;
        show_panel();
    }).blur(function(){
        is_url_focused = false;
        hide_panel();
    });
    $("#btn-fps-toggle").on("click", function () {
        var a = $(this),
            b = $("#stats");
        b.fadeToggle({
            complete: function () {
                b.is(":visible") ? a.text("Hide FPS") : a.text("Show FPS")
            }
        })
    })

    // hide all controls
    controls = $.urlParam('controls')
    if (controls == 'hide') {
        $('#btn-fps-toggle, #panel, #stats').remove();
        //console.log("hidden: all controls");
    }

    // hide fps counter
    fps = $.urlParam('fps')
    if (fps == 'hide') {
        $('#stats').remove();
        //console.log("hidden: FPS counter");
        $('#btn-fps-toggle').remove();
        //console.log("hidden: FPS button");
    }
});