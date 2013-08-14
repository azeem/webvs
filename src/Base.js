/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(window) {

var Webvs = {};
window.Webvs = Webvs;

Webvs.defineClass = function(constructor, baseConstructor, properties) {
    constructor.prototype = Object.create(baseConstructor.prototype);
    if(properties) {
        _.extend(constructor.prototype, properties);
    };
    return constructor;
}

/**
 * no operation function
 */
Webvs.noop = function() {}

/**
 * checks if an object contains the required properties
 * @param options
 * @param requiredOptions
 */
Webvs.checkRequiredOptions = function(options, requiredOptions) {
    for(var i in requiredOptions) {
        var key =  requiredOptions[i];
        if(!(key in options)) {
            throw new Error("Required option " + key + "not found");
        }
    }
}

/**
 * Simple assert mechanism
 * @param outcome
 * @param message
 */
Webvs.assert = function(outcome, message) {
    if(!assert) {
        throw new Error("Assertion Failed: " + message);
    }
}

/**
 * Checks if given string contains only whitespace
 * @param str
 * @returns {boolean}
 */
Webvs.isWhitespace = function(str) {
    return (typeof str === "string" && str.match(/^(\s*)$/) !== null);
}

Webvs.glslFloatRepr = function(val) {
    return val + (val%1 === 0?".0":"");
}

Webvs.parseColor = function(color) {
    if(_.isArray(color) && color.length == 3) {
        return color;
    }
    if(_.isString(color)) {
        var match;
        color = color.toLowerCase();
        match = color.match(/^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/);
        if(match) {
            return _.chain(match).last(3).map(function(channel) {
                return parseInt(channel, 16);
            }).value();
        }

        match = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
        if(match) {
            return _.chain(match).last(3).map(function(channel) {
                return Math.min(parseInt(channel, 10), 255);
            }).value();
        }
    }
    throw new Error("Invalid Color Format");
}

Webvs.parseColorNorm = function(color) {
    return _.map(parseColor(color), function(value) { return value/255; });
}

Webvs.requestAnimationFrame = (
    window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    function( callback ){
        return window.setTimeout(callback, 1000 / 60);
    }
);

Webvs.cancelAnimationFrame = (
    window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    function(requestId) {
        return window.clearTimeout(requestId);
    }
);

_.flatMap = _.compose(_.flatten, _.map);

/** Webvs constants **/

_.extend(Webvs ,{
    REPLACE: 1,
    MAXIMUM: 2,
    AVERAGE: 3,
    ADDITIVE: 4,
    SUBTRACTIVE1: 5,
    SUBTRACTIVE2: 6
});

})(window);
