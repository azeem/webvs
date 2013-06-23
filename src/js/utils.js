/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

/**
 * Basic inheritance mechanism
 * @param C
 * @param P
 * @param members
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

/**
 * no operation function
 */
function noop() {}

/**
 * checks if an object contains the required properties
 * @param options
 * @param requiredOptions
 */
function checkRequiredOptions(options, requiredOptions) {
    for(var i in requiredOptions) {
        var key =  requiredOptions[i];
        if(!(key in options)) {
            throw new Error("Required option " + key + "not found");
        }
    }
}

/**
 * checks if parameter is an array or not
 * @param value
 * @returns {boolean}
 */
function isArray(value) {
    return Object.prototype.toString.call( value ) === '[object Array]';
}

/**
 * Simple assert mechanism
 * @param outcome
 * @param message
 */
function assert(outcome, message) {
    if(!assert) {
        throw new Error("Assertion Failed: " + message);
    }
}

/**
 * Checks if given string contains only whitespace
 * @param str
 * @returns {boolean}
 */
function isWhitespace(str) {
    return (typeof str === "string" && str.match(/^(\s*)$/) !== null);
}

var requestAnimationFrame = (
    window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    function( callback ){
        return window.setTimeout(callback, 1000 / 60);
    }
);

var cancelAnimationFrame = (
    window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    function(requestId) {
        return window.clearTimeout(requestId);
    }
);

_.flatMap = _.compose(_.flatten, _.map);
