/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/11/13
 * Time: 2:08 AM
 * To change this template use File | Settings | File Templates.
 */

function extend(C, P, members) {
    var F = function() {};
    F.prototype = P.prototype;
    C.prototype = new F();
    C.super = P.prototype;
    C.prototype.constructor = C;
    if(members) {
        for(var key in members) {
            C.prototype[key] = members[key];
        }
    }
}

function noop() {}

function checkRequiredOptions(options, requiredOptions) {
    for(var i in requiredOptions) {
        var key =  requiredOptions[i];
        if(!(key in options)) {
            throw new Error("Required option " + key + "not found");
        }
    }
}

function isArray(value) {
    return Object.prototype.toString.call( value ) === '[object Array]';
}

function rand(max) {
    return Math.random()*max;
}

var requestAnimationFrame = (
    window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    function( callback ){
        window.setTimeout(callback, 1000 / 60);
    }
);