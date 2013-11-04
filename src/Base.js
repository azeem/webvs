/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(window) {

/**
 * Webvs namespace that contains all classes
 * @alias Webvs
 * @namespace
 */
var Webvs = {};

window.Webvs = Webvs;

/**
 * A wrapper around Object.create to help with class definition
 * @param {function} constructor - constructor function for which the prototype is to be defined
 * @param {function} baseConstructor - base constructor whose prototype will be extended
 * @param {...object} [properties] - additional properties to be added to the prototype
 * @returns {function} the constructor
 */
Webvs.defineClass = function(constructor, baseConstructor) {
    constructor.prototype = Object.create(baseConstructor.prototype);
    constructor.prototype.constructor = constructor; // fix the constructor reference
    constructor.super = baseConstructor.prototype; // add a superclass reference

    // extend mixins and properties
    _.chain(arguments).drop(2).each(function(properties) {
        _.extend(constructor.prototype, properties);
    });

    return constructor;
};

/**
 * An empty function
 */
Webvs.noop = function() {};

/**
 * Checks if an object contains the required properties
 * @param {object} options - object to be checked
 * @param {Array.<string>} - properties to be checked
 */
Webvs.checkRequiredOptions = function(options, requiredOptions) {
    for(var i in requiredOptions) {
        var key =  requiredOptions[i];
        if(!(key in options)) {
            throw new Error("Required option " + key + "not found");
        }
    }
};

/**
 * Returns a floating point value representation of a number
 * embeddable in glsl shader code
 * @param {number} val - value to be converted
 * @returns {string} float represntation
 */
Webvs.glslFloatRepr = function(val) {
    return val + (val%1 === 0?".0":"");
};

/**
 * Parse css color string #RRGGBB or rgb(r, g, b)
 * @param {string} color - color to be parsed
 * @returns {Array.<number>} triple of color values in 0-255 range
 */
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
};

/**
 * 0-1 normalized version of {@link Webvs.parseColor}
 */
Webvs.parseColorNorm = function(color) {
    return _.map(Webvs.parseColor(color), function(value) { return value/255; });
};

/**
 * Pretty prints a shader compilation error
 * @param {string} - shader source code
 * @param {string} - error message from gl.getShaderInfoLog
 */
Webvs.logShaderError = function(src, error) {
    var lines = src.split("\n");
    var ndigits = lines.length.toString().length;

    var errorPos = error.match(/(\d+):(\d+)/);
    if(errorPos) {
        errorPos = [parseInt(errorPos[1], 10), parseInt(errorPos[2], 10)];
    }

    var numberedLines = _.map(lines, function(line, index) {
        var i;
        var number = (index+1) + "";
        for(i = 0;i < (ndigits-number.length);i++) {
            number = "0" + number;
        }

        var errorIndicator = "";
        if(errorPos && errorPos[1] == index+1) {
            var indent = "";
            for(i = 0;i < errorPos[0]+ndigits+2;i++) {
                indent += " ";
            }
            errorIndicator = "\n" + indent + "^\n" + indent + error;
        }
        return number + ": " + line + errorIndicator;
    }).join("\n");

    console.log("Shader Error : \n" + numberedLines);
};


/**
 * @class
 * A simple promise object to notify async init of
 * components
 * @memberof Webvs
 * @constructor
 */
var Promise = function() {
    this.resolved = false;
    this.listeners = [];
};
Webvs.Promise = Webvs.defineClass(Promise, Object, {
    /**
     * resolves the promise object and runs all
     * the callbacks
     * @memberof Webvs.Promise#
     */
    resolve: function() {
        if(!this.resolved) {
            this.resolved = true;
            _.each(this.listeners, function(cb) {
                cb();
            });
        }
    },

    /**
     * register a callback which should be called
     * when the promise resolves
     * @param {function} cb - callback
     * @memberof Webvs.Promise#
     */
    onResolve : function(cb) {
        if(this.resolved) {
            cb();
        } else {
            this.listeners.push(cb);
        }
    }
});

/**
 * Combines several promises into one promise
 * @param {Array.<Webvs.Promise>} promises - promises to be combined
 * @returns {Webvs.Promise}
 */
Webvs.joinPromises = function(promises) {
    var joinedPromise = new Promise();

    if(promises.length === 0) {
        joinedPromise.resolve();
    } else {
        var counter = promises.length;
        var onResolveCb = function() {
            counter--;
            if(counter === 0) {
                joinedPromise.resolve();
            }
        };
        _.each(promises, function(promise) {
            if(promise.resolved) {
                onResolveCb();
            } else {
                promise.onResolve(onResolveCb);
            }
        });
    }

    return joinedPromise;
};

_.flatMap = _.compose(_.flatten, _.map);

/**
 * Blend mode constants
 */
Webvs.blendModes = {
    REPLACE: 1,
    MAXIMUM: 2,
    AVERAGE: 3,
    ADDITIVE: 4,
    SUBTRACTIVE1: 5,
    SUBTRACTIVE2: 6,
    MULTIPLY: 7
};
_.extend(Webvs, Webvs.blendModes);

/**
 * Returns the blendmode constant. Throws an error if its
 * an invalid blend mode
 * @param {string} name - the blend mode in string
 * @returns {number} the code for the blend mode
 */
Webvs.getBlendMode = function(name) {
    var mode = Webvs.blendModes[name];
    if(!mode) {
        throw new Error("Unknown blendMode " + name);
    }
    return mode;
};

/**
 * Returns a random string of given length
 * @param {number} count - the number of characters required
 * @param {string} chars - a string containing the characters 
 *                         from which to choose
 * @returns {string} a random string
 */
Webvs.randString = function(count, chars) {
    var string = [];
    chars = chars || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0;i < count;i++) {
        string.push(chars.charAt(Math.floor(Math.random()*chars.length)));
    }
    return string.join("");
};

/**
 * Clamps a number between two given numbers
 * @param {number} num - number to be clamped
 * @param {number} min - clamp min edge
 * @returns {number} max - clamp max edge
 */
Webvs.clamp = function(num, min, max) {
  return Math.min(Math.max(num, min), max);
};

})(window);
