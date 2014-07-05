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
            throw new Error("Required option " + key + " not found");
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
    promises = _.filter(promises, function(p) {return !_.isUndefined(p);});
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

Webvs.getComponentClass = function(name) {
    var componentClass = Webvs[name];
    if(!componentClass) {
        throw new Error("Unknown Component class " + name);
    }
    return componentClass;
};

})(window);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {


Webvs.Resources = {
  "avsres_texer_circle_edgeonly_11x11.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRFzMzMmZmZAAAA3RMS3wAAADJJREFUeNpiYEIABiBmZGBgYISwGWCCDEyMjBAVjEA2A1w1bjZUOVg9sjko5sMBQIABADQ7AMqivuIkAAAAAElFTkSuQmCC",
  "avsres_texer_circle_edgeonly_13x13.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRFzMzMmZmZZmZmMzMzAAAA2B1dfgAAAEBJREFUeNqEjjkOADAIw0zC/99cegylSy0xWEoA8oYaC5C3mbAz8DSjlVIpqTilUNlMLMzHeq/v7PeeXy6GAAMAu64CDw1fkSIAAAAASUVORK5CYII=",
  "avsres_texer_circle_edgeonly_15x15.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFBJREFUeNpkzksSgDAIA9CEpPe/sqAOFcui0wfDB2sG7lfBUNtMifBjQ/WzKpGm316jLPYwKh3RVqSpbVZds/7vX5jzj/2ZoLzvO+7/xiXAALTBA6Ouba+fAAAAAElFTkSuQmCC",
  "avsres_texer_circle_edgeonly_17x17.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAMAAAAMs7fIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFxJREFUeNp0kAsOwCAIQ0vp7n/lVd0HdSMhJA8oHxyrYQQxU3qJAhH2vAnBnh3RRMhLIkOdBB9VGsEldVAjjEJcDzdXkhvhp46mWT/77Du33HKXG307NX2j2CnAAMleBKfwBkVtAAAAAElFTkSuQmCC",
  "avsres_texer_circle_edgeonly_19x19.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAMAAABFjsb+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGVJREFUeNp0kEsSwCAIQwmE+1+5Rq2V0Waj8yb8YnnK5ksGWRhhEvgxNzQXA+Yvc4tZFR02xoUE2Rl8m+kQ223DKFaXE+stllR19936JbAx4He/9jnuSOrerPeOXFBzueZX9QgwAFJfBdJ99xhkAAAAAElFTkSuQmCC",
  "avsres_texer_circle_edgeonly_21x21.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////mZmZZmZmMzMzAAAAaMN2WAAAAGhJREFUeNp8kVEOwCAIQ2m7+595iNMNguNHfTZNrXZ1Y3snqVLBxkBf6gwgx/LSdYjrRWHcjgyBU23lVCsoLKdC0CSdInMDJkq3GFSJ6qGdtvc9ZOjzlrfZbw+zM6p0duj38BdlbgEGAAcwBZJTbYGGAAAAAElFTkSuQmCC",
  "avsres_texer_circle_edgeonly_23x23.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAMAAADX9CSSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAH9JREFUeNp0kQkORCEIQ0vpv/+VRxATdQQTg49VwPcWbLoeXDSMQx1cBGBm4y5Lcg1P/5amxcfDV7x8GoITvlV0cHJV6IowKPnpHn5Mbrj/ZMkz3y4MGOkvHgUwwx7+bX5CB/bqp+u/+287nzDUeJ3bPNv5177wt69+v7f8BBgAGfMIcKd9I00AAAAASUVORK5CYII=",
  "avsres_texer_circle_edgeonly_25x25.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAIRJREFUeNqMkgsOwCAIQ4vg/a88HIpf3DAx0WeLgshR4JsIUwmWlSS0SBMRAvS0DgZIOhFdur+qxQm5hSFqJA0KQ8mIJlkvXFLpJk9eJuKXEGQhUuxxMCt2VbMRColrgjyXu8XvqW8+1ECnpW4Ya90RjbVu/clbfy49vf2Din/9qkeAAQDCwAoLI+ycrwAAAABJRU5ErkJggg==",
  "avsres_texer_circle_edgeonly_27x27.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAJZJREFUeNqUkkEWxCAIQ0MC979yi9ZWx+qbuhI/IBAQ64P/mESaNDMX2qGPzA04Y1wql57peYikepiaFdGbqAk5FEiYX0ywn+pZApONGUtpQGVzWISlOzIBJ8abaWJK/8J8Yp7/4Mq9jFv/55s6d/29NGj3XHbzTFlGHQrq9GtN+qhfFXSh++nN5b7UdSL5tmdfd/cQYABNewu5klrN+AAAAABJRU5ErkJggg==",
  "avsres_texer_circle_edgeonly_29x29.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAMAAABhTZc9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAItJREFUeNqUk1kWgCAIReFB+99yCppiRcYXh8sgg3RkQvtUBCL6SMHkwrhRdTvA1UkjlWJqOXXSqUNM5VDwoBqhYb3oCg132tTYqQVUO7cqoXVipzo6GOJG6m6rWEKjeKBoFC8UG7F53fzNeb8fs8rnvC5wrHBjv4diuQ38uKuPm/Sc7/f8/6ecAgwABJYNhw9U2psAAAAASUVORK5CYII=",
  "avsres_texer_circle_fade_11x11.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRFzMzMmZmZZmZmMzMzAAAA2B1dfgAAADxJREFUeNpUjAEKADAIAtX2/zfPalvMCE4RsUbwR11xWIpINohMk7lgVucEwM4ls26f0/fK2fn2n7YAAwBgPQFzvSgXTAAAAABJRU5ErkJggg==",
  "avsres_texer_circle_fade_13x13.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRFzMzMmZmZZmZmMzMzAAAA2B1dfgAAAERJREFUeNpsjkEOACEIA0vr/9+so8GY7JZwGAciGm+0OruaRsih9R7bG4UpAgpTkgqLa/pz7x6jNoP5/Ne3pG+5mQIMALpQAgle0ETmAAAAAElFTkSuQmCC",
  "avsres_texer_circle_fade_15x15.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRFzMzMmZmZZmZmMzMzAAAA2B1dfgAAAExJREFUeNp8jgsOwCAIQ0u7+595LZp9NBskhr4XRRzvQp/qvrJugAwiKSoo3rHcAe0dCzWAveQIg+nFRIMPv99f3l/3N9LP/x91CjAAPLECohAfe4oAAAAASUVORK5CYII=",
  "avsres_texer_circle_fade_17x17.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAMAAAAMs7fIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFVJREFUeNp00FsSABAIBdCk9r9lVw/PKR/GmYsgfYtiFhuHbDDBQjqGo2UAs0RWBsDM3VOU0IIgAS3JMwACZUaPTHWObZvl1xf9/D1/77pg/cauIcAAwHAEmYhIcr8AAAAASUVORK5CYII=",
  "avsres_texer_circle_fade_19x19.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAMAAABFjsb+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGZJREFUeNqEkFEOwCAIQ0th97/ytGDUGDf4MHl5NQCes1BvqDe2omIxarLmhLcuF7LcqXaZkNUBB2qsB0mjmZGKo6KJ0kRGacC/d/4nk6qc8DJfruYdxNwjoVAst1ov83G/rV4BBgBA1gW2uByYqgAAAABJRU5ErkJggg==",
  "avsres_texer_circle_fade_21x21.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHRJREFUeNpskQsOwCAIQ/nU+195IjBtFLNseXlpsJPxGqk36mFKsCgGcuJru+jZbpieg8MNaOt42lKmmc7TuNyEgfHnwk1VRFQtk2V0wIJB0bl2u9P2dy7tgGNfo337bnbdbfXg3AN3Rv12iewSlud/+wQYAE5zBvZNzqs9AAAAAElFTkSuQmCC",
  "avsres_texer_circle_fade_23x23.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAMAAADX9CSSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAIVJREFUeNp8UdsWwCAIonD//8sLuhzb2vClUNGDuM5AeseZj5zCoFoIfqX6QcekzYukglwp1+tHVs6EeVc3VIHqU8eo73RxIpa+6SKsBDzWNFqUyk1fIgBm/dKXduM1pC/6r98T+z5/+/cOzqG7P7aB2Z8PP5P/8fD/dUg8jhiHu2fcAgwACrQIXy04M14AAAAASUVORK5CYII=",
  "avsres_texer_circle_fade_25x25.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAJBJREFUeNqEkgEOxCAIBLeA///yAV2U2pqDkBgmCwpinAztbIwXeQISCzfGrsl0A0moME0vSE2mw1JHcitURUU8tFSgwk3ClgoEkb3cnbEXRhWTK0xmOTQAoKHZx1EDjz4fmv99eLcqt/p8vuc8g5pCzE3X3G5Qk9a5in0/Zvu251bHtp/jP5iqBnH8bz8BBgCQIAnf+/2AmQAAAABJRU5ErkJggg==",
  "avsres_texer_circle_fade_27x27.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAJBJREFUeNqkkosOgCAIAFHw/385QZ6mW1uwXOt2QiKMe0B6J31ObEPK6JXFq5+rNwMlZ1SPIRo0F8LCLhkmuKVIYPKWNaPxglg8RwGF6YYMGjTG1lDyGDFMnqMOHAnCiE1bRcd61mnUQ+0Tt3puJsv/z0yzKJ8n3s5zpBEt9HV+Oncqk9/uCx3vy7/7WeIRYAD36Qt49GbsegAAAABJRU5ErkJggg==",
  "avsres_texer_circle_fade_29x29.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAMAAABhTZc9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAKhJREFUeNqMk4EOxCAIQ4t6///LJ0WUKecOs8TsWYqK+NwCYd7Gl9Obtj3God1RoP3nirkEEVYOw4ESrZgL4MquqoWD+qUl7FEsTB20TKxEDLszvKCqSER0wa6lp0KhmmW5bw+mFQAytFTDi2JipTE1vGK6PrXRtwTfuvkeNbvv237XltKzejnnge2GZuL/7nfitDfypot9lbTd1s/tdz+fr+H+Fr4CDACjQw1NQpycYAAAAABJRU5ErkJggg==",
  "avsres_texer_circle_heavyblur_11x11.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAD9JREFUeNpUjUEKwAAMwqza/395usGgOaUiFhu8L6ha9ucWSbluzWAmB2xGMYyviEK1kxzNffpn5+z/nx8BBgBqAgGa8Fyf5gAAAABJRU5ErkJggg==",
  "avsres_texer_circle_heavyblur_13x13.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAElJREFUeNpUzlEOwDAIAlAEd/8rD2qWWZJ+vNBq8ezApyejbolSiIBVRZruApg6nQyYStckEl+1dHXfO2nP1My89h3+f1l5BRgAzBICPcMxk3YAAAAASUVORK5CYII=",
  "avsres_texer_circle_heavyblur_15x15.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFNJREFUeNp0jgEOgDAIA2kp//+yFDRRo02W5XrZIOqZ6KOS0/dyY2ZK6w0kyKnaywgXWk+EM0VYL+NinIzhao9B5uv9z/+eT88vfez3sf8thwADAGPhAvhoFflwAAAAAElFTkSuQmCC",
  "avsres_texer_circle_heavyblur_17x17.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAMAAAAMs7fIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGNJREFUeNpkjwsOwCAIQ1s+97/yiuDiZokmPltQ5F/QiqqofRMdfVU0qXt3M/NGyAHcCAWMBEBaIXnkKCAk1/IogpaC4+F4OJ6YUMWOPjz79Cwes6735P3m61+NlvL1fPQIMABF5QPMTsW/JAAAAABJRU5ErkJggg==",
  "avsres_texer_circle_heavyblur_19x19.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAMAAABFjsb+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAG5JREFUeNp8kAsOwCAIQ1HK/a+8VnTzl9UEk5dKBYtT1ioCEu+XCTlPh2IEVFUBBiNIuRqQIYSKRCin6amQmQl2HzxRg8NHZikyT1+dWE2fL76ffplb5tzr/5Sckyh1mxffvGNVwLG/WPa36RFgAH7aBLr6SJBlAAAAAElFTkSuQmCC",
  "avsres_texer_circle_heavyblur_21x21.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHZJREFUeNp8kUkOwDAIA9n6/y8XYiBLozqHSNORlQI9t1De1mehVpmuG6aIwSaYqqIiMnC5AYWZE1vQgtTY6YBMCAMPF2ZAt9sNmK7L6XorFfbmXxe9dPZGRRe0e3vv59/2Oeg+h/vM8OGYb27CahNzQ3teAQYASCoF2jHW6tkAAAAASUVORK5CYII=",
  "avsres_texer_circle_heavyblur_23x23.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAMAAADX9CSSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAIdJREFUeNqEkQEOgCAMAzsZ//+yWysgKFoSSa5Lhxvqu3Dd3s/EA0jNEE9SUrQ6Fz7iFC8yQBwwZPkpMsDswCalkT2QIcQADDSyBxQTuBkKgtITSqYOrL9iiCNo1Nut3pb60fg3f/Oex/urt/lE0sG/Zbp/zmeep495buffN1aXfW33+9ApwABypgbuKwtKJAAAAABJRU5ErkJggg==",
  "avsres_texer_circle_heavyblur_25x25.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAIhJREFUeNqMkkEOwCAIBLHq/79cYEHUQlI4mDAZbQGaVZCdY+VFuIQICCK1bglsRAwuIgwoUaM/iA5LiRoMmubjFgVoxBlInA0EEscBYiE4G2B0OA4U5o5ed7yzOX/fKb8t/59Z92AmffNez6vX6XzGMR8fts3Uxu0b4psQK7LIZ3uo3LdXgAEAVtwILHZAebUAAAAASUVORK5CYII=",
  "avsres_texer_circle_heavyblur_27x27.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAJ5JREFUeNqUklEOxCAIRNHi/a+8MuNY2K5JFz+a8PpoBWycw9bTy6mMSc9oMaT9wuELyQNiAG4WVmR7BDFMoyXUJuyAYLRmmgFMU144zeZpUZdF5QFEAPOHbOySN1pftIqABeWpJMz3XkL2j5dg+c9VVJdovB/7cjct385LP/uhn64R7SE954cBlfkNrcSlpXi7L+OxgIf9/Ga/4iPAAAyMCYqkIRXhAAAAAElFTkSuQmCC",
  "avsres_texer_circle_heavyblur_29x29.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAMAAABhTZc9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAKtJREFUeNqkk4EOhiAIhE+g93/l8kTA8m//Fqyt9XlHCuJ4C5R3i9zQ67Ot0KkNZMrMBSi6jlTNEiORCnMuCG3AERrmoLJbijRp7XoGptq1hCMmjroO4dnCHKw6IRLTGvwlwoyOuW8UY0dpTe0Cp1b3WnzQ3uoS+4YSv+7XrGorXs4qKsuPcw4sux4dpb+69DfbH9MRw3OfK3vMVWILaH/P83oTtndhE6cAAwClowr9DDgzzQAAAABJRU5ErkJggg==",
  "avsres_texer_circle_sharp_05x05.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAMAAADzjKfhAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////mZmZAAAAWGYFmQAAACRJREFUeNpiYIIABiYmRgZGEM3IwABkMDAxgAASHyYPAQABBgAHOABBTY+pzgAAAABJRU5ErkJggg==",
  "avsres_texer_circle_sharp_07x07.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAMAAADXT/YiAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////zMzMmZmZMzMzAAAAZ/0nswAAAC5JREFUeNpiYIEBBhYWZiZGJmYQi5kBBEAsRjCLEQcLoo4ZrJeRkRGsFwYAAgwAINIAuPbgtiYAAAAASUVORK5CYII=",
  "avsres_texer_circle_sharp_09x09.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////zMzMmZmZZmZmAAAAN54B3AAAADVJREFUeNpczAkKACAIBdG/dP8zpyhlDQgPEbFuiLEol4VMaaNyWG2F2ea3n/fzz/P/tAUYAEOMAQWSiPFFAAAAAElFTkSuQmCC",
  "avsres_texer_circle_sharp_11x11.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////zMzMmZmZZmZmAAAAN54B3AAAAD5JREFUeNqEjkEOACAIw2jm/98soKCe7IGkWchm48biCFAZFpCmJameWSE32viYnr8OSdsV0X+2qJY1U4ABAHYoAUkLe39/AAAAAElFTkSuQmCC",
  "avsres_texer_circle_sharp_13x13.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF////mZmZZmZmAAAAAresaAAAAEBJREFUeNp0zkkOACAIQ9G23v/OIk6I+hcmD+OAcgZfRVDb6A0LM7mxa1awzAymGbHHfj6f77/eXwP9/h+qAgwAkQABM7dkwKkAAAAASUVORK5CYII=",
  "avsres_texer_circle_sharp_15x15.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAMAAAAMs7fIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAE5JREFUeNpsz0EOACEIQ9G24P2vLKMxysBfuHgxChj/sE43UuZXhBV1hDhxi3DTJ443D7EkFsIkDFEStXfqO/WvOk8zc7PX3p3v7qkpwABwFQJmd6nBcQAAAABJRU5ErkJggg==",
  "avsres_texer_circle_sharp_17x17.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAMAAABFjsb+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////mZmZZmZmMzMzAAAAaMN2WAAAAE5JREFUeNqU0EkKADAIA8CE9P9vrkW6WT00F2FQUNHewItIkDpMhMd1mLAjt9U1O81OMhwm3JEZg7EwxHzMxuFqv/SO7N70L+n/QroAAwCoHwI7FE3jEAAAAABJRU5ErkJggg==",
  "avsres_texer_circle_sharp_19x19.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAF9JREFUeNqEkdsKwDAMQjVJ//+X18ug1DrmS+Agkhg0J7yzMiKyDlrEEmvTxNb0Q2DHixZO1aQUykHVOsyQ1JWMFhelpdEprdfn+h38vh+3+R6ks59+5y8YlF+oHgEGABtVA2+mfo+AAAAAAElFTkSuQmCC",
  "avsres_texer_circle_sharp_21x21.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAMAAADX9CSSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGRJREFUeNp80UESwCAIA0BC6P+/XKl2qmKaizOLByV2nWPjjKDDGbE6YT3g7K8+k89nHgMr3AfNaXuYHiiOSLeadB7cm7twHBw/95Wr96j3q//K/ch9yv3LvrJfb/363m/JLcAAQioD8B7goeAAAAAASUVORK5CYII=",
  "avsres_texer_circle_sharp_23x23.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAG9JREFUeNqc0ksOwCAIBFBgpve/civEtkG0n1kZXySKyDaLnCvCzMAshEpEO4aw77vxEtyhHetCyWEIdZBW8BDIGLhoIdqEIuUhKYuFWCn2U/DxBly+Z9GDed+KLuDxf/Kf4tUceEmfHRRTlbMLMADZLwSXKjWh7QAAAABJRU5ErkJggg==",
  "avsres_texer_circle_sharp_25x25.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGxJREFUeNqc0kEKwCAMRNFkMr3/lWuwiK1xhP6V8ChUE7v22TiRyMjV4NZzvI1hc8HJYO8wjF9qyMfC1qIbraobSkMavTRnmtWlYWNoFhuLw3d/Tf2nup96F/meag5yfmruel/Unh32s+gWYACgjwUpw4UENAAAAABJRU5ErkJggg==",
  "avsres_texer_circle_sharp_27x27.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAMAAABhTZc9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHVJREFUeNqk00sOwCAIBFAYpve/cq2NtVY+i87K5IUYBeTIIq+zGQCjp4SMgF+d1n1VlTX6UsoePqqO6lCIF9xKdVXZ1S/txU0lyqUWKlO1pggVPzW/l6nm7y3+Kv/nvEdFf4vZyOeqmslinucuWLApe04BBgAGOAXkYvVLSgAAAABJRU5ErkJggg==",
  "avsres_texer_circle_sharp_29x29.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAMAAAAocOYLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////mZmZZmZmMzMzAAAAaMN2WAAAAHxJREFUeNqsk1EOgCAMQ9fW+59ZUYwQYDXRfpG8rQlbF1uuaN4SCVKacgFxCdDAdcNaop6zx0cBW84YxYfPcC0oXDGXKseC4+Kr9tMg1u2nQSTtxcBzJpwvOBKOH/y//s/Nz87f7c/uf0zfk8BX+bP5tfm39+Pvb65dgAEAGtYFNzjEtiwAAAAASUVORK5CYII=",
  "avsres_texer_circle_slightblur_11x11.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////zMzMZmZmMzMzAAAAms9nLgAAADZJREFUeNpcjAEKACAMAqf2/zfnVtTqYHDKMMYlfEqWiwCodDESB/coR/Xb9Xv/bzvP/mEKMABQiAE3dQjbvgAAAABJRU5ErkJggg==",
  "avsres_texer_circle_slightblur_13x13.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAEVJREFUeNpsjgEKACAIA+e2/v/l0iSCmiAcpyjGHVT3qkMSpSYzAARdpASASrKwI6fjdmA5tqOfvR4N/u7lL75+OZkCDADIhwIzyXdNVgAAAABJRU5ErkJggg==",
  "avsres_texer_circle_slightblur_15x15.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAEdJREFUeNpkzlEOABAMA9A2rftfmTGC9UfepAztDfL0bVuSvW2RIOXlSeQgHJqDZaVBhS3sjEK9P31k/3///7/sV/a/0gUYAFx0Auabx2r/AAAAAElFTkSuQmCC",
  "avsres_texer_circle_slightblur_17x17.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAMAAAAMs7fIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFtJREFUeNps0FEOwCAIA1BKu/tfeSg4HbF+mLwQBezpsbrVRSNbJDricOKsCYAhaNXQLTMpREQJqCHSgiBljX/iJThE13cuf136iZ4Jd1K/uXjOlbOrbWPnFWAARQcDzLWEdigAAAAASUVORK5CYII=",
  "avsres_texer_circle_slightblur_19x19.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAMAAABFjsb+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAF5JREFUeNqM0EsOgCAMBNDOh/tfWUhBBSFxli8tMET5Js7mYns2W6LUOZJIAGRiMwuIFkBOq1NJFTlMgyrqNjzmNL7m6M2uj+eVzb279zXsPeSlL6e+yf7xf1MuAQYAih4Ew+KuFm4AAAAASUVORK5CYII=",
  "avsres_texer_circle_slightblur_21x21.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGlJREFUeNqMkVEOwCAIQ6Ht7n/loUMnyUJW/p4NYLHrS9ZTzSpUIZKidHpJwIF42DR8cDczdzx4ehMODm4vkw1MLoqDQkkJe4X0ng1i4Jg3afWq61t3UL9v+ZvaHGZqHFphdvn+u9AtwAA/GQXQm0vibQAAAABJRU5ErkJggg==",
  "avsres_texer_circle_slightblur_23x23.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAMAAADX9CSSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHFJREFUeNqUkVsOwCAIBBfZ3v/KRajPqk3xbxYmBnCtC9+cK06qP47csKaUtAbBaVAEIhaxccOCKHkCuKTiHLgK0Y5WMZC5du02oBp80Lio9gODqPjnfh79k8g1x/9HkCMp+Lyf7T63+39dDD/vfgswAHaDBu1d9mLxAAAAAElFTkSuQmCC",
  "avsres_texer_circle_slightblur_25x25.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAH5JREFUeNqsklsOgCAMBLvdcv8rWwrIKxgTXT9MGEdhq6RT5AOxZB6a31fHl6nMaCKxrAC0w0pIQOKCshM3/HkpCWTNMd4goyKF44r01PdVImNGgomAbERnB9ocbs6r7xz29nCerYO9N1l6K10jsnZ9nk+ZKfNYf/lD9lwCDABklggtZ0gwagAAAABJRU5ErkJggg==",
  "avsres_texer_circle_slightblur_27x27.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAIZJREFUeNqs0kkOwCAIBVDG+1+5gBNqNE1auvPlqwVBzwWfTUqp7ObrzCwsspoDERLRQGhkgGCfccNiYhlohRYd5inLVOpJKGeNlFc9M3LMiIkQmXtupkDpRrMBJTvndLmK5/S055Tb7vnu/6IviVJfrv0cc8B9Dtf5BZ7mfn0vP77PR4ABABHvCYWSFCwFAAAAAElFTkSuQmCC",
  "avsres_texer_circle_slightblur_29x29.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAMAAABhTZc9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAIxJREFUeNqskssWgCAIRAeY/v+Xy0eJRtSi8Rw314slYMuCXyjLYtlDl7S6eKcHMm2xcQAeSonHuKAIWkQu3F0PKx4uPTzt4dLUwwNrK11dqmKONozl1rk0osKltA1XFxfeZeB+vTf/5vR/t/CtmLwz5x6p65EuPUr727E9zMbLXPWprDPJn6c9yi7AAIATCuHDsdGlAAAAAElFTkSuQmCC",
  "avsres_texer_diamond_blur_11x11.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAADJJREFUeNpcjEkKADAQwmL//+jOJl1ykAgi60CGkF1QhdYq4TTpmHCN6t/fP8+/2QIMACZAAJO40JbHAAAAAElFTkSuQmCC",
  "avsres_texer_diamond_blur_13x13.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////mZmZAAAAWGYFmQAAADxJREFUeNpsztsOADAEA9DW/3/0UM0kmxdOxAXRQSUIwFUCtKCQOGLJqC4Wso6FZ847+b3X3fWZ/zwCDABCOAC5e+On3AAAAABJRU5ErkJggg==",
  "avsres_texer_diamond_blur_15x15.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAAD9JREFUeNp8jkkOACAIxAr/f7RhUTAY50LasKF3iCJIZ4EUbEzBwRAUuqChCZQe6+/4mB/7x331Hb//K0uAAQB6EAEFxsakVQAAAABJRU5ErkJggg==",
  "avsres_texer_diamond_blur_17x17.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAMAAAAMs7fIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAAERJREFUeNps0EkKADAIBME2/390NidRGE9SiBsjI5QgILoEiHgg4kMSBS5R4RANNtFhkakxfcwss4/Z2dxlbi//mQIMAMByAUH5OcOzAAAAAElFTkSuQmCC",
  "avsres_texer_diamond_blur_19x19.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAMAAABFjsb+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAAE9JREFUeNqE0EEOwCAIRNE/3v/Q2ipgkcZZmZcwKrQz2EEom8CRIMdlzGwmLDILmsiXXsS78E4yDSSNPsM/fdW95fsCdftvtZdyf3u6AAMALlMBlY+cAlwAAAAASUVORK5CYII=",
  "avsres_texer_diamond_blur_21x21.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAAFBJREFUeNp00VsOwCAIBdGh+190tQ8RyfBlToiBC9eqyCeJRNeAZDZMZsfFFPyZih9z4Muc+DANJ9NxsPTKvzKDzCu7SQ6SmeQrtyh3uwUYALL9AeGB1TvJAAAAAElFTkSuQmCC",
  "avsres_texer_diamond_blur_23x23.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAMAAADX9CSSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAAFlJREFUeNqUkUEOwCAIBAf+/+hGbRV0ado9mZkEyIrrsJ6GKW4QBBEHQcJLkPEUbPgR7PgWHHgITtwFAjeBo9LmKPwyv7ynvN/Tji/9lH2W/Y8df/435xJgAHLuAkeTxuenAAAAAElFTkSuQmCC",
  "avsres_texer_diamond_blur_25x25.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAAFpJREFUeNp80lkOwCAMA9FJ73/o7q2BaPhDTwhwzBarckMC1UtBEgMkMUIQE/zEDB+xwEus8BAN3EQHF9HCSfRwkJyRe+Rt8h/JQHKTrGU+MlPpgXRn6tsuwABX1wKhOdYCgAAAAABJRU5ErkJggg==",
  "avsres_texer_diamond_blur_27x27.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAAGhJREFUeNqU0kkSwCAIRNHfuf+hM1iKiJCEnfUK2wGOvJgXQpkJHOLJ4WS02pjopdWMDIk0EJeFyyR2jU621JA9PUjIskwyupBky3vTl7zqnOX9Iurre1b/UP6fof7OSzVn5XyudQowAJT0AxfJRoUjAAAAAElFTkSuQmCC",
  "avsres_texer_diamond_blur_29x29.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAMAAABhTZc9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAAGVJREFUeNqE01sOwCAIBdGx+190360IZPwzJ0aFC1tYI26JyOh1QGQWjMyKgUk4MxknpsCfqfBjSnyZGh+mwZvp8GJaPJkeD5azcq+8Wf4rtZI6S4+kv5INyZVkUvIss5DmaBdgAPYxA4E5KSAkAAAAAElFTkSuQmCC",
  "avsres_texer_diamond_blur_31x31.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAMAAAAocOYLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAAHNJREFUeNqkk1kSwCAIxQL3P3TH2kWUpQt/TjL6FETzwi4FybjAJDDjSWDBVmDFRsDBo4CHBwEX3wI+vgQCfApE+BAIcReI8S6Q4CagZNX2z/CD88v85f3VzfDm/cv+lf23Gb7MXzm/5fz3DH/+31qbAAMAzMkECblYfRkAAAAASUVORK5CYII=",
  "avsres_texer_diamond_blur_33x33.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAMAAABgOjJdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAAHZJREFUeNqM1FsOwCAIBdGx+190360ikvHTnBiFi2xhtbhBBLRaNIiECUTCDAIhASMhAwMhBT0hBx1hAX7CCnyEJXgJa/AQCnATKnARSnASanAQcYa4h3iLqIeoqeiL6K3Ih8iYyKnIupgXMXNibsXsJ//HLsAA4WkEgfgz5p0AAAAASUVORK5CYII=",
  "avsres_texer_diamond_blur_35x35.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAMAAAApB0NrAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAAHpJREFUeNqM1FsKwCAMBdHJ/jddsFAqeU0/5XC1JpHYP9ICbAYyIoukiAoNOVAGUZMLUYtLER0qcqANoicfohefIib0y4ExiJkcxCyOIjYUe8qbJPZS5xH/5e7H1ULVS9Td9Y/rVdXPYi7cfLlZVvMu3g33/lQrjwADAOBZAl7XC1IVAAAAAElFTkSuQmCC",
  "avsres_texer_diamond_blur_37x37.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAlCAMAAADyQNAxAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAAHpJREFUeNqM1EkSwCAIBdHO/S+dyqyGoV1Sb6H4ge13MCWgVxAwIvRjhGhlxGhhJGhmZGhipGhk5GhgFOhjVOhllOhh1OhmNOhidOhktOhg9AhlrNP3km+U/ZK9l/8oMyHzJbMqcy9nSM6jnG25J+TOkftL7sKwtAswAFw7Aq3saCL4AAAAAElFTkSuQmCC",
  "avsres_texer_diamond_blur_39x39.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAnCAMAAAC7faEHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAAH5JREFUeNqM1FsOgCAMBdFx/5s2KiqvttNPcgIB2suxFm4NMA52kC1bIXu2QAI2QyI2QUI2QmI2QBLWQzLWQVL2Q3L2QQr2QirWICV7IDW7IYJdEMOQqm3pztXO3le/n/837Wy/6P7zfa+dnTc9vz43tLN5pfPP56522zoFGAAiuwMEpb2Z2wAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-h_blur_11x11.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////mZmZAAAAWGYFmQAAADFJREFUeNpiYEIABiYmRgYQYASzGSAAxGaAASYGRjibEYWNDJDVM8GkGNHYCLsAAgwAF4gASzv1WKQAAAAASUVORK5CYII=",
  "avsres_texer_hexagon-h_blur_13x13.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////ZmZmAAAAqMNvKAAAADNJREFUeNpiYEIGDCAMARAeAwOcy8DECOcxovAYmBiQOChsdD4jmj40M1HtQ3MLEgAIMAAqsgB3GWut/wAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-h_blur_15x15.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////ZmZmAAAAqMNvKAAAADxJREFUeNpkjkkOADAIAof+/9Hd0kaExMMoKgwXu54u67MOQzFQxttAHS8DMnbKjmI/7vf/ka/nN00BBgBEcACRbOy90AAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-h_blur_17x17.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAMAAAAMs7fIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF////mZmZMzMzAAAAUtSKBwAAAEVJREFUeNpsz0kOACAIA8AW//9ncRdoEw9OGgW0HPgxnNgWXuGSV5klF/wZwiB0QZZYQbkro3hH/FXnETPXvcTuMV2AAQCmGAEVkx3qOQAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-h_blur_19x19.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAMAAABFjsb+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////zMzMmZmZMzMzAAAAZ/0nswAAAFJJREFUeNpskEESwCAIAxPi/99caXUqkj1w2MEhBqODHIFNbCf8aDkejp8LnEQ6sThqurqWixBuBDZH69xbd2PGqbyZ1TPbv9kOXFe204tHgAEAYvgCDr34NtgAAAAASUVORK5CYII=",
  "avsres_texer_hexagon-h_blur_21x21.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFpJREFUeNp8kUsWwCAIAwOG+1+5tdpW+TgLF/OCPiIsA/0gfvhZXay+tmGlTSublWH36BO+LTzdarBqICKEJFYKm9+Qv2YxzHoLtzFmD3TzpyaL1vMfClwCDAB+1QMHAeiYNgAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-h_blur_23x23.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAMAAADX9CSSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAF5JREFUeNp80UsSwCAIA9BE4f5Xbms/Fg1k+QaYAeA6KL1hpk03/GOfMzhf74jpj3Nx3r6Wj4bTsedyCqfDoGKgdKaezQm3mTeCqwar9nKx1nDbptR3Tv+S/VHkEGAAI6gDipju9TUAAAAASUVORK5CYII=",
  "avsres_texer_hexagon-h_blur_25x25.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGtJREFUeNqE0lkSwCAIA9CE5f5Xrra2dQHN7xuYiQLPgpOgTy8chL8YxtgnnISvKOZoE6x5RALRKoYoVkRCEUc8UobARLiRfJvHQ6x9QrmbatbUg31s7yZBz9MvbH5u2ifdHdg6srmqS4ABAJwLBBft6HmHAAAAAElFTkSuQmCC",
  "avsres_texer_hexagon-h_blur_27x27.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////mZmZZmZmMzMzAAAAaMN2WAAAAGJJREFUeNqU0lEOgDAIA9AWuP+ZzTSbOKHG/r4QNgDRB99G5DCb4xlPxs14m2GPLcM701gYL3NU8dNYGofVZaMQgS4Ba60XrSb7yXeq/8m5qHnKPcj9qb3Le1F39v92DwEGAPEnBAU1R8MyAAAAAElFTkSuQmCC",
  "avsres_texer_hexagon-h_blur_29x29.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAMAAABhTZc9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHJJREFUeNqc08sSwBAMBdCbh///5VI1LfIwvQubMxlEoETBiSrm6KS8KH91LR3FXWlTvCo7QoaqUQrSRxlWuKvCjt5KjlJTgRepSq5SgV+K0DKXZN/kzPF9k17FfU7eKH7fulpHOpyreCaTef71Uy4BBgDFxwW/xXw0bwAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-h_blur_31x31.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAMAAAAocOYLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHRJREFUeNqc00sOgCAMBNDp7/5XNqBGEdohzvZBCaUg6mDTFWN0dMc3PrhMLm83zLGXy8Ll8dX2q0B3rHO7Jq6nO7J4d0ldmufbWwEEqgSs9Fr5CqPnR1XANu5P+8f6T9+Pvj+bHzp/bH7p/LP/8/t/HgIMAII0BnM6vrcvAAAAAElFTkSuQmCC",
  "avsres_texer_hexagon-h_blur_33x33.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAMAAABgOjJdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAH5JREFUeNqklNsOgDAIQ8vA//9lM3VxFxg19nUnDZcyHJnAE5g1E7IQMhKGVTYQ4hDSEwpP2hHw9RIaENoIQyR7iBIS5SZii8sEfqddxwjLbMVia1FNsLdA+s4wStRB9JLPg5hpvhdit3k+iIwFJvYp68S95DdH3O2f3+EUYADGRQcyhsYHvQAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-h_blur_35x35.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAMAAAApB0NrAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAI1JREFUeNqs1FkOxDAIA1Bj3PtfuVNV3TKBkKr+fiILJFjGwYwh2rA1wn/UGHYMn8bRiz8M+rkbBoaXEaLoNAwNDxOX2QttxhJju3Fk8c3IUmP6GSIPFwijCDY0VjKVtSp7Dnt+9b52h6VepIV8YjaS4bjNqicrHUZhzyffTvf89uItV/6Ez/6fJKsAAwDMgwh6fDjOUwAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-h_blur_37x37.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAlCAMAAADyQNAxAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAJZJREFUeNqslFcOgDAMQ53R+18ZsURps4rw95MTOQOtIqxRilk6UWxQPFKW1WN2UyYEelNiU5CeUnjSjhKXkofyrS4zeCm80kBY7665UxRSdFKx1WEGL9BOO8UpxQ2KXAoqUFSkahVr3bfcTOupJhPCNUdN6q1sTnELAzPubyhqffHSvDSGq3XM5NM3KX6mP39hqE2AAQBTHQlSJyXCqwAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-h_blur_39x39.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAnCAMAAAC7faEHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAJlJREFUeNq01NsKwCAMA9D04v//8sA5dFNrFJbnQ8SiReKC35yij/bOMYp3TodOv25cVwsfh1nezqbOWueYxxungdPqorpSmJ2ETh5niGPFycLJ7VZ1uRDBiNthI5xJnQ0cTBxCOaEdey57j8QU+s6cEzHm7Hx56t67ot8p++7Dq5z8y/lV5LMPLK5b7SE53mvDk+23/XwJMACrUwo5uOd5GAAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-v_blur_11x11.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////mZmZAAAAWGYFmQAAACtJREFUeNpiYAICRkYGEAUiGECAkRHIZmSAAqAkAwKQzEY2B9l8hL0AAQYAE+wAS/7IVhMAAAAASUVORK5CYII=",
  "avsres_texer_hexagon-v_blur_13x13.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////ZmZmAAAAqMNvKAAAAClJREFUeNpiYAIBRgZGMM0AZoMAI4THAAMgHgMC0IiHah+aW5DcCRBgACnyAHW1J+VxAAAAAElFTkSuQmCC",
  "avsres_texer_hexagon-v_blur_15x15.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////ZmZmAAAAqMNvKAAAAC1JREFUeNpiYAIDRgZGCIMBwgMBRiifEcIFCjCC+AzIYBDw0d2H4X4U/wEEGABGUACVPM1hDgAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-v_blur_17x17.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAMAAAAMs7fIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF////mZmZMzMzAAAAUtSKBwAAADlJREFUeNpiYIYAJgYmKIsBTDIygAAjXISJAQaYwCJMjAwIwMgEFGFABYNQBNPNmP7C5nfU8AEIMACnWAEXbes6vQAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-v_blur_19x19.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAMAAABFjsb+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////zMzMmZmZMzMzAAAAZ/0nswAAAENJREFUeNrUkEEOACAIw8bG/98siiRq+IA9kR5IVngiM+3TkYYIeDoaEpVTmWA9gBMXnA4PP7huR7e37dL3ezoPAQYAhhsCD6Ly7YsAAAAASUVORK5CYII=",
  "avsres_texer_hexagon-v_blur_21x21.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAEhJREFUeNpiYIUCFkZGFhiblQFKMzEAARMLiigzAxQwI0SZGRngAGIMA1QzAoCMYWBlwADDXRR7OKCGGQML/vDFFRfo8QYQYAC8BAMJ1nbDYAAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-v_blur_23x23.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAMAAADX9CSSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAEtJREFUeNrkkkkOACAIAwvi/78sGtO49QXOCYaEQwGVhFmwAStD4nH4gklZPS0nGIux0Zeld1x493jwo1f5qDxl/vpe+r7nPzQBBgDTOwOIKQcE3QAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-v_blur_25x25.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////zMzMmZmZMzMzAAAAZ/0nswAAAFBJREFUeNrskkEKACAIBFft/28uDbKyIjo3N3cIwRbJESLxCZ4zChSN5QqPpuXuUBdgwNapmXJ7Jmqw5Jt3I9tbH/5HXZ/zXQ9O3Ql9ywIMACt3A0YGjZUVAAAAAElFTkSuQmCC",
  "avsres_texer_hexagon-v_blur_27x27.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////mZmZZmZmMzMzAAAAaMN2WAAAAFZJREFUeNrskjEOwCAMA524/39zIVUBoyjq0o2bQCd5yeFacPj6xXwSHSaOhgfj7l4TVhyhcDgadmIYOifDzSHnuB9cdYfqfhGY4h97qTsr+0y6vgUYAPYTBAfRjlhtAAAAAElFTkSuQmCC",
  "avsres_texer_hexagon-v_blur_29x29.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAMAAABhTZc9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFpJREFUeNrs08EKgDAMA9Bkjf//y26g2LBpvQrmNh7kshRbTiDsjWwEwFiqho1Qk6rhSpNrEDlnPaw0RYdaqdd3xV1+/Yg+/2/32aiXu6o2Wey5uoXVHe0CDADFxwW/l3doIQAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-v_blur_31x31.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAMAAAAocOYLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFpJREFUeNrs08EOgDAMAlBW6v//srGLJrg13I0c93ob4JAQ1AeoXmHjGZiJ3PmtdbE4oaE4B94ZfDxXrYucHugS5ejz+wfc/b/rj+2f76/vv9+P3d92v6cAAwCFVAZ1pn5rDwAAAABJRU5ErkJggg==",
  "avsres_texer_hexagon-v_blur_33x33.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAMAAABgOjJdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGRJREFUeNrslEEOwCAIBBcX///l1hhjQaU8wDm6k8iBBdVC0L3A5gJAeDS05Q3RraEFk6KrQVjoDJ9/HJgBLH0cHPPhvAYirnGNX6MGO5bd08yuZ/qS6Vyit/MrBtdhdz8eAQYAvkcHLYN6eh0AAAAASUVORK5CYII=",
  "avsres_texer_hexagon-v_blur_35x35.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAMAAAApB0NrAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAG1JREFUeNrs1EsOgCAMBNDph/tfWbQSQwWcxC2zJC8pi05R+riop6eCXihqdGVMELGZ8SZqxEYmxjzRt0niGuidMYzSBiJ9JCm/jWIRDYNlttnmv2H2kNnnU332gusX11Oq79zd4O7P5I4dAgwA3e8IfQnMDlwAAAAASUVORK5CYII=",
  "avsres_texer_hexagon-v_blur_37x37.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAlCAMAAADyQNAxAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHBJREFUeNrslEsOwCAIRIeP979yWdQGUSpJV018O8xLhoUMWkCZNL41hJlhsL5aghvJLSE8jLFwC2HAx3ZLBRMcLR/mEG8pMki6FRdaxJqFDcc61r+s2r83j/Y3VL3H6m0Xe2KK1W/9Ve3CrFcvAQYApMYJWAHfDBcAAAAASUVORK5CYII=",
  "avsres_texer_hexagon-v_blur_39x39.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAnCAMAAAC7faEHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHJJREFUeNrslNkKwCAMBDdH//+XK/TSRs32tTiPMpAgZLAFXMXDI8KLoqCeeIYTm3m3Fczac0FDPRzV+gho9AxdrPUGVkHs8XojX2vi+rEZdnhIWd7y/uex95Hcm/jX++V7wPeF7hXfP76nfJ9Hvd8FGAAvoQo3prTKhgAAAABJRU5ErkJggg==",
  "avsres_texer_square_edgeonly_10x10.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABRJREFUeNpiYMABGMGAEiYWABBgAAgqACVY8tlWAAAAAElFTkSuQmCC",
  "avsres_texer_square_edgeonly_14x14.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABVJREFUeNpiYCAAGOFgMHHxAIAAAwAp1gBleFeanAAAAABJRU5ErkJggg==",
  "avsres_texer_square_edgeonly_18x18.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABVJREFUeNpiYCASMKKAkSxEBAAIMACEQgDF2WDrnAAAAABJRU5ErkJggg==",
  "avsres_texer_square_edgeonly_24x24.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABdJREFUeNpiYKAqYMQAoxJDS4JKACDAAH4XAUVJQUPcAAAAAElFTkSuQmCC",
  "avsres_texer_square_edgeonly_28x28.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABlJREFUeNpiYKAZYMQKRiVHJekhSQMAEGAAAvEB5V3fhAMAAAAASUVORK5CYII=",
  "avsres_texer_square_edgeonly_30x30.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAMAAAAM7l6QAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABpJREFUeNpiYKAxYMQBRqVHpYeTNM0AQIABABoeAkEFz+9bAAAAAElFTkSuQmCC",
  "avsres_texer_square_edgeonly_4x4.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAMAAACeL25MAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABNJREFUeNpiYAADRkYYAQQAAQYAADwABXjplRwAAAAASUVORK5CYII=",
  "avsres_texer_square_edgeonly_6x6.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAMAAADXEh96AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABRJREFUeNpiYIACRiDARYEBQIABAAF6ABEvUEHiAAAAAElFTkSuQmCC",
  "avsres_texer_square_edgeonly_8x8.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAMAAADz0U65AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABRJREFUeNpiYIADRjAglQEFAAEGAAVYACVRaW3xAAAAAElFTkSuQmCC",
  "avsres_texer_square_fade_10x10.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRFzMzMmZmZMzMzAAAAAy961QAAADZJREFUeNpcjFsKAEAIAn3c/86r1ddOJDFIcFDDsETNoknmiiURzu7Z7m+vO8Tm2dLujZ8AAwAldgCsSmic6wAAAABJRU5ErkJggg==",
  "avsres_texer_square_fade_12x12.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAMAAABhq6zVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////mZmZZmZmMzMzAAAAaMN2WAAAAEJJREFUeNpMjQEKADAIAk37/5tn0sYuguSo0B9oBUotBy6yIatQRjGenWJEDA5rcA0T8HbC7pTvusfsVzPmVR8BBgBrXwFbxvd/iwAAAABJRU5ErkJggg==",
  "avsres_texer_square_fade_14x14.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAEZJREFUeNpUjsENADEIw5IA+698pfRocV6WhQRigPDLVuv5VhW2PNWonP5KAOSt6bOCeiqfKiZ9q1rV5Yes48ul4b34BBgACtkCg8EwzzUAAAAASUVORK5CYII=",
  "avsres_texer_square_fade_16x16.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFlJREFUeNpcj1EOwCAIQ1uk97/yAJ1r9ggfmCeh0A8olR9KqOZ1K9vIteJUvZRR8+E1IrjZRv8gCNAMNLQd7NkNjuE7Bjdi+u64vJfa5ZNFk6pbudNa6RFgAL4qA0QnePQWAAAAAElFTkSuQmCC",
  "avsres_texer_square_fade_18x18.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGFJREFUeNp8kFsOwCAIBHks979yWVGLbdPd6MdkQgISr0ggUInxiBZZnBa8B6DltpukLNNZm5a7mWZEtVsqzLZAi+TX4iz5sjj9nFW9rWQZ/svCsU9Zrbk3raPjOE92CTAAx1EEH5yJNZsAAAAASUVORK5CYII=",
  "avsres_texer_square_fade_20x20.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAG1JREFUeNp0kIEKACEIQ6fZ///ybWWcxt2GYOM1IswPYcaMKEMz1F7FlGSMKuWL1MFzmCbprwbvb9LNzTjMCmkwAJbpIp0cpJvEIUtnpn9k65R7p14ktc737YUsPp2jOc5/aj+zOy/nz9/pI8AAM2MFFiLNsf0AAAAASUVORK5CYII=",
  "avsres_texer_square_fade_22x22.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAMAAADzapwJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHBJREFUeNp0kQEOwCAIA6Hq/788YKiA2oZsaS6NARpXkUw/rLF8s4zWn5YsnNK9ZUlOlqIBPpYOpyUB/xNp8BQQusFkPmgySR67mWf6ogWP3Xea793rfZleTt3Bm66b8u66V993vYN216vtWx7zCTAALXEGOL66XjUAAAAASUVORK5CYII=",
  "avsres_texer_square_fade_24x24.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAH1JREFUeNp0kgsOwCAIQ63M+195/NwAsQ3RSF4aA2NdNLiextLgM0veuSFXKnZC7hRKGSGIZrJ2jKAZpTlOTEzAqhLY4gatQGCYcBD+jpqxiSZjE5eMjoBnUMlQN//4nDOCMhEd/lH0ETarv3yCdbLWkWU4N8G3pNuT9QowAKFOB1Q0mviyAAAAAElFTkSuQmCC",
  "avsres_texer_square_fade_28x28.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAI5JREFUeNqskksOgDAIRNtC739lhYJ8deUQEuvLOJEy9ofG3djWge4NumZIz4C18Tj5lEucxKroy+wEWKmYPc4VxXSrc81lLYydcKhJKJpzDqmHucw5RMUJ5EwsZr45G4a/ZeZ/cZllBj7TVZwtdHO3zO7O1NndtW1CbNTMs0VFurctU+fud1qgnlNfAgwA32QJ9883gbkAAAAASUVORK5CYII=",
  "avsres_texer_square_fade_30x30.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAMAAAAM7l6QAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAJdJREFUeNqUklEOBCEIQ0Hh/ldeEHBcrZPdkmY+Xmp1AumryCzXcfxCDdv3JpVIm/pmp5XuSJLdVyqe9tN62xU80ic/0tyY05M/3c1JCaWZUgtfupMzfad1SxtvHXXPw+tm/3fTD93w3ZSD3+08DLuXObvb+Nflo3ubrRvzkR75w0s3GJG553iLa1MV00iHBPjBmOpHgAEA6LcLekUkFm8AAAAASUVORK5CYII=",
  "avsres_texer_square_sharp_04x04.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAMAAADz0U65AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABdJREFUeNpiYIQCBiQGAxAQYqDpAggwAAcIADG1COoqAAAAAElFTkSuQmCC",
  "avsres_texer_square_sharp_06x06.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABhJREFUeNpiYIQDBhQmAxhQwsRiLkCAAQAOLgBB72P4ogAAAABJRU5ErkJggg==",
  "avsres_texer_square_sharp_08x08.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAMAAABhq6zVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABhJREFUeNpiYEQCDGgcBiigNQeHCwACDAAY/ABRf3Q4rAAAAABJRU5ErkJggg==",
  "avsres_texer_square_sharp_10x10.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABhJREFUeNpiYEQBDBhcBjgYTFw8bgYIMAAoMgBh07AWzQAAAABJRU5ErkJggg==",
  "avsres_texer_square_sharp_120x120.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIgAAACICAMAAAALZFNgAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAAG5JREFUeNrs3EENAEAIxMDFv+nzAA+OZKpgFDT1SQEBATkPyVIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBziJMCCAhIsyfAAKriEAGnx17OAAAAAElFTkSuQmCC",
  "avsres_texer_square_sharp_12x12.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABlJREFUeNpiYEQDDFgEGJDAUBcg4FuAAAMAPJAAcRrOmCoAAAAASUVORK5CYII=",
  "avsres_texer_square_sharp_14x14.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABlJREFUeNpiYMQADFiFGFDASBYiIrwAAgwAVtYAgZmRQ6YAAAAASUVORK5CYII=",
  "avsres_texer_square_sharp_16x16.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABtJREFUeNpiYMQCGHAIMqCBUUHKBIkMeYAAAwB3xACRAYiYCAAAAABJRU5ErkJggg==",
  "avsres_texer_square_sharp_18x18.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAMAAADzapwJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABtJREFUeNpiYMQKGHAKM2CAUeHBI0xCXAIEGACgGgChoR6m7AAAAABJRU5ErkJggg==",
  "avsres_texer_square_sharp_20x20.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAABtJREFUeNpiYMQBGPBIMGABoxLDW4LEVAIQYADQmACxn4QSqgAAAABJRU5ErkJggg==",
  "avsres_texer_square_sharp_22x22.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAAB1JREFUeNpiYMQJGPBKMWAFo1KjUuRKkZEOAQIMAAoNAMGF1rJzAAAAAElFTkSuQmCC",
  "avsres_texer_square_sharp_24x24.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAAB1JREFUeNpiYMQDGAhIMuAAo5KjkoNZkswUDxBgAE0bANFrZZefAAAAAElFTkSuQmCC",
  "avsres_texer_square_sharp_28x28.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAACBJREFUeNpiYCQAGIhQwIAHjCoYVTCqYOAUUJi7AQIMAPMvAPGzHM7eAAAAAElFTkSuQmCC",
  "avsres_texer_square_sharp_30x30.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAMAAAANmfvwAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAACBJREFUeNpiYCQIGIhSwoAXjCoZVTKqZGQqoUL5AhBgAFfEAQHQuBiaAAAAAElFTkSuQmCC",
  "avsres_texer_square_sharp_40x40.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAACpJREFUeNpiYCQRMAxSDQxEglENoxpGNYxqGNUwqmFUA/01DPG2BkCAAQCr5ALB4CXM8AAAAABJRU5ErkJggg==",
  "avsres_texer_square_sharp_64x64.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAADtJREFUeNrs2AEJAAAIBLG3f2lDKAiyC7AAl1ouQOAAzDAgEAgEAoFAIBAIBAKBQCAQ+Bf0YIGHYAswAAf+CQGeQjSNAAAAAElFTkSuQmCC",
  "avsres_texer_square_sharp_96x96.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAABwCAMAAADxPgR5AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAAFJJREFUeNrs2kENAEAIBLHFv+lTwBMuJB0DNTCp5QIEAlswwwGBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAm+Bll0g8Bv4BBgAnD8NAR+aA+0AAAAASUVORK5CYII=",
  "avsres_texer_star_blur_11x11.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF////mZmZZmZmAAAAAresaAAAADlJREFUeNpcjMENACEMw1x3/525QOFxfrRWFIUO7stWfA7ntUXQRi5++dX0Hf17pUodz7g1+8MSYAA5MwDcNxXrMwAAAABJRU5ErkJggg==",
  "avsres_texer_star_blur_13x13.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////mZmZZmZmMzMzAAAAaMN2WAAAAERJREFUeNpkjkEOACAIw7rh/9+sQlATd4AshQEjpWpkNX6c0HWGgli0ZIKrWJPH5F7TqJSDfrbyHc4b29VluX9pTQEGAIzuAYXkM56zAAAAAElFTkSuQmCC",
  "avsres_texer_star_blur_15x15.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFJJREFUeNpczwEOwCAIA8CW1v9/eUzR4UgMOWNRMVZFdaxm+DLBbgHQscU05cwg0CtgNtIYbYOe+R2Jmve3yirP295VzpMeztS2vz/U+089AgwAPUkCk8bog30AAAAASUVORK5CYII=",
  "avsres_texer_star_blur_17x17.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAMAAAAMs7fIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA9QTFRF////zMzMmZmZZmZmAAAAN54B3AAAAFlJREFUeNp0j0ESwCAIA0PC/99cLaBop7mI6w4IPMMqkKegixjsJAJKQikoCS6REwxESY647Bj8RDb7sAFGZ3YQsxbxD9Gvo/e5O4LNUrbI+Gpux7b7ziPAAKYiArHifbKoAAAAAElFTkSuQmCC",
  "avsres_texer_star_blur_19x19.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAMAAABFjsb+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGJJREFUeNp8kNEOgFAIQlHo/3+57l2Y2RZP7AzFicPKcrAR9GGBmIwAOFhcLN5sxSoIkRmwIkmBmEocE3Lt40C7Qw3JveypH5ZPZ7F2X7E9pZ020z2zdriX6dcp2f/XdAowAC9VBCTuflU8AAAAAElFTkSuQmCC",
  "avsres_texer_star_blur_21x21.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAG9JREFUeNps0VEOwCAMAlAQvP+V52piu1V+dC+msoh5MnKLsxN0UYJdDcBNuZR/Fd6oqi2GUo4pEDdkyFUHPcLsrHeuGsZtrpPp06Gos2/R0vd69q67BfOnQ8f6Gp6O9Sh3n+jI1HwF8fsWNY8AAwCqzwT87CaLhQAAAABJRU5ErkJggg==",
  "avsres_texer_star_blur_23x23.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAMAAADX9CSSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHdJREFUeNqM0UsSwzAIA1AJqfe/cuO6DqSwqFbM848xeGWi1MjS8OgEJxcADc7L2d1YcXN+nNXtiM3XQoTXIdxSw4AxZd0z8fJ+wt9+2u7TZ32bpX8VV/EoHn94e3b77pRi/t3tjHNfunIip9yuMnHpZ76PvAUYAL2+BgDx+UecAAAAAElFTkSuQmCC",
  "avsres_texer_star_blur_25x25.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAH5JREFUeNqMkkEOwyAQA7228/8vNwqhmAJSfWIZDTIIXBHmgFgLOpBC7YmAlJAKUsKkpDQIH8KVGC0OYomFkaJ0c+RepvCe/xvep3lnlZ8G3Bit22LVaM3F6MQTcd50ItdfzpmcGzQiayFj5rdCJ+yvbyZxOb7GO+XfmfMRYABpMwcWi7RHvgAAAABJRU5ErkJggg==",
  "avsres_texer_star_blur_27x27.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAIxJREFUeNqM0lEOwCAIA9C24P2vvDk1EwfJ+qcvZDBB26Nwwn5weGkEKzMAVhhvY26OHk+NjymzUbYXLnPTNJlPhpuJOEOZOYQqQqtQ/Xsq6OlFOY0+ldKcQRmt+ZTQMgtm7W9d/DMMdvSy23oDhrfYTd5cH+s3HBfOYz6B7xIZgzHs5V373c8jlwADAMW4CEE7JPCrAAAAAElFTkSuQmCC",
  "avsres_texer_star_blur_29x29.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAMAAABhTZc9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAJdJREFUeNqU01EOxCAIBNCBGe9/5a2y7hYDTcqffRlq0WKk8rxEWhF8UIP1KgBq1S61Tmc0h+/qS73WiKYwzmgKh0ruhl3mVDQAaf/n9zIjIfQljJ4136sW167UYexZDe4vqnFPQyX+ZnXoeKHPnXkok/qhXiqt0jiV2e/r6XxXLrYintMQ0jVnVvd0jcd1VYp/4ayPAAMAET8Jje7j7VoAAAAASUVORK5CYII=",
  "avsres_texer_star_blur_31x31.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAMAAAAocOYLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAJtJREFUeNqM01sShSAMA9Akjfvf8hUVH0A7N3/OKdqCYKuD4Zm1B6J0gpUbgAvn7sw90BKp83Bmbpxx4uhZua3bZT/ukIg5VCuDUEXYqgK176vgoz/lfPavlK/5lHGfPyaO7/5oufrxWC//e/24wxx86u/rntxL133KX49LWykX86vr8TI9A6C3p/df1yrebg7Xagt6eT/H/AQYAA1fCyRzHXqbAAAAAElFTkSuQmCC",
  "avsres_texer_star_blur_33x33.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAMAAABgOjJdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAKdJREFUeNqslFEOgzAMQ53Yvf+VB7QragKpJs2f0SN6NRS0XRAHviMEbQgDaoIAWBLHClhFCGdUEBcQliBaIJogWqQlSBbRZBAS3XHHnRoYRLrhOebkUTLqCK1GdHqwANhNVWwYZ1EBjNPqHZh9vAJ3pwlIrf+B0JvGJPhU1kJ4Ivxn4vu+2Wir6tKYdTvZQ2Pqz89P2hLBeNXuwSA8Xfk5wvb/8RFgAKpADKxdlymyAAAAAElFTkSuQmCC",
  "avsres_texer_star_blur_35x35.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAMAAAApB0NrAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAALVJREFUeNqU1FEOxCAIBNAZBu9/5Y3tahZRzPLZvNoB2qLdC+kK70bQ1RC8GQfgF4NetdFjVBo+hpVxvOWF4dfwbIRROhnnNPTVuEtmiGUmvRIiURUpeE36YzH7PZKepzyph0cr0dMfWoXeESDsYEvGDLcnjUGiHdGcNfKu0s7+MpaMJbPJk8ymr9XsJrT29fMKptCIkdmDGmPoaBROXU1odtyTzPJxumboudPNv2ndaVUfAQYASA4OMyOhsowAAAAASUVORK5CYII=",
  "avsres_texer_star_blur_37x37.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAlCAMAAADyQNAxAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAALxJREFUeNqc1FsShSAMA9CkDfvf8r0+wVKBsZ94prZxBGWl0B/ZihK0oADOlQPwqSKSZuim2koTxV1hrPxAcTKkreJkSKbqJ0PICmmzRklWFUx6KsmNyIp2YLw8f1qUBbW9kVO0z8UZOnbkBJ1JcIyuvDhEd6ocoZo9B6j5QokqH5USpU55ovyjskRZ+ZZEfY28WxJhRW57iWFJPIa36/j8BaKyq8+dH5slq2K8HP7OgqKSi1J8vzGT+gkwAHAdD9TLTm6IAAAAAElFTkSuQmCC",
  "avsres_texer_star_blur_39x39.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAnCAMAAAC7faEHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAMxJREFUeNqk1FESgzAIBNBdFu9/5WptY6IEMi2fzhviggbbWiF4xjUnaMkRXHEOwBccd8faCUepdHw7Vs5xlhcO38qdN+eps+Ysc1e7e8Pm3GWGvszkvXPJiFnRdHDMxaDxWUBedpxbQ505VLMzr4pD21xUdGvzU8HanJWzax+av9u4XyXdfnGWHdu5aNEMXJgj+P7+cr4l82MQGI+49M05nzOHk/weGENcXoMVhyDoY6j/F119kMvxeYvuPe/O5MGtvP/TyT0e1UuAAQBl0RGe9mbiLAAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-down_blur_11x11.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF////mZmZZmZmAAAAAresaAAAADVJREFUeNpUykEOADAIAkFl///ntqKJ5WAmYMSKlshmEsyg6x6SZ8rYqg8b17aqtr/rHAEGACCmAMCjP2QQAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-down_blur_13x13.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAADlJREFUeNpsy8kNADAIA0F7+y86FwQixR80GESPrIpFE6JKT1XJEhdbjrufNk2K85V6h/0sI0OAAQA5MwDHvYBBdAAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-down_blur_15x15.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF////zMzMZmZmAAAAVlmT4wAAAENJREFUeNp0zDcCACAIA8CU///ZhgKD2U4S4R4QNYSaBdcCjTnJeDkX2n4L+lh53o4Cfe347FnR/nk+yNWmu2+GAAMAjCgBfkfOHfYAAAAASUVORK5CYII=",
  "avsres_texer_triangle-down_blur_17x17.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAMAAAAMs7fIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFFJREFUeNpczkEOADEIAkBR+f+Xt3Vbq3KcQIJwRiA9EB/iwl4CZQ1ruMUKWEjZgb9oih7JEnjlPvCUs1M+8Vc5EiVlFca5JrbPNSF8SuYTYABuUgMdCDGw+gAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-down_blur_19x19.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAMAAABFjsb+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFlJREFUeNp8zlsOwCAIRFEQ7v63XOuroyadz5OQi3HP3M655WVplIMKVs/38VpsFM3QjNNNMzlMMoVpSGBZfIFl2TOeYiOTqLV/nN2YAbUYATWc2/i1R4ABAEOmBAkgNRRnAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-down_blur_21x21.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGVJREFUeNqEkUkOwDAIA1mc/3+5rQIhLFI5WsAYQ2sqmlWmXkwYVNCSJsq7tzfjo2kRdXsoQHOGMm9+JaFcRWm12yS3+sU3KlQNV3c6eweXzBCoO0k5qJTvQSVVHZV/wfj50CPAAJupBN60TE0wAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-down_blur_23x23.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAMAAADX9CSSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGhJREFUeNqMz0cWgDAIBFDa3P/KakykLmT5H0MhzEVMUzHZ6EaYAgK6R/XC49pYl7dJjNe1ty8vAcbxfKt9Dkk3ultt3x5WK6IjvJTc0hT3vZpR3VK7+woIusOXZtdzY3EIZscPvwQYAKGhBcoSfQ0wAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-down_blur_25x25.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHFJREFUeNqMz1sOACEIQ1EQ7v63PM5TQUyG35PWKuxOVOpT8Y24UIcU6YXVcYoVYJcUfcotVkUuWULKK3m5f0IL0Bjia+SRMKIxC+GTQTwsnuVbrmTxFBnyhJRVmBYnsbE4Se9TarHxfBIaO+GfHAIMAFz8Bs33FuHUAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-down_blur_27x27.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAH5JREFUeNqMklkSwCAIQ1ni/a/cdqpFNqf8vgnGEBr90IkxdcOEloGGNEju91BvZTxetGT6+qyEPP9Q2cH6nxRGFkMpm7lIJVuZBebyRN5oWUvaaAxZZjfSJNvuF4w4phZkvjt/QWYGZyT0RbzMd2k3EpluRlIH5X8/D+wSYAB1IggfSp2Z6QAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-down_blur_29x29.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAMAAABhTZc9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAIhJREFUeNqUk9sOgDAIQyng//+yGrds5bLEvZ4UW6hynZ6cKaR/ED9Ql0tbqM93WzH8dWUNtc9zY2wkqmf7zKulpUm9kY5daS2dm6wsLWo5zX4FToVwI6+k64KaLNF9kyWilubu1EGLiM2xJKVegdKk1oW5gdqeJjcWLA3UWBrbjl//wpHeAgwAVt0JSQU5IrgAAAAASUVORK5CYII=",
  "avsres_texer_triangle-down_blur_31x31.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAMAAAAocOYLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAJBJREFUeNqUk9sOwCAIQxHq///ytsxMhIqZryfFlov0+smJN6leE5Qc0rXAev9fFcDjz7bYXv9bPvJhW33k5xnb1x9s5aN/SrO5/nJzkxvL5ufTmDnHjcvnfJXKJ0fOtu6HpWwrB5P7/bJkLuxfaE3iSNXD/mowFzmSPOy/RXm8j9Vc5uazsfvSv/d34JcAAwDUAAqKgQvHGAAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-down_blur_33x33.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAMAAABgOjJdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAJpJREFUeNqck9sOgDAIQ7nt/39ZjdMJBZbI80mhQGnsivYEU19MtiGMhrSAnHP0InZNqg2gt5eGmG616TH3UTnmd2PWSMydci3xbL0acxGaO/1ejosei9BKYl2fC4lFWObUf5CEmyJhucT3CzWVcH8KywLCwCn8OkenQBiMCXkRlIiJQolIqHeapZJDDyTUOU2TLT+yvyUOAQYAC3oL4967prIAAAAASUVORK5CYII=",
  "avsres_texer_triangle-down_blur_35x35.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAMAAAApB0NrAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAKFJREFUeNq0lEkSgDAIBFnG/3/Z0kQr4AgXzblr0gSIbP2RrxiV7qigZSCbNYgdPg1zOnuJ+Kir0tZZu9cx432sjJlvWAjfjBc3XQy4tmLtlxcxd0/1TXhhWNuQZ8NJox7zo1w4MPYWs86hUuHIgAqneTZ6U2TAY+JeeH5htjsa+s0ZsJi8g5brJgwewmSXLdVN9z0LM8aTMP037Lf/ZxdgAAztDaCOq6VSAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-down_blur_37x37.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAlCAMAAADyQNAxAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAK5JREFUeNq0lEsSwyAMQ/1R7n/lTpvQApbtLFLWb4QQsuW4c+RJSqU/JrhBQQ7rpd6+Wurj3hvIzzfWD9ArCe+kzrystD6oKg38svfyvkEhe4Bi/kcvpb6/rVmgC4Xc+twcy1JYKBRSUwstl5q7mllfKfAU9t5b6AKjwK3vM2TUepg0aj1QzqzHqVXmKlCgUmEDaEiB7glyH6F8T4HvHB01LimPUmx/2X934UuAAQBJeA8htYvzCQAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-down_blur_39x39.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAnCAMAAAC7faEHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAALhJREFUeNqslFEOwzAIQwO497/ytqrdSDAEqcv3kwnGMI7eG11ORufJQIvDOLSB2ft/DUHBpw9ryJ39buUuX3aVcftXt6Jfn7GVu+ahO7l7bgU3zdcqT3wOpPDEc1bL/XKlRROeQ+7JnFMrqnoONCck91bITfuRWBw4ZE2s+6bck8AhlVv21zK5dc95E5Ez5gm7G7LkJOPA5eIdUipH7lX0hHNGqjIO4nNS3EkjcvSe6pO7+2fuJcAAieIQvN9TMbMAAAAASUVORK5CYII=",
  "avsres_texer_triangle-left_blur_11x11.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF////mZmZZmZmAAAAAresaAAAADBJREFUeNpiYIYDBgYog4mRAcYGsSBsJgYGKJuJkQHGZkAAFHEU9ajmoJoPVggQYAA0MQDDiRF35AAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-left_blur_13x13.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAADVJREFUeNpkzkEOACAIA8Et/3+0iRoLlVPnAJTyqHAGC54krJOvwBJD6sq9uBn/vi675xJgAEfTAMaGKkknAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-left_blur_15x15.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF////zMzMZmZmAAAAVlmT4wAAADtJREFUeNpszzESAEAEQ9GfuP+dt6DIsLo3BkFFWUVQEDaELdKtsQ1hi3Ro+st7/uz/3D/5bv7+7wkwALaKAX9/+Uf9AAAAAElFTkSuQmCC",
  "avsres_texer_triangle-left_blur_17x17.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAMAAAAMs7fIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAEdJREFUeNps0NESABAIRNEb+f9fNmSw5K0zFYsmx62hNYhUECkgMgZu8dWw5dQhFVQKr/jXk+zJ7kreMzPYK3+uLHv8TxdgAOH4AxyO+Zj9AAAAAElFTkSuQmCC",
  "avsres_texer_triangle-left_blur_19x19.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAMAAABFjsb+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAEpJREFUeNqE0DkOACAMA8ENCf//MgUUwViCckQuM+VVTIQGiCWIVaA24LZKEDtl3ZocS1ALXnP/bD8/1+7XG/zutbn4/HbOS4ABAAilBAi4U//NAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-left_blur_21x21.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFNJREFUeNqM0VsKgDAMRNHbZLL/LUtBUDsJ2M9D86bOp1XFaQGmCaYC0x1smmAqMNXCNcA0wTXoVO3fIe/UQ31LvmeLVvs9POl/7Xe6xX23S4ABAHC6BODuFDAUAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-left_blur_23x23.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAMAAADX9CSSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFlJREFUeNqM0kEKwDAIRNFv1ftfuZSmIDIDdfkIxoyhRVU0ggOEJwjPQHi9urwuEJ6B8GLW56PF9KXHE5QH2t1529/PY+fvdc2ffGyePn+/r/Ma6c9/uAUYAFEHBcuwswX6AAAAAElFTkSuQmCC",
  "avsres_texer_triangle-left_blur_25x25.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGNJREFUeNqU0lcKADEIRdFryf63PA2ChKcwfnoIlsiSkbaQYCAlQMqbF5KGlHSQEiCl5qvsAqcc+S0BUsLQ4tDI8u7N3VdXR/Rc54lunmEHT3gr/a6H/ymt/LqD6Xa+e7sEGAC3SwbKIyRtGgAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-left_blur_27x27.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGVJREFUeNp80kEOwCAIRNGP4v2v3JjUtCozbl8gIMOoX8YY1NJAWA+E5ZTSZjthS25LEJYNZR2EHfKzvd1mtyzroCzQ5upGXfrNGdrcfsUix3+GNncHfz9/d5sXnzOfzzfXjwADABdxCB7IZZ5AAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-left_blur_29x29.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAMAAABhTZc9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGlJREFUeNqc00EOwCAIBdFB8P5Xbpq0cdGOpHX7IhH8MO1UzInZANUE1QLVs6jqbW+aoFqB6wDTSlDNQLWetjRBNQNXsfvu2Oqa7J83N/12s2rm/Cz/7X+7bHS5Wt17nmOn+1249ugQYADl3AlJiv5AfQAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-left_blur_31x31.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAMAAAAocOYLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHFJREFUeNqc01sKwCAMRNFrovvfcrG0SMXMQPN7ID4yYdTV2xjUGiA8Qfitpc/Wwl89e4LwbCgPqL0nCP+23r1zqOWB8gThHZQH2svu6/wwvib29/3na2z/H9pnYrXb+dv8+Pz5/Nr8+/3x+/fs7yXAAJ8LCo5UtKMpAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-left_blur_33x33.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAMAAABgOjJdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAH9JREFUeNqc1EkSgDAIRNFPCPe/skNpOWETdduvHDogoa5uEai8gRQOUqy5EN3QYs/fhIMU5zwT3ZBiaUAKBymS/CKeD7iJPD+EgxRuaNGgENGqe8zfUb1HUnbah1Wi7vSlts9nOzAf8Wj435yOzPrIviymFPXejuz+9v+YBBgAOKUL4WFyzEMAAAAASUVORK5CYII=",
  "avsres_texer_triangle-left_blur_35x35.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAMAAAApB0NrAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAIFJREFUeNqc1MsSgCAIheE/oPd/5VpU00U5Z3Lh6htREFjbVbFvtCRAmARhckGZgN5UgjBHmMbUTUxMgjCxIEy9xcdUgDAJwgzCvMwwzNNMxWUSlAm0cc6x7tO8/JmfNIyTZ69eVt29/zMI+Ps/W33h9ZfVp2a/W3PDmz/nHNsEGADFqg2j4fUjIgAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-left_blur_37x37.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAlCAMAAADyQNAxAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAIpJREFUeNqk1EEOgCAMRNFPW+9/ZV1oggrMJLBg9QK0wHCIUXFNCBQgVYJU2dAqQKlKkOrebKmKfkxUoFWCVAVSVaDVyHxVglTV0GpqOpUgVTa0CjDUEc5ak2YOaiynxmUJr96X03v3HmfHG7yvtNRg2413/zve3n90/7aZE3bmmPnlZuGTq6cAAwDgIg8oujZG9AAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-left_blur_39x39.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAnCAMAAAC7faEHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAI5JREFUeNqs1FkKAkEMANHK0ve/ssyAqMySQu3vRydkY82vYy1mlSBcgXC7Gt0WUrinuncFwlVgXMLsukC4z5BXrjl5R5cYVyBcg3AdGJcwuy4QrgLjEvjnfzq/99Ed61eufjddO/Y3pbtK8/v50/Ps9+Nkxn7eX30P/H3x9+qVprmn4dxeTeO2NNd6CDAAWFAQvxud2RIAAAAASUVORK5CYII=",
  "avsres_texer_triangle-right_blur_11x11.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF////mZmZZmZmAAAAAresaAAAAC1JREFUeNpiYGCGAwYGBkYmBBvIQ2JDeQwwDhOCDQTYxJmwmINkPhPcXoAAAwAw/gDCb3ipVQAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-right_blur_13x13.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAADVJREFUeNpiYGJkQgAGJgYGRhQeAwMqj4GREZkHVQ7ngZUj8YDSSDxGHPpQzMTlFmR3AgQYAEYnAMcaNxF4AAAAAElFTkSuQmCC",
  "avsres_texer_triangle-right_blur_15x15.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF////zMzMZmZmAAAAVlmT4wAAADxJREFUeNp8z0sOADAEBND53P/OlSZaLNg9MQFMuRQMcBjQ8O+kM/QcI+q+oeYIVVNLntt+Lff3/44AAwCwhAF9Tq0fAgAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-right_blur_17x17.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAMAAAAMs7fIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAEVJREFUeNqEkEEOACAIwyrC/78sJkbDOMix2RiDGB5lCKhsE5iNgDXyrJekzJUcayEZ4UpSpprPHs3Se4Z9eml3/c8SYADVKAMbms69hQAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-right_blur_19x19.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAMAAABFjsb+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAEpJREFUeNqM0FkKACAIBNBJ8/5XzigkF0g/HzIukDElFASgwgAuDC7gmgsw04CZzQJeUy3sbBBtt/77Rmdu3o8693Ljf/nPS4ABAPYlBAn8l09YAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-right_blur_21x21.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFBJREFUeNqMkUkOACAIxEaB/39ZDhqD9gDh1EwaFkUMj7eUrelEJUOqqjm0ai5NjvTqKz36h27NR1PjRDNO2aYXZ7DmbngHb96XfgF/WwIMAFzIBN4hKFw9AAAAAElFTkSuQmCC",
  "avsres_texer_triangle-right_blur_23x23.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAMAAADX9CSSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFZJREFUeNqU0tEOACAEBdCL/P8v19ZqxfWgx6MhgstwcuCAFg5Y4TlyHKHM9VVmcP+Sff5Egt9k0c9rsu9kzCGd+9rph/Yv1phPMU9r7Evofvl/mAIMACs5BcceX50IAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-right_blur_25x25.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFxJREFUeNqU0kEOwCAIRNFB4P5XrjHRppW/wO2LDgJKiyyPUjIUyVEq26Ir7og0gmQayifuJzIneUu5ZT4ZJLJBsqqs7zjlUG30n2j2wJu9pvmYN/eAdof27RFgAIc/BsoQFi1gAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-right_blur_27x27.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGVJREFUeNqc0lEKwDAIA9BU4/2vPMdgrLNxrKV/D5XWIGIw1gd5YdSG4dpSqS0bN1b1aQAbm8e+bGpcDPDG7sYrS23saqzsLP1fZ3KeceN9Lv/FuLEHvb8aqO+8NDnT+ZS5PgQYAOftCB9Z/ZA2AAAAAElFTkSuQmCC",
  "avsres_texer_triangle-right_blur_29x29.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAMAAABhTZc9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGlJREFUeNqc0+EKwCAIRtHPtPd/5QljNFxeRtG/Q6KmmtNidkd5NYJU5qTpQboPvzQdVXLUml7REv6jGT5IX+F3uqrf61N9p3d1vcpAjd465XxaL/WK+lxG5P//jtO5opn0w12APboEGACweQlLyyqFHQAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-right_blur_31x31.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAMAAAAocOYLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHJJREFUeNqkk9sOwCAIQ4vA///yXJZdRKnJML4dtLUC3MU8X+gbzTgHdMMB2/BE5OW9YsNXNkY+V0SOkMbEg9EFH0SW/FOR8Eck43caOb9EGD+v+H9eK/6NvV94fkrzb/R/RQv90yr9a4X54fNH5/cQYABItgqMdCB2qwAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-right_blur_33x33.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAMAAABgOjJdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHdJREFUeNqk1EESABEMRNGWxP2vPKnZGEP8BWX5ihZCvbfop6GcsiAhOQopUKiKM0QaFPs4s9iZv1jjLGKpzkakQTHFKcQnTiWGqUVuFSTUjMR7qvMaTjkgqcFpjeoRUFO/vFt6H80v32m77Re/7Fvqffg/HgEGAN35C+K0dSc4AAAAAElFTkSuQmCC",
  "avsres_texer_triangle-right_blur_35x35.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAMAAAApB0NrAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAIFJREFUeNqs1EsOgCAMBNChn/tfWYhRMUCnCZi4e2EKpcDdxTz80H5IwgCaMCjKTRDYmRpo3CwC/6Yq42a2w9GgCDdD4NTUczBufmUtTacC85YVmac9sbkDmWlL7a/D6xG6r68hG+fM+8X7nrg/euA+J+aCz1c5Me964P1h79glwABoLg2kwhFbRQAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-right_blur_37x37.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAlCAMAAADyQNAxAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAIZJREFUeNqs1DsSgDAIBFCE5f5XNmphPoRsgTN2b4SsBHF3hR8eeV5RSokYpeQyRqVlO9XKglHbsqNqDoyK21tV5CK1pherub2Nmspu1ZBeorr0MvW3l6vWHhj1lT2q97Q13zLmjExeYLIv+o/KzASKZpWaexTdR+Zua9XOsaJdeN6rtwADAGlIDyg3spAzAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-right_blur_39x39.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAnCAMAAAC7faEHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAI1JREFUeNqs1EkOgDAIBVAK9P5XlkSjtWX4C4zLFxlsP83JOuuH7CVRzNEQzJlUzBHlbX7OJOhsINDFA20ubPNwwTYd5xb3nDdQ4I42I7dvM3b/4plbB0rd0mbh3m2W7ileu3vytu9h/TG2P238H9J5XrTxPGP3gzvvrzTmC5hXWP5hecpQPg8k7y8BBgDCHBC/cir4BgAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-up_blur_11x11.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF////mZmZZmZmAAAAAresaAAAADVJREFUeNpcyQsKACAIBNHZ9f53ztI+NKA8lLjxb+NjYNtpt6EeOVrWtKmcVlvBPvMoGwIMAELeAMDn8wgGAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-up_blur_13x13.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////zMzMAAAACAUj9gAAADhJREFUeNpkzjkOADAIxEAv/390OJQAipvVNAhsRo2W1gAtuXQVKH4qJMkTVUhPctEZGhLrzyPAAFUDAMa9GvDbAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-up_blur_15x15.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF////zMzMZmZmAAAAVlmT4wAAAEVJREFUeNpcz1sOwDAIA8G1e/87Rw1OA/UPGvGQ4JkhVdPG3QZ5mm7eXGtbx6biWLHKp70HyDFykm+6NjA9RsPi998SYADbnwF/4eFwOwAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-up_blur_17x17.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAMAAAAMs7fIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFNJREFUeNpk0FEKwCAMBNHZGO9/5dYYq6bzIzwWEek18nRVabQiwC32ip3ijPwQC7Etc5KjEKVoibFqKfpEU/YkLicetxuiS9Rx7hwVEb//eQQYAEtzAxztsU1gAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-up_blur_19x19.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAMAAABFjsb+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAFJJREFUeNp80EEWgCAMxNAMLfe/sgIihfrM8i9DzfFrymZYMuA03abdnJZHc3WTBzNGFozZsvKapjkrf0zBNMyIWTf2mpXDSsU5c5RMX08vAQYAutgECCw8X7gAAAAASUVORK5CYII=",
  "avsres_texer_triangle-up_blur_21x21.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGNJREFUeNqE0VsKwCAMRNGbR/e/5apBm6jQ+ZLDaALy3MI6udzUsIsCp2pT3dXp8U1lqFY1IlaUmay6VD91vvhSTapTczXK5FEjEmpV+3Zs9+MNyqg5kLPayshFhZ8fynkFGAAvQQTekLnyWQAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-up_blur_23x23.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAMAAADX9CSSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAGtJREFUeNqM0VcOgDAMBcF14f5XBtKcYiTe58glVrjy8MM1d8NSBzLXx/V0540fLsV191oeDcTSmtVtuM3ugxGfXMPbarbyvpp445jU3VhjzWVzqb6Xlwamk5iOY3ljTMLJ4kjq8vXvtwADAN3LBcvWRDUuAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-up_blur_25x25.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHBJREFUeNqM0tEKgDAMQ9Hbrv7/L4tOWepaMK+HlAzG0YV/4p04oxHDahmgpSXBlUrsFttlMBOb2CP2lbeyRrzCShYXGSqBJkQ8iS/JlaeELkaXkxbrCIrKLFFV7hLpkfpcilvzHkGdwBqx/ledAgwA6VkGzEpmytMAAAAASUVORK5CYII=",
  "avsres_texer_triangle-up_blur_27x27.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAHdJREFUeNqc0tkKwCAMRNGbxf//5Wot1iWB0nk9TBhESh4+m+ZmWGpAZlJNY3NaPDS5TSIz2IrMQ3pO02G2m/PGN9PJdLW5NopsQ+Y5HBffq5wXR5Go9hQJa30O4yHXSDcjijVzCU28mhJHC04WR1ITfv7dS4ABAI3WCCHr2wmrAAAAAElFTkSuQmCC",
  "avsres_texer_triangle-up_blur_29x29.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAMAAABhTZc9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAIJJREFUeNqkk1EKwzAMxfSS7P5XXmnaxq7twNj7FQpyoXx24xeqHW30mg5QTRt4Ga8eq6hOqpx25npGhy6qkdBbtfKirEXaDG1v2rEbLypH5alXnzBCkg0jJNkw1gcmhpGrl0yhTpks6bmKeI25iuLd+TZp0h1GrR4y2lDxx5/yFWAAPgwJSbWY85kAAAAASUVORK5CYII=",
  "avsres_texer_triangle-up_blur_31x31.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAMAAAAocOYLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAI5JREFUeNqk01sKwzAMRNGrR/e/5aY1kW1FFpTOV+CgiRQIrz786Nq7Ya0DnevldnbnEz+6fl1PPsb3AvblRmq3cKvcgxEvXKcvBRTj6wbxJJtLdmOPJZfksnsejwLSp8kr8rjtjk53qni4lC631+OjgHq5WJHqtuVGju3jDZS3zRvpxq8CpHXhz//zLcAAC4MKi1Ye/QcAAAAASUVORK5CYII=",
  "avsres_texer_triangle-up_blur_33x33.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAMAAABgOjJdAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAJZJREFUeNqslFsOBCEIBAt07n/lfTgZEQGzyfZ3paAxkesUfif0RCjtQAhSEw28ZCU6n1SEfAnNiaGAnhJyE5IRDQKJJZiJCTVEi4iOTQ8IXQjdiVVhJPim+MZsTf2yJIopIVM8ErZj+bORzJhziJoujckVt4RCMSRkaz7LEjc1jSlmjDm4N/XRi1rxliAHQvjD7/ASYAAVqwvkdVj3rAAAAABJRU5ErkJggg==",
  "avsres_texer_triangle-up_blur_35x35.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAMAAAApB0NrAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAKFJREFUeNq0lNEOAjEIBAda//+X1d6hLaWQmLjPk9nlmhyPOvzEaM00WskAFaMvRnOm805PGRmMZsyl8SL84BE5M82Y9X6CJt+Gu9uiMTNrFhH+7mA2YdPa9mG6OEZ2xmum+wkHr7MJB69t+C8ctBEPvkV9YmKNiVjee8uX0SOjxjTOaTcjCSMXk2mGiGSwzSYZbLPpVOlIyQh/+//seQowABCxDaLBEdA6AAAAAElFTkSuQmCC",
  "avsres_texer_triangle-up_blur_37x37.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAlCAMAAADyQNAxAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAAKZJREFUeNq01NEOwyAIheEfZO//ysu6GosCmiU7118OSk15nYRflZ4ope2VCbJXCmvZrIxPdkouJbVqfGOVMrmVVKpXzRfwipFc6UNppoxnLFHilMaq4dNCxZxItUXpqow1tigNlM4qqhplZEd3n5Ps6G4bFPPGTMqqXkZddZeRbcFtg3Jen8nyFqJtsKu6ysgW6t4G5dH7BTD2MfRACf/9FwZ5CzAA1+4PIDH4qJcAAAAASUVORK5CYII=",
  "avsres_texer_triangle-up_blur_39x39.bmp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAnCAMAAAC7faEHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRF////zMzMmZmZZmZmMzMzAAAA8496aQAAALJJREFUeNq8lEkOAyEMBAvj/P/LCZksBrxwiNLnUjHdjOB2Fv7AyRnX6SecNtoJ18ERbpwyUnPy5KTiOle04NqLazn31m1VFo5vMk4M12NOsdGQk4mTiJt1sxC/xFYFbxOnCuGpY2x1uF1nhSQ6+4X4m7BeM8mp9mSW/yQSkus+QoKJ1yokJew1E28yXTOV7iWk1F1Ckk1sFbJNzDaM96SMPrhaN6qgnESRI679+n2+CzAAhk8Qv+mV520AAAAASUVORK5CYII="
};

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * AnalyserAdapter adapts music data analysers so that it can be plugged into Webvs.
 * Adapters extend this class and define the required methods.
 * @memberof Webvs
 * @constructor
 */
function AnalyserAdapter() {}
Webvs.AnalyserAdapter = Webvs.defineClass(AnalyserAdapter, Object, {
    /**
     * boolean value indicating whether a beat
     * is in progress or not
     * @type boolean
     * @memberof Webvs.AnalyserAdapter#
     */
    beat: false,

    /**
     * returns whether song is being played or not.
     * @abstract
     * @returns {boolean}
     * @memberof Webvs.AnalyserAdapter#
     */
    isPlaying: function() {return false;},

    /**
     * Returns array of waveform values
     * @abstract
     * @returns {Float32Array}
     * @memberof Webvs.AnalyserAdapter#
     */
    getWaveform: function() {return new Float32Array(0);},

    /**
     * Returns array of spectrum values
     * @abstract
     * @returns {Float32Array}
     * @memberof Webvs.AnalyserAdapter#
     */
    getSpectrum: function() {return new Float32Array(0);}
});

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * Analyser adapter that adapts the Dancer library.
 * @param dancer
 * @augments Webvs.AnalyserAdapter
 * @constructor
 * @memberof Webvs
 */
function DancerAdapter(dancer) {
    this.dancer = dancer;
    this.beat = false;

    var _this = this;
    this.kick = dancer.createKick({
        onKick: function(mag) {
            _this.beat = true;
        },

        offKick: function() {
            _this.beat = false;
        }
    });
    this.kick.on();
}
Webvs.DancerAdapter = Webvs.defineClass(DancerAdapter, Webvs.AnalyserAdapter, {
    /**
     * returns whether song is being played or not.
     * @returns {boolean}
     * @memberof Webvs.DancerAdapter#
     */
    isPlaying: function() {
        return this.dancer.isPlaying();
    },

    /**
     * returns array of waveform values
     * @returns {Float32Array}
     * @memberof Webvs.DancerAdapter#
     */
    getWaveform: function() {
        return this.dancer.getWaveform();
    },

    /**
     * Returns array of spectrum values
     * @returns {Float32Array}
     * @memberof Webvs.DancerAdapter#
     */
    getSpectrum: function() {
        return this.dancer.getSpectrum();
    }
});

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * Main Webvs object, that represents a running webvs instance.
 *
 * @example
 * var dancer = new Dancer();
 * var webvs = new Webvs.Main({
 *     canvas: document.getElementById("canvas"),
 *     analyser: new Webvs.DancerAdapter(dancer),
 *     showStat: true
 * });
 * webvs.loadPreset(samplePreset);
 * webvs.start();
 * dancer.load({src: "music.ogg"}); // start playing musc
 * dancer.play();
 *
 * @param {object} options - options object
 * @param {HTMLCanvasElement} options.canvas - canvas element on which the visualization will be rendered
 * @param {Webvs.AnalyserAdapter} options.analyser  - a music analyser instance
 * @param {boolean} [options.showStat=false] - if set, then a framerate status indicator is inserted into the page
 * @memberof Webvs
 * @constructor
 */
function Main(options) {
    Webvs.checkRequiredOptions(options, ["canvas", "analyser"]);
    options = _.defaults(options, {
        showStat: false
    });
    this.canvas = options.canvas;
    this.analyser = options.analyser;
    this.isStarted = false;
    if(options.showStat) {
        var stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.right = '5px';
        stats.domElement.style.bottom = '5px';
        document.body.appendChild(stats.domElement);
        this.stats = stats;
    }
    this.resources = {};
    this.rootComponent = new Webvs.EffectList({id:"root"});
    this._registerContextEvents();
    this._initGl();
}
Webvs.Main = Webvs.defineClass(Main, Object, {
    _registerContextEvents: function() {
        var _this = this;

        this.canvas.addEventListener("webglcontextlost", function(event) {
            event.preventDefault();
            _this.stop();
        });

        this.canvas.addEventListener("webglcontextrestored", function(event) {
            _this.resetCanvas();
        });
    },

    _initGl: function() {
        try {
            this.gl = this.canvas.getContext("experimental-webgl", {alpha: false});

            this.copier = new Webvs.CopyProgram({dynamicBlend: true});
            this.copier.init(this.gl);

            this.resolution = {
                width: this.canvas.width,
                height: this.canvas.height
            };
        } catch(e) {
            throw new Error("Couldnt get webgl context" + e);
        }
    },

    /**
     * Loads a preset JSON. If a preset is already loaded and running, then
     * the animation is stopped, and the new preset is loaded.
     * @param {object} preset - JSON representation of the preset
     * @memberof Webvs.Main#
     */
    loadPreset: function(preset) {
        preset = _.clone(preset); // use our own copy
        preset.id = "root";
        var newRoot = new Webvs.EffectList(preset);
        this.stop();
        this.rootComponent.destroy();
        this.rootComponent = newRoot;
        this.resources = preset.resources || {};
    },

    /**
     * Reset all the components. Call this when canvas dimensions changes
     * @memberof Webvs.Main#
     */
    resetCanvas: function() {
        this.stop();
        var preset = this.rootComponent.getOptions();
        this.rootComponent.destroy();
        this.copier.cleanup();
        this._initGl();
        this.rootComponent = new Webvs.EffectList(preset);
    },

    /**
     * Starts the animation if not already started
     * @memberof Webvs.Main#
     */
    start: function() {
        if(this.isStarted) {
            return;
        }

        var _this = this;
        var drawFrame = function() {
            if(_this.analyser.isPlaying()) {
                _this.rootComponent.update();
            }
            _this.animReqId = requestAnimationFrame(drawFrame);
        };

        // wrap drawframe in stats collection if required
        if(this.stats) {
            var oldDrawFrame = drawFrame;
            drawFrame = function() {
                _this.stats.begin();
                oldDrawFrame.call(this, arguments);
                _this.stats.end();
            };
        }

        if(!this.rootComponent.componentInited) {
            this.registerBank = {};
            this.bootTime = (new Date()).getTime();
            this.rootComponent.init(this.gl, this);
        }
        this.animReqId = requestAnimationFrame(drawFrame);
        this.isStarted = true;
    },

    /**
     * Stops the animation
     * @memberof Webvs.Main#
     */
    stop: function() {
        if(!_.isUndefined(this.animReqId)) {
            cancelAnimationFrame(this.animReqId);
            this.isStarted = false;
        }
    },

    /**
     * Generates and returns the instantaneous preset JSON 
     * representation
     * @returns {object} preset json
     * @memberof Webvs.Main#
     */
    getPreset: function() {
        var preset = this.rootComponent.getOptions();
        preset.resources = this.resources;
        return preset;
    },

    /**
     * Adds a component under the given parent. Root has the id "root".
     * @param {string} parentId - id of the parent under which the component is
     *     to be added
     * @param {object} options - options for the new component
     * @param {number} [pos] - position at which the component will be inserted.
     *     default is the end of the list
     * @returns {string} id of the new component
     * @memberof Webvs.Main#
     */
    addComponent: function(parentId, options, pos) {
        options = _.clone(options); // use our own copy
        this.rootComponent.addComponent(parentId, options, pos);
        return res;
    },

    /**
     * Updates a component.
     * @param {string} id - id of the component
     * @param {object} options - options to be updated.
     * @returns {boolean} - success of the operation
     * @memberof Webvs.Main#
     */
    updateComponent: function(id, options) {
        options = _.clone(options); // use our own copy
        options.id = id;
        if(id == "root") {
            var subComponents = this.rootComponent.detachAllComponents();
            options = _.defaults(options, this.rootComponent.options);
            this.rootComponent.destroy();
            this.rootComponent = new Webvs.EffectList(options, subComponents);
            this.rootComponent.init(this.gl, this);
            return true;
        } else {
            return this.rootComponent.updateComponent(id, options);
        }
    },


    /**
     * Removes a component
     * @param {string} id - id of the component to be removed
     * @returns {boolean} - success of the operation
     * @memberof Webvs.Main#
     */
    removeComponent: function(id) {
        var component = this.rootComponent.detachComponent(id);
        if(component) {
            component.destroy();
            return true;
        } else {
            return false;
        }
    },

    /**
     * Moves a component to a different parent
     * @param {string} id - id of the component to be moved
     * @param {string} newParentId - id of the new parent
     * @param {number} pos - position in the new parent
     * @returns {boolean} - success of the operation
     * @memberof Webvs.Main#
     */
    moveComponent: function(id, newParentId, pos) {
        var component = this.rootComponent.detachComponent(id);
        if(component) {
            return this.rootComponent.addComponent(newParentId, component, pos);
        } else {
            return false;
        }
    },

    /**
     * Returns resource data. If resource is not defined
     * at preset level, its searched in the global resources
     * object
     * @param {string} name - name of the resource
     * @returns resource data. if resource is not found then name itself is returned
     * @memberof Webvs.Main#
     */
    getResource: function(name) {
        var resource;
        resource = this.resources[name];
        if(!resource) {
            resource = Webvs.Resources[name];
        }
        if(!resource) {
            resource = name;
        }
        return resource;
    },

    /**
     * Sets a preset level resource
     * @param {string} name - name of the resource
     * @param data - resource data
     * @memberof Webvs.Main#
     */
    setResource: function(name, data) {
        this.resources[name] = data;
    },

    /**
     * Traverses a callback over the component tree
     * @param {Webvs.Main~traverseCallback} callback - callback.
     * @memberof Webvs.Main#
     */
    traverse: function(callback) {
        this.rootComponent.traverse(callback);
    }

    /**
     * This function is called once for each component in the tree
     * @callback Webvs.Main~traverseCallback
     * @param {string} id - id of the component
     * @param {string} parentId - id of the parent. Undefined for root
     * @param {object} options - the options for this component.
     */
});

Main.ui = {
    leaf: false,
    disp: "Main",
    schema: {
        name: {
            type: "string",
            title: "Name"
        },
        author: {
            type: "string",
            title: "Author"
        },
        description: {
            type: "string",
            title: "Description"
        },
        clearFrame: {
            type: "boolean",
            title: "Clear every frame",
            default: false,
            required: true
        }
    },
};

})(Webvs);





/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A base class that all Webvs effects extend from.
 * @memberof Webvs
 * @constructor
 * @param {object} options - options object
 * @param {object} [options.id] - id for this component. Default is a random string.
 */
function Component(options) {
    this.id = options.id;
    this.enabled = _.isUndefined(options.enabled)?true:options.enabled;
    this.componentInited = false;
    this.options = options;
}
Webvs.Component = Webvs.defineClass(Component, Object, {
    /**
     * String name of the component class. Used to generate
     * id strings.
     * @memberof Webvs.Component
     */
    componentName: "Component",

    /**
     * Initialize component. Called once before animation starts.
     * Override and implement initialization code
     * @abstract
     * @param {WebGLContext} gl - webgl context
     * @param {Webvs.Main} main - container main object for this component
     * @param {Webvs.Component} - parent component
     * @memberof Webvs.Component#
     */
    init: function(gl, main, parent) {
        this.gl = gl;
        this.main = main;
        this.parent = parent;
        this.componentInited = true;
    },

    /**
     * Adopts or initializes this component, depending on whether
     * it is already initialized
     * @param {WebGLContext} gl - webgl context
     * @param {Webvs.Main} main - container main object for this component
     * @param {Webvs.Component} - parent component
     * @memberof Webvs.Component#
     */
    adoptOrInit: function(gl, main, parent) {
        if(this.componentInited) {
            return this.adopt(parent);
        } else {
            return this.init(gl, main, parent);
        }
    },

    /**
     * Called when the component is moved to a different
     * parent. Default implementation simply resets the parent reference.
     * Override and implement additional logic if required
     * @param {Webvs.Component} newParent - the new parent of this component
     * @memberof Webvs.Component#
     */
    adopt: function(newParent) {
        this.parent = newParent;
    },

    /**
     * Render a frame. Called once for every frame,
     * Override and implement rendering code
     * @abstract
     * @memberof Webvs.Component#
     */
    update: function() {},

    /**
     * Release any Webgl resources. Called during
     * reinitialization. Override and implement cleanup code
     * @abstract
     * @memberof Webvs.Component#
     */
    destroy: function() {},

    /**
     * Returns the component's options
     * @memberof Webvs.Component#
     */
    getOptions: function() {
        return this.options;
    },

    /**
     * Generates a printable path of this component
     * @returns {string} printable path generated from the parent hierarchy
     * @memberof Webvs.Component#
     */
    getPath: function() {
        if(!_.isUndefined(this.parent) && !_.isUndefined(this.id)) {
            return this.parent.getIdString() + "/" + this.componentName + "#" + this.id;
        } else {
            return this.componentName + "#Main";
        }
    }
});

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {


/**
 * @class
 * A base class for all components that can have sub components.
 * Manages, cloning and component tree operations
 * @memberof Webvs
 * @constructor
 * @param {object} options - options object
 * @param {Array.<object>} options.components - options array for all the subcomponents
 * @param {Array.<Webvs.ComponentFactory>} subFactories - factories for subcomponents. If
 *     provided then subcomponents are added from this factory and options.components is ignored.
 *     useful when moving existing subcomponent instances into new container.
 */
function Container(options, subComponents) {
    Container.super.constructor.call(this, options);

    this.components = [];

    // add all the sub components
    _.each(subComponents || options.components || [], function(component) {
        this.addComponent(this.id, component);
    }, this);

}
Webvs.Container = Webvs.defineClass(Container, Webvs.Component, {
    /**
     * initializes all the subcomponents
     * @memberof Webvs.Container#
     */
    init: function(gl, main, parent) {
        Container.super.init.call(this, gl, main, parent);

        for(var i = 0;i < this.components.length;i++) {
            this.components[i].adoptOrInit(gl, main, this);
        }
    },

    /**
     * destroys all subcomponents
     * @memberof Webvs.Container#
     */
    destroy: function() {
        Container.super.destroy.call(this);
        for(var i = 0;i < this.components.length;i++) {
            this.components[i].destroy();
        }
    },
    
    /**
     * Adds a component as child of the given parent that
     * resides under this containers subtree
     * @param {string} parentId - id of the parent under which the component is
     *     to be added
     * @param {Webvs.ComponentFactory} factory - factory from which component should be
     *      created. If an options object is passed then a Webvs.ComponentFactory
     *      is implicitly created from it
     * @param {number} [pos] - position at which the component will be inserted.
     *     default is the end of the list
     * @returns {string} - id of the new component
     * @memberof Webvs.Container#
     */
    addComponent: function(parentId, options, pos) {
        if(!(options instanceof Webvs.Component)) {
            options.id = options.id || Webvs.randString(5);
        }

        var component;
        if(parentId == this.id) {
            if(options instanceof Webvs.Component) {
                component = options;
            } else {
                component = new (Webvs.getComponentClass(options.type))(options);
            }
            if(this.componentInited) {
                component.adoptOrInit(this.gl, this.main, this);
            }

            if(_.isNumber(pos)) {
                this.components.splice(pos, 0, component);
            } else {
                this.components.push(component);
            }
            return component.id;
        } else {
            for(var i = 0;i < this.components.length;i++) {
                component = this.components[i];
                if(component instanceof Container) {
                    var id = component.addComponent(parentId, options, pos);
                    if(id) {
                        return id;
                    }
                }
            }
        }
    },

    /**
     * Updates a component under this container's subtree
     * @param {string} id - id of the component
     * @param {object} options - options to be updated.
     * @returns {boolean} - true if update succeeded else false
     * @memberof Webvs.Container#
     */
    updateComponent: function(id, options) {
        var component, i;
        // find the component in this container
        for(i = 0;i < this.components.length;i++) {
            component = this.components[i];
            if(component.id != id) {
                continue;
            }

            options = _.defaults(options, component.options);
            options.id = id;
            var subComponents = component instanceof Container?component.detachAllComponents():undefined;
            var newComponent = new (Webvs.getComponentClass(options.type))(options, subComponents);

            if(this.componentInited) {
                newComponent.adoptOrInit(this.gl, this.main, this);
            }

            this.components[i] = newComponent;
            component.destroy();
            return true;
        }

        for(i = 0;i < this.components.length;i++) {
            component = this.components[i];
            if(component instanceof Container) {
                if(component.updateComponent(id, options)) {
                    return true;
                }
            }
        }
    },

    /**
     * Detaches all components in this container
     * @returns {Array.<Webvs.ComponentFactory>} factories for each subcomponent
     * @memberof Webvs.Container#
     */
    detachAllComponents: function() {
        var components = this.components;
        this.components = [];
        return components;
    },

    /**
     * Detaches a given component under this container's subtree
     * @param {string} id - id of the component to be detached
     * @returns {Webvs.ComponentFactory} - factory containing the detached component
     * @memberof Webvs.Container#
     */
    detachComponent: function(id) {
        var component, i;
        // search for the component in this container
        for(i = 0;i < this.components.length;i++) {
            component = this.components[i];
            if(component.id == id) {
                this.components.splice(i, 1);
                return component;
            }
        }

        // try detaching from any of the subcontainers
        // aggregating results, in case they are cloned.
        for(i = 0;i < this.components.length;i++) {
            component = this.components[i];
            if(component instanceof Container) {
                var detached = component.detachComponent(id);
                if(detached) {
                    return detached;
                }
            }
        }
    },

    /**
     * Constructs complete options object for this container and its
     * subtree
     * @returns {object} - the options object
     * @memberof Webvs.Container#
     */
    getOptions: function() {
        var options = this.options;
        options.components = [];
        for(var i = 0;i < this.components.length;i++) {
            options.components.push(this.components[i].getOptions());
        }
        return options;
    },

    /**
     * Traverses a callback over this subtree, starting with this container
     * @param {Webvs.Container~traverseCallback} callback - callback.
     * @memberof Webvs.Container#
     */
    traverse: function(callback) {
        callback.call(this, this.id, (this.parent?this.parent.id:undefined), this.options);
        for(var i = 0;i < this.components.length;i++) {
            var component = this.components[i];
            if(component instanceof Container) {
                component.traverse(callback);
            } else {
                var parentId = component.parent?component.parent.id:undefined;
                var id = component.id;
                var options = component.options;
                callback.call(component, id, parentId, options);
            }
        }
    }

    /**
     * This function is called once for each component in the tree
     * @callback Webvs.Container~traverseCallback
     * @param {string} id - id of the component
     * @param {string} parentId - id of the parent. Undefined for root
     * @param {object} options - the options for this component.
     */
});

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * Effectlist is a container that renders components to a separate buffer. and blends
 * it in with the parent buffer. Its also used as the root component in Webvs.Main
 *
 * @param {object} options - options object
 * @param {Array.<object>} options.components - the constructor options object for each subcomponent
 *     in this effectlist.
 * @param {string} options.components[i].type - the component class name
 * @param {number} [options.components[i].clone] - the number of times this component should be cloned
 * @param {string} [options.output="REPLACE"] - the output blend mode
 * @param {string} [options.input="IGNORE"] - the input blend mode
 * @param {boolean} [options.clearFrame=false] - if set then the buffer is cleared for each frame
 * @param {boolean} [options.enableOnBeat=false] - if set then the subcomponents are rendered only
 *     for a fixed number of frames on beat
 * @param {number} [options.enableOnBeatFor=1] - the number frames for enableOnBeat setting
 *
 * @augments Webvs.Component
 * @memberof Webvs
 * @constructor
 */
function EffectList(options) {
    options = _.defaults(options, {
        output: "REPLACE",
        input: "IGNORE",
        clearFrame: false,
        enableOnBeat: false,
        enableOnBeatFor: 1
    });

    this.output = options.output=="IGNORE"?-1:Webvs.blendModes[options.output];
    this.input = options.input=="IGNORE"?-1:Webvs.blendModes[options.input];
    this.clearFrame = options.clearFrame;
    this.enableOnBeat = options.enableOnBeat;
    this.enableOnBeatFor = options.enableOnBeatFor;
    this.first = true;
    this._frameCounter = 0;
    this._inited = false;

    var codeGen = new Webvs.ExprCodeGenerator(options.code, ["beat", "enabled", "clear", "w", "h", "cid"]);
    this.code = codeGen.generateJs(["init", "perFrame"]);

    EffectList.super.constructor.apply(this, arguments);
}
Webvs.EffectList = Webvs.defineClass(EffectList, Webvs.Container, {
    componentName: "EffectList",

    /**
     * Initializes the effect list
     * @memberof Webvs.EffectList#
     */
    init: function(gl, main, parent) {
        EffectList.super.init.call(this, gl, main, parent);

        this.code.setup(main, this);

        // create a framebuffer manager for this effect list
        this.fm = new Webvs.FrameBufferManager(main.canvas.width, main.canvas.height, gl, main.copier, parent?true:false);
    },

    /**
     * Renders a frame of the effect list, by running
     * all the subcomponents.
     * @memberof Webvs.EffectList#
     */
    update: function() {
        EffectList.super.update.call(this);
        var gl = this.gl;

        if(this.enableOnBeat) {
            if(this.main.analyser.beat) {
                this._frameCounter = this.enableOnBeatFor;
            } else if(this._frameCounter > 0) {
                this._frameCounter--;
            }

            // only enable for enableOnBeatFor # of frames
            if(this._frameCounter === 0) {
                return;
            }
        }

        this.code.beat = this.main.analyser.beat?1:0;
        this.code.enabled = 1;
        this.code.clear = this.clearFrame;
        if(!this._inited) {
            this._inited = true;
            this.code.init();
        }
        this.code.perFrame();
        if(this.code.enabled === 0) {
            return;
        }

        // set rendertarget to internal framebuffer
        this.fm.setRenderTarget();

        // clear frame
        if(this.clearFrame || this.first || this.code.clear) {
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            this.first = false;
        }

        // blend input texture onto internal texture
        if(this.input !== -1) {
            var inputTexture = this.parent.fm.getCurrentTexture();
            this.main.copier.run(this.fm, this.input, inputTexture);
        }

        // render all the components
        for(var i = 0;i < this.components.length;i++) {
            if(this.components[i].enabled) {
                this.components[i].update();
            }
        }

        // switch to old framebuffer
        this.fm.restoreRenderTarget();

        // blend current texture to the output framebuffer
        if(this.output != -1) {
            if(this.parent) {
                this.main.copier.run(this.parent.fm, this.output, this.fm.getCurrentTexture());
            } else {
                this.main.copier.run(null, null, this.fm.getCurrentTexture());
            }
        }
    },

    /**
     * Releases resources.
     * @memberof Webvs.EffectList#
     */
    destroy: function() {
        EffectList.super.destroy.call(this);
        if(this.fm) {
            // destroy the framebuffer manager
            this.fm.destroy();
        }
    },
});

EffectList.ui = {
    disp: "Effect List",
    type: "EffectList",
    leaf: false,
    schema: {
        clearFrame: {
            type: "boolean",
            title: "Clear Frame",
            default: false,
            required: true
        },
        enableOnBeat: {
            type: "boolean",
            title: "Enable on beat",
            default: false,
        },
        enableOnBeatFor: {
            type: "number",
            title: "Enable on beat for frames",
            default: 1
        },
        output: {
            type: "string",
            title: "Output",
            default: "REPLACE",
            enum: _.keys(Webvs.blendModes)
        },
        input: {
            type: "string",
            title: "Input",
            default: "IGNORE",
            enum: _.union(_.keys(Webvs.blendModes), ["IGNORE"])
        }
    }
};

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class 
 * Base class for Webgl Shaders. This provides an abstraction
 * with support for blended output, easier variable bindings
 * etc.
 *
 * For outputblending, we try to use GL blendEq and blendFunc
 * if possible, otherwise we fallback to shader based blending,
 * where we swap the frame, sample the previous texture, and blend
 * the colors in the shader itself. To do this seamlessly, shader code in subclasses
 * should use a set of macros. eg: setFragColor instead of
 * setting gl_FragColor directly. The proper macro implementation
 * is inserted based on the blending modes.
 *
 * #### glsl utilities
 *
 * The following utilities are usable inside the shader code in subclasses
 *
 * + `setPosition(vec2 pos)` - sets gl_Position
 * + `getSrcColorAtPos(vec2 pos)` - pixel value at pos in u_srcTexture
 * + `getSrcColor(vec2 pos)` - same as above, but uses v_position
 * + `setFragColor(vec4 color)` - sets the correctly blended fragment color
 * + `sampler2D u_srcTexture` - the source texture from previous frame. enabled
 *     when swapFrame is set to true
 * + `vec2 u_resolution` - the screen resolution. enabled only if fm is 
 *     passed to {@link Webvs.ShaderProgram.run} call
 * + `vec2 v_position` - a 0-1, 0-1 normalized varying of the vertex. enabled
 *     when varyingPos option is used
 *
 * @param {object} options - refer class description
 * @param {string} options.vertexShader - the source for the vertex shader
 * @param {string} options.fragmentShader - the source for the fragment shader
 * @param {boolean} [options.forceShaderBlend=false] - force the use of shader based blending mode
 * @param {string} [options.oututBlendMode="REPLACE"] - the output blending mode.
 * @param {boolean} [options.dynamicBlend=false] - when set to true, blending mode can be changed
 *     at runtime even after shader compilation
 * @param {boolean} [options.swapFrame=false] - if set then a render target swap is done on the 
 *     framebuffermanager, before rendering. This is used
 *     by programs where the previous rendering need to be
 *     sampled
 * @param {boolean} [options.copyOnSwap=false] - if set to true then on swap, a copyOver is done on
 *     the framebuffermanager. This is used to maintain
 *     consistency during shader based blending in shaders
 *     that do not touch all the pixels
 * @param {boolean} [options.varyingPos=false] - if true then a varying called v_position is added
 *     automatically
 * @param {function} [options.draw ] - override the draw function
 * @memberof Webvs
 * @constructor
 */
function ShaderProgram(options) { 
    options = _.defaults(options, {
        forceShaderBlend: false,
        outputBlendMode: Webvs.REPLACE,
        varyingPos: false,
        dynamicBlend: false,
        swapFrame: false,
        copyOnSwap: false
    });
    var fsrc = [
        "precision mediump float;",
        "uniform vec2 u_resolution;",
        "#define PI "+Math.PI
    ];
    var vsrc = _.clone(fsrc);

    if(_.isFunction(options.draw)) {
        this.draw = options.draw;
    }
    this.copyOnSwap = options.copyOnSwap;
    this.varyingPos = options.varyingPos;
    this.dynamicBlend = options.dynamicBlend;

    // select the blend equation
    this.outputBlendMode = options.outputBlendMode;

    if(options.swapFrame || this.dynamicBlend || options.forceShaderBlend || !_.contains(this.glBlendModes, this.outputBlendMode)) {
        this.swapFrame = true;
        this.glBlendMode = false;
        this.varyingPos = true;
    } else {
        this.swapFrame = false;
        this.glBlendMode = true;
    }

    // varying position and macros
    if(this.varyingPos) {
        fsrc.push("varying vec2 v_position;");
        vsrc.push(
            "varying vec2 v_position;",
            "#define setPosition(pos) (v_position = (((pos)+1.0)/2.0),gl_Position = vec4((pos), 0, 1))"
        );
    } else {
        vsrc.push("#define setPosition(pos) (gl_Position = vec4((pos), 0, 1))");
    }

    // source teture uniform variable and macors
    if(this.swapFrame) {
        vsrc.push(
            "uniform sampler2D u_srcTexture;",
            "#define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))"
        );

        fsrc.push(
            "uniform sampler2D u_srcTexture;",
            "#define getSrcColor() (texture2D(u_srcTexture, v_position))",
            "#define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))"
        );
    }

    // color blend macro/function
    if(this.dynamicBlend) {
        fsrc.push(
            "uniform int u_blendMode;",
            "void setFragColor(vec4 color) {"
        );
        _.each(this.blendEqs, function(eq, mode) {
            fsrc.push(
                "   if(u_blendMode == "+mode+") {",
                "       gl_FragColor = ("+eq+");",
                "   }"
            );
        });
        fsrc.push(
            "}"
        );
    } else {
        var blendEq = this.blendEqs[this.glBlendMode?Webvs.REPLACE:this.outputBlendMode];
        if(_.isUndefined(blendEq)) {
            throw new Error("Blend Mode " + this.outputBlendMode + " not supported");
        }
        fsrc.push("#define setFragColor(color) (gl_FragColor = ("+blendEq+"))");
    }

    this.fragmentSrc = fsrc.join("\n") + "\n" + options.fragmentShader.join("\n");
    this.vertexSrc = vsrc.join("\n") + "\n" + options.vertexShader.join("\n");
    this._locations = {};
    this._textureVars = [];
    this._arrBuffers = {};
}

Webvs.ShaderProgram = Webvs.defineClass(ShaderProgram, Object, {
    // these are blend modes supported with gl.BLEND
    // all other modes have to implemented with shaders
    glBlendModes: [
        Webvs.REPLACE,
        Webvs.AVERAGE,
        Webvs.ADDITIVE,
        Webvs.SUBTRACTIVE1,
        Webvs.SUBTRACTIVE2,
        Webvs.MULTIPLY
    ],

    // the blending formulas to be used inside shaders
    blendEqs: _.object([
        [Webvs.REPLACE, "color"],
        [Webvs.MAXIMUM, "max(color, texture2D(u_srcTexture, v_position))"],
        [Webvs.AVERAGE, "(color+texture2D(u_srcTexture, v_position))/2.0"],
        [Webvs.ADDITIVE, "color+texture2D(u_srcTexture, v_position)"],
        [Webvs.SUBTRACTIVE1, "texture2D(u_srcTexture, v_position)-color"],
        [Webvs.SUBTRACTIVE2, "color-texture2D(u_srcTexture, v_position)"],
        [Webvs.MULTIPLY, "color*texture2D(u_srcTexture, v_position)"]
    ]),

    /**
     * initializes and compiles the shaders
     * @memberof Webvs.ShaderProgram#
     */
	init: function(gl) {
		this.gl = gl;
        try {
            this._compileProgram(this.vertexSrc, this.fragmentSrc);
        } catch(e) {
            throw e;
        }
	},

    /**
     * Sets the output blend mode for this shader
     * @param {Webvs.blendModes} mode - the blending mode
     * @memberof Webvs.ShaderProgram#
     */
    setOutputBlendMode: function(mode) {
        this.outputBlendMode = mode;
    },

    /**
     * Runs this shader program
     * @param {Webvs.FrameBufferManager} fm - frame manager. pass null, if no fm is required
     * @param {Webvs.blendModes} outputBlendMode - overrides the blendmode. pass null to use default
     * @param {...any} extraParams - remaining parameters are passed to the draw function
     * @memberof Webvs.ShaderProgram#
     */
    run: function(fm, outputBlendMode) {
        var gl = this.gl;
        var oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.useProgram(this.program);

        if(fm) {
            this.setUniform("u_resolution", "2f", fm.width, fm.height);
            if(this.swapFrame) {
                this.setUniform("u_srcTexture", "texture2D", fm.getCurrentTexture());
                fm.swapAttachment();
                if(this.copyOnSwap) {
                    fm.copyOver();
                }
            }
        }

        if(outputBlendMode && !this.dynamicBlend) {
            throw new Error("Cannot set blendmode at runtime. Use dynamicBlend");
        }
        outputBlendMode = outputBlendMode || this.outputBlendMode;
        if(this.dynamicBlend) {
            this.setUniform("u_blendMode", "1i", outputBlendMode);
        }

        if(this.glBlendMode && outputBlendMode != Webvs.REPLACE) {
            gl.enable(gl.BLEND);
            this._setGlBlendMode(gl, outputBlendMode);
        } else {
            gl.disable(gl.BLEND);
        }

        this.draw.apply(this, _.drop(arguments, 2));

        gl.disable(gl.BLEND);
        gl.useProgram(oldProgram);
    },

    /**
     * Performs the actual drawing and any further bindings and calculations if required.
     * @param {...any} extraParams - the extra parameters passed to {@link Webvs.ShaderProgram.run}
     * @abstract
     * @memberof Webvs.ShaderProgram#
     */
    draw: function() {},

    _compileProgram: function(vertexSrc, fragmentSrc) {
        var gl = this.gl;
        var vertex = this._compileShader(vertexSrc, gl.VERTEX_SHADER);
        var fragment = this._compileShader(fragmentSrc, gl.FRAGMENT_SHADER);
        var program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);

        if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error("Program link Error: " + gl.getProgramInfoLog(program));
        }

        this.vertex = vertex;
        this.fragment = fragment;
        this.program = program;
    },

    _compileShader: function(shaderSrc, type) {
        var gl = this.gl;
        var shader = gl.createShader(type);
        gl.shaderSource(shader, shaderSrc);
        gl.compileShader(shader);
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            Webvs.logShaderError(shaderSrc, gl.getShaderInfoLog(shader));
            throw new Error("Shader compilation Error: " + gl.getShaderInfoLog(shader));
        }
        return shader;
    },

    _setGlBlendMode: function(gl, mode) {
        switch(mode) {
            case Webvs.ADDITIVE:
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case Webvs.SUBTRACTIVE1:
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
                break;
            case Webvs.SUBTRACTIVE2:
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_SUBTRACT);
                break;
            case Webvs.MULTIPLY:
                gl.blendFunc(gl.DST_COLOR, gl.ZERO);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case Webvs.AVERAGE:
                gl.blendColor(0.5, 0.5, 0.5, 1);
                gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            default: throw new Error("Invalid blend mode");
        }
    },

    /**
     * returns the location of a uniform or attribute. locations are cached.
     * @param {string} name - name of the variable
     * @param {boolean} [attrib] - pass true if variable is attribute
     * @returns {location}
     * @memberof Webvs.ShaderProgram#
     */
    getLocation: function(name, attrib) {
        var location = this._locations[name];
        if(_.isUndefined(location)) {
            if(attrib) {
                location = this.gl.getAttribLocation(this.program, name);
            } else {
                location = this.gl.getUniformLocation(this.program, name);
            }
            this._locations[name] = location;
        }
        return location;
    },

    /**
     * returns the index of a texture. assigns id if not already assigned.
     * @param {string} name - name of the varaible
     * @returns {number} index of the texture
     * @memberof Webvs.ShaderProgram#
     */
    getTextureId: function(name) {
        var id = _.indexOf(this._textureVars, name);
        if(id === -1) {
            this._textureVars.push(name);
            id = this._textureVars.length-1;
        }
        return id;
    },

    /**
     * binds value of a uniform variable in this program
     * @param {string} name - name of the variable
     * @param {string} type - type of the variable (texture2D, [1234]f, [1234]i, [1234]fv, [1234]iv)
     * @param {...any} values - values to be assigned
     * @memberof Webvs.ShaderProgram#
     */
    setUniform: function(name, type, value) {
        var location = this.getLocation(name);
        var gl = this.gl;
        switch(type) {
            case "texture2D":
                var id = this.getTextureId(name);
                gl.activeTexture(gl["TEXTURE"+id]);
                gl.bindTexture(gl.TEXTURE_2D, value);
                gl.uniform1i(location, id);
                break;
            case "1f": case "2f": case "3f": case "4f":
            case "1i": case "2i": case "3i": case "4i":
                var args = [location].concat(_.drop(arguments, 2));
                gl["uniform" + type].apply(gl, args);
                break;
            case "1fv": case "2fv": case "3fv": case "4fv":
            case "1iv": case "2iv": case "3iv": case "4iv":
                gl["uniform" + type].apply(gl, location, value);
                break;
        }
    },

    /**
     * binds the vertex attribute array
     * @param {string} name - name of the variable
     * @param {Array} array - array of vertex data
     * @param {number} [size=2] - size of each item
     * @param [type=gl.FLOAT]
     * @param [normalized=false]
     * @param [stride=0]
     * @param [offset=0]
     * @memberof Webvs.ShaderProgram#
     */
    setVertexAttribArray: function(name, array, size, type, normalized, stride, offset) {
        var gl = this.gl;
        size = size || 2;
        type = type || gl.FLOAT;
        normalized = normalized || false;
        stride = stride || 0;
        offset = offset || 0;

        var buffer = this._arrBuffers[name];
        if(_.isUndefined(buffer)) {
            buffer = gl.createBuffer();
            this._arrBuffers[name] = buffer;
        }
        var location = this.getLocation(name, true);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
    },

    setElementArray: function(array) {
        var gl = this.gl;

        var buffer = this._arrBuffers.__indexBuffer;
        if(_.isUndefined(buffer)) {
            buffer = gl.createBuffer();
            this._arrBuffers.__indexBuffer = buffer;
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, gl.STATIC_DRAW);
    },

    /**
     * destroys webgl resources consumed by this program.
     * call in component destroy
     * @memberof Webvs.ShaderProgram#
     */
    cleanup: function() {
        var gl = this.gl;
        _.each(this._buffers, function(buffer) {
            gl.deleteBuffer(buffer);
        }, this);
        gl.deleteProgram(this.program);
        gl.deleteShader(this.vertexShader);
        gl.deleteShader(this.fragmentShader);
    },

});


})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A Base for shaders that provides a vertexShader and vertices
 * for a rectangle that fills the entire screen
 * @param {object} options - the options object. passed along to {@link Webvs.ShaderProgram}
 * @augments Webvs.QuadBoxProgram
 * @memberof Webvs
 * @constructor
 */
function QuadBoxProgram(options) {
    options = _.defaults(options, {
        vertexShader: [
            "attribute vec2 a_position;",
            "void main() {",
            "   setPosition(a_position);",
            "}"
        ],
        varyingPos: true
    });
    QuadBoxProgram.super.constructor.call(this, options);
}
Webvs.QuadBoxProgram = Webvs.defineClass(QuadBoxProgram, Webvs.ShaderProgram, {
    /**
     * Sets the vertices for the quad box
     * @memberof Webvs.QuadBoxProgram#
     */
    draw: function() {
        this.setVertexAttribArray(
            "a_position", 
            new Float32Array([
                -1,  -1,
                1,  -1,
                -1,  1,
                -1,  1,
                1,  -1,
                1,  1
            ])
        );
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A Shader that copies given texture onto current buffer
 * @param {object} options - the options object. passed along to {@link Webvs.ShaderProgram}
 * @augments Webvs.QuadBoxProgram
 * @memberof Webvs
 * @constructor
 */
function CopyProgram(options) {
    options = _.defaults(options||{}, {
        fragmentShader: [
            "uniform sampler2D u_copySource;",
            "void main() {",
            "   setFragColor(texture2D(u_copySource, v_position));",
            "}"
        ]
    });
    CopyProgram.super.constructor.call(this, options);
}
Webvs.CopyProgram = Webvs.defineClass(CopyProgram, Webvs.QuadBoxProgram, {
    /**
     * Renders this shader
     * @param {WebGLTexture} srcTexture - the texture to be copied to the screen
     * @memberof Webvs.CopyProgram#
     */
    draw: function(srcTexture) {
        this.setUniform("u_copySource", "texture2D", srcTexture);
        CopyProgram.super.draw.call(this);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * FrameBufferManager maintains a set of render targets
 * and can switch between them.
 *
 * @param {number} width - the width of the textures to be initialized
 * @param {number} height - the height of the textures to be initialized
 * @param {WebGLRenderingContext} gl - the webgl context to be used
 * @param {Webvs.CopyProgram} copier - an instance of a CopyProgram that should be used
 *                                     when a frame copyOver is required
 * @param {boolean} textureOnly - if set then only texture's and renderbuffers are maintained
 * @constructor
 * @memberof Webvs
 */
function FrameBufferManager(width, height, gl, copier, textureOnly, texCount) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.copier = copier;
    this.texCount = texCount || 2;
    this.textureOnly = textureOnly;
    this._initFrameBuffers();
}
Webvs.FrameBufferManager = Webvs.defineClass(FrameBufferManager, Object, {
    _initFrameBuffers: function() {
        var gl = this.gl;

        if(!this.textureOnly) {
            this.framebuffer = gl.createFramebuffer();
        }

        var attachments = [];
        for(var i = 0;i < this.texCount;i++) {
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height,
                0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            var renderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);

            attachments[i] = {
                texture: texture,
                renderbuffer: renderbuffer
            };
        }

        this.frameAttachments = attachments;
        this.currAttachment = 0;
    },

    /**
     * Saves the current render target and sets this
     * as the render target
     * @memberof Webvs.FrameBufferManager#
     */
    setRenderTarget: function() {
        var gl = this.gl;
        if(this.textureOnly) {
            this.oldAttachment = this._getFBAttachment();
        } else {
            this.oldFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.viewport(0, 0, this.width, this.height);
        }
        this._setFBAttachment();
    },

    /**
     * Restores the render target previously saved with
     * a {@link Webvs.FrameBufferManager.setRenderTarget} call
     * @memberof Webvs.FrameBufferManager#
     */
    restoreRenderTarget: function() {
        var gl = this.gl;
        if(this.textureOnly) {
            this._setFBAttachment(this.oldAttachment);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.oldFrameBuffer);
        }
    },

    /**
     * Returns the texture that is currently being used
     * @returns {WebGLTexture}
     * @memberof Webvs.FrameBufferManager#
     */
    getCurrentTexture: function() {
        return this.frameAttachments[this.currAttachment].texture;
    },

    /**
     * Copies the previous texture into the current texture
     * @memberof Webvs.FrameBufferManager#
     */
    copyOver: function() {
        var prevTexture = this.frameAttachments[Math.abs(this.currAttachment-1)%this.texCount].texture;
        this.copier.run(null, null, prevTexture);
    },

    /**
     * Swaps the current texture
     * @memberof Webvs.FrameBufferManager#
     */
    swapAttachment : function() {
        this.currAttachment = (this.currAttachment + 1) % this.texCount;
        this._setFBAttachment();
    },

    /**
     * cleans up all webgl resources
     * @memberof Webvs.FrameBufferManager#
     */
    destroy: function() {
        var gl = this.gl;
        for(var i = 0;i < this.texCount;i++) {
            gl.deleteRenderbuffer(this.frameAttachments[i].renderbuffer);
            gl.deleteTexture(this.frameAttachments[i].texture);
        }
    },


    _getFBAttachment: function() {
        var gl = this.gl;
        return {
            texture: gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME),
            renderbuffer: gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME)
        };
    },

    _setFBAttachment: function(attachment) {
        attachment = attachment || this.frameAttachments[this.currAttachment];
        var gl = this.gl;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, attachment.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, attachment.renderbuffer);
    },
});

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A Shader that clears the screen to a given color
 * @param {number} blendMode - blending mode for this shader
 * @augments Webvs.QuadBoxProgram
 * @memberof Webvs
 * @constructor
 */
function ClearScreenProgram(blendMode) {
    ClearScreenProgram.super.constructor.call(this, {
        fragmentShader: [
            "uniform vec3 u_color;",
            "void main() {",
            "   setFragColor(vec4(u_color, 1));",
            "}"
        ],
        outputBlendMode: blendMode
    });
}
Webvs.ClearScreenProgram = Webvs.defineClass(ClearScreenProgram, Webvs.QuadBoxProgram, {
    /**
     * Renders this shader
     * @param {Array.<number>} color - color to which the screen will be cleared
     * @memberof Webvs.ClearScreenProgram#
     */
    draw: function(color) {
        this.setUniform.apply(this, ["u_color", "3f"].concat(color));
        ClearScreenProgram.super.draw.call(this);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * Base class for AVS expression Syntax Tree
 * @memberof Webvs
 */
function AstBase() {}
Webvs.AstBase = Webvs.defineClass(AstBase, Object);

/**
 * @class
 * Binary Expression
 * @augments Webvs.AstBase
 * @param {string} operator
 * @param {string} leftOperand
 * @param {string} rightOperand
 * @memberof Webvs
 */
function AstBinaryExpr(operator, leftOperand, rightOperand) {
    this.operator = operator;
    this.leftOperand = leftOperand;
    this.rightOperand = rightOperand;
}
Webvs.AstBinaryExpr = Webvs.defineClass(AstBinaryExpr, AstBase);

/**
 * @class
 * Unary Expression
 * @augments Webvs.AstBase
 * @param {string} operator
 * @param {string} operand
 * @memberof Webvs
 */
function AstUnaryExpr(operator, operand) {
    this.operator = operator;
    this.operand = operand;
}
Webvs.AstUnaryExpr = Webvs.defineClass(AstUnaryExpr, AstBase);

/**
 * @class
 * Function call
 * @augments Webvs.AstBase
 * @param {string} funcName - function identifier
 * @param {Array.<AstBase>} args - argument expressions
 * @memberof Webvs
 */
function AstFuncCall(funcName, args) {
    this.funcName = funcName;
    this.args = args;
}
Webvs.AstFuncCall = Webvs.defineClass(AstFuncCall, AstBase);

/**
 * @class
 * Variable assignment
 * @augments Webvs.AstBase
 * @param {string} lhs - identifier
 * @param {Array.<AstBase>} expr - expression being assigned
 * @memberof Webvs
 */
function AstAssignment(lhs, expr) {
    this.lhs = lhs;
    this.expr = expr;
}
Webvs.AstAssignment = Webvs.defineClass(AstAssignment, AstBase);

/**
 * @class
 * Code start symbol
 * @augments Webvs.AstBase
 * @param {Array.<AstBase>} statements - statements in the program
 * @memberof Webvs
 */
function AstProgram(statements) {
    this.statements = statements;
}
Webvs.AstProgram = Webvs.defineClass(AstProgram, AstBase);

/**
 * @class
 * Atomic expression
 * @augments Webvs.AstBase
 * @param value
 * @param {String} type - type of the atom viz. "ID", "CONST", "REG", "VALUE"
 * @memberof Webvs
 */
function AstPrimaryExpr(value, type) {
    this.value = value;
    this.type = type;
}
Webvs.AstPrimaryExpr = Webvs.defineClass(AstPrimaryExpr, AstBase);

})(Webvs);

Webvs.PegExprParser = (function(){
  /*
   * Generated by PEG.js 0.7.0.
   *
   * http://pegjs.majda.cz/
   */
  
  function quote(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
     return '"' + s
      .replace(/\\/g, '\\\\')  // backslash
      .replace(/"/g, '\\"')    // closing quote character
      .replace(/\x08/g, '\\b') // backspace
      .replace(/\t/g, '\\t')   // horizontal tab
      .replace(/\n/g, '\\n')   // line feed
      .replace(/\f/g, '\\f')   // form feed
      .replace(/\r/g, '\\r')   // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
      + '"';
  }
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "program": parse_program,
        "statement": parse_statement,
        "unary_ops": parse_unary_ops,
        "additive_ops": parse_additive_ops,
        "multiplicative_ops": parse_multiplicative_ops,
        "boolean_ops": parse_boolean_ops,
        "boolean_expr": parse_boolean_expr,
        "additive_expr": parse_additive_expr,
        "multiplicative_expr": parse_multiplicative_expr,
        "unary": parse_unary,
        "func_call": parse_func_call,
        "primary_expr": parse_primary_expr,
        "assignable": parse_assignable,
        "identifier": parse_identifier,
        "constant": parse_constant,
        "register": parse_register,
        "value": parse_value,
        "__": parse___,
        "whiteSpace": parse_whiteSpace,
        "lineEnd": parse_lineEnd,
        "comment": parse_comment
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "program";
      }
      
      var pos = { offset: 0, line: 1, column: 1, seenCR: false };
      var reportFailures = 0;
      var rightmostFailuresPos = { offset: 0, line: 1, column: 1, seenCR: false };
      var rightmostFailuresExpected = [];
      var cache = {};
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        var escapeChar;
        var length;
        
        if (charCode <= 0xFF) {
          escapeChar = 'x';
          length = 2;
        } else {
          escapeChar = 'u';
          length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function clone(object) {
        var result = {};
        for (var key in object) {
          result[key] = object[key];
        }
        return result;
      }
      
      function advance(pos, n) {
        var endOffset = pos.offset + n;
        
        for (var offset = pos.offset; offset < endOffset; offset++) {
          var ch = input.charAt(offset);
          if (ch === "\n") {
            if (!pos.seenCR) { pos.line++; }
            pos.column = 1;
            pos.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            pos.line++;
            pos.column = 1;
            pos.seenCR = true;
          } else {
            pos.column++;
            pos.seenCR = false;
          }
        }
        
        pos.offset += n;
      }
      
      function matchFailed(failure) {
        if (pos.offset < rightmostFailuresPos.offset) {
          return;
        }
        
        if (pos.offset > rightmostFailuresPos.offset) {
          rightmostFailuresPos = clone(pos);
          rightmostFailuresExpected = [];
        }
        
        rightmostFailuresExpected.push(failure);
      }
      
      function parse_program() {
        var cacheKey = "program@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1, result2, result3, result4, result5, result6, result7;
        var pos0, pos1, pos2;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        result0 = parse___();
        if (result0 !== null) {
          result1 = parse_statement();
          if (result1 !== null) {
            result2 = parse___();
            if (result2 !== null) {
              result3 = [];
              pos2 = clone(pos);
              if (input.charCodeAt(pos.offset) === 59) {
                result4 = ";";
                advance(pos, 1);
              } else {
                result4 = null;
                if (reportFailures === 0) {
                  matchFailed("\";\"");
                }
              }
              if (result4 !== null) {
                result5 = parse___();
                if (result5 !== null) {
                  result6 = parse_statement();
                  if (result6 !== null) {
                    result7 = parse___();
                    if (result7 !== null) {
                      result4 = [result4, result5, result6, result7];
                    } else {
                      result4 = null;
                      pos = clone(pos2);
                    }
                  } else {
                    result4 = null;
                    pos = clone(pos2);
                  }
                } else {
                  result4 = null;
                  pos = clone(pos2);
                }
              } else {
                result4 = null;
                pos = clone(pos2);
              }
              while (result4 !== null) {
                result3.push(result4);
                pos2 = clone(pos);
                if (input.charCodeAt(pos.offset) === 59) {
                  result4 = ";";
                  advance(pos, 1);
                } else {
                  result4 = null;
                  if (reportFailures === 0) {
                    matchFailed("\";\"");
                  }
                }
                if (result4 !== null) {
                  result5 = parse___();
                  if (result5 !== null) {
                    result6 = parse_statement();
                    if (result6 !== null) {
                      result7 = parse___();
                      if (result7 !== null) {
                        result4 = [result4, result5, result6, result7];
                      } else {
                        result4 = null;
                        pos = clone(pos2);
                      }
                    } else {
                      result4 = null;
                      pos = clone(pos2);
                    }
                  } else {
                    result4 = null;
                    pos = clone(pos2);
                  }
                } else {
                  result4 = null;
                  pos = clone(pos2);
                }
              }
              if (result3 !== null) {
                if (input.charCodeAt(pos.offset) === 59) {
                  result4 = ";";
                  advance(pos, 1);
                } else {
                  result4 = null;
                  if (reportFailures === 0) {
                    matchFailed("\";\"");
                  }
                }
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result5 = parse___();
                  if (result5 !== null) {
                    result0 = [result0, result1, result2, result3, result4, result5];
                  } else {
                    result0 = null;
                    pos = clone(pos1);
                  }
                } else {
                  result0 = null;
                  pos = clone(pos1);
                }
              } else {
                result0 = null;
                pos = clone(pos1);
              }
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, p) {
            var stmts = [p[1]];
            stmts = stmts.concat(_.map(p[3], function(pp) {
                return pp[2];
            }));
            return new Webvs.AstProgram(stmts);
        })(pos0.offset, pos0.line, pos0.column, result0);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_statement() {
        var cacheKey = "statement@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        result0 = parse_assignable();
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            if (input.charCodeAt(pos.offset) === 61) {
              result2 = "=";
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"=\"");
              }
            }
            if (result2 !== null) {
              result3 = parse___();
              if (result3 !== null) {
                result4 = parse_boolean_expr();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = clone(pos1);
                }
              } else {
                result0 = null;
                pos = clone(pos1);
              }
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, lhs, e) { return new Webvs.AstAssignment(lhs, e); })(pos0.offset, pos0.line, pos0.column, result0[0], result0[4]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        if (result0 === null) {
          result0 = parse_boolean_expr();
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_unary_ops() {
        var cacheKey = "unary_ops@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0;
        
        if (input.charCodeAt(pos.offset) === 43) {
          result0 = "+";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"+\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos.offset) === 45) {
            result0 = "-";
            advance(pos, 1);
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"-\"");
            }
          }
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_additive_ops() {
        var cacheKey = "additive_ops@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0;
        
        if (input.charCodeAt(pos.offset) === 43) {
          result0 = "+";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"+\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos.offset) === 45) {
            result0 = "-";
            advance(pos, 1);
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"-\"");
            }
          }
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_multiplicative_ops() {
        var cacheKey = "multiplicative_ops@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0;
        
        if (input.charCodeAt(pos.offset) === 42) {
          result0 = "*";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"*\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos.offset) === 47) {
            result0 = "/";
            advance(pos, 1);
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"/\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos.offset) === 37) {
              result0 = "%";
              advance(pos, 1);
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"%\"");
              }
            }
          }
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_boolean_ops() {
        var cacheKey = "boolean_ops@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0;
        
        if (input.charCodeAt(pos.offset) === 38) {
          result0 = "&";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"&\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos.offset) === 124) {
            result0 = "|";
            advance(pos, 1);
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"|\"");
            }
          }
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_boolean_expr() {
        var cacheKey = "boolean_expr@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1, pos2;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        result0 = parse_additive_expr();
        if (result0 !== null) {
          result1 = [];
          pos2 = clone(pos);
          result2 = parse___();
          if (result2 !== null) {
            result3 = parse_boolean_ops();
            if (result3 !== null) {
              result4 = parse___();
              if (result4 !== null) {
                result5 = parse_additive_expr();
                if (result5 !== null) {
                  result2 = [result2, result3, result4, result5];
                } else {
                  result2 = null;
                  pos = clone(pos2);
                }
              } else {
                result2 = null;
                pos = clone(pos2);
              }
            } else {
              result2 = null;
              pos = clone(pos2);
            }
          } else {
            result2 = null;
            pos = clone(pos2);
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = clone(pos);
            result2 = parse___();
            if (result2 !== null) {
              result3 = parse_boolean_ops();
              if (result3 !== null) {
                result4 = parse___();
                if (result4 !== null) {
                  result5 = parse_additive_expr();
                  if (result5 !== null) {
                    result2 = [result2, result3, result4, result5];
                  } else {
                    result2 = null;
                    pos = clone(pos2);
                  }
                } else {
                  result2 = null;
                  pos = clone(pos2);
                }
              } else {
                result2 = null;
                pos = clone(pos2);
              }
            } else {
              result2 = null;
              pos = clone(pos2);
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, head, tail) { return makeBinaryExpr(head, tail); })(pos0.offset, pos0.line, pos0.column, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_additive_expr() {
        var cacheKey = "additive_expr@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1, pos2;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        result0 = parse_multiplicative_expr();
        if (result0 !== null) {
          result1 = [];
          pos2 = clone(pos);
          result2 = parse___();
          if (result2 !== null) {
            result3 = parse_additive_ops();
            if (result3 !== null) {
              result4 = parse___();
              if (result4 !== null) {
                result5 = parse_multiplicative_expr();
                if (result5 !== null) {
                  result2 = [result2, result3, result4, result5];
                } else {
                  result2 = null;
                  pos = clone(pos2);
                }
              } else {
                result2 = null;
                pos = clone(pos2);
              }
            } else {
              result2 = null;
              pos = clone(pos2);
            }
          } else {
            result2 = null;
            pos = clone(pos2);
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = clone(pos);
            result2 = parse___();
            if (result2 !== null) {
              result3 = parse_additive_ops();
              if (result3 !== null) {
                result4 = parse___();
                if (result4 !== null) {
                  result5 = parse_multiplicative_expr();
                  if (result5 !== null) {
                    result2 = [result2, result3, result4, result5];
                  } else {
                    result2 = null;
                    pos = clone(pos2);
                  }
                } else {
                  result2 = null;
                  pos = clone(pos2);
                }
              } else {
                result2 = null;
                pos = clone(pos2);
              }
            } else {
              result2 = null;
              pos = clone(pos2);
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, head, tail) { return makeBinaryExpr(head, tail); })(pos0.offset, pos0.line, pos0.column, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_multiplicative_expr() {
        var cacheKey = "multiplicative_expr@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1, pos2;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        result0 = parse_unary();
        if (result0 !== null) {
          result1 = [];
          pos2 = clone(pos);
          result2 = parse___();
          if (result2 !== null) {
            result3 = parse_multiplicative_ops();
            if (result3 !== null) {
              result4 = parse___();
              if (result4 !== null) {
                result5 = parse_unary();
                if (result5 !== null) {
                  result2 = [result2, result3, result4, result5];
                } else {
                  result2 = null;
                  pos = clone(pos2);
                }
              } else {
                result2 = null;
                pos = clone(pos2);
              }
            } else {
              result2 = null;
              pos = clone(pos2);
            }
          } else {
            result2 = null;
            pos = clone(pos2);
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = clone(pos);
            result2 = parse___();
            if (result2 !== null) {
              result3 = parse_multiplicative_ops();
              if (result3 !== null) {
                result4 = parse___();
                if (result4 !== null) {
                  result5 = parse_unary();
                  if (result5 !== null) {
                    result2 = [result2, result3, result4, result5];
                  } else {
                    result2 = null;
                    pos = clone(pos2);
                  }
                } else {
                  result2 = null;
                  pos = clone(pos2);
                }
              } else {
                result2 = null;
                pos = clone(pos2);
              }
            } else {
              result2 = null;
              pos = clone(pos2);
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, head, tail) { return makeBinaryExpr(head, tail); })(pos0.offset, pos0.line, pos0.column, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_unary() {
        var cacheKey = "unary@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        result0 = parse_unary_ops();
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result2 = parse_func_call();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, op, oper) { return new Webvs.AstUnaryExpr(op, oper); })(pos0.offset, pos0.line, pos0.column, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        if (result0 === null) {
          result0 = parse_func_call();
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_func_call() {
        var cacheKey = "func_call@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1, result2, result3, result4, result5, result6, result7;
        var pos0, pos1, pos2, pos3;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        pos2 = clone(pos);
        if (/^[a-zA-Z_]/.test(input.charAt(pos.offset))) {
          result0 = input.charAt(pos.offset);
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[a-zA-Z_]");
          }
        }
        if (result0 !== null) {
          result1 = [];
          if (/^[a-zA-Z_0-9]/.test(input.charAt(pos.offset))) {
            result2 = input.charAt(pos.offset);
            advance(pos, 1);
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[a-zA-Z_0-9]");
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            if (/^[a-zA-Z_0-9]/.test(input.charAt(pos.offset))) {
              result2 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[a-zA-Z_0-9]");
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos2);
          }
        } else {
          result0 = null;
          pos = clone(pos2);
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            if (input.charCodeAt(pos.offset) === 40) {
              result2 = "(";
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"(\"");
              }
            }
            if (result2 !== null) {
              pos2 = clone(pos);
              result3 = [];
              pos3 = clone(pos);
              result4 = parse___();
              if (result4 !== null) {
                result5 = parse_boolean_expr();
                if (result5 !== null) {
                  result6 = parse___();
                  if (result6 !== null) {
                    if (input.charCodeAt(pos.offset) === 44) {
                      result7 = ",";
                      advance(pos, 1);
                    } else {
                      result7 = null;
                      if (reportFailures === 0) {
                        matchFailed("\",\"");
                      }
                    }
                    if (result7 !== null) {
                      result4 = [result4, result5, result6, result7];
                    } else {
                      result4 = null;
                      pos = clone(pos3);
                    }
                  } else {
                    result4 = null;
                    pos = clone(pos3);
                  }
                } else {
                  result4 = null;
                  pos = clone(pos3);
                }
              } else {
                result4 = null;
                pos = clone(pos3);
              }
              while (result4 !== null) {
                result3.push(result4);
                pos3 = clone(pos);
                result4 = parse___();
                if (result4 !== null) {
                  result5 = parse_boolean_expr();
                  if (result5 !== null) {
                    result6 = parse___();
                    if (result6 !== null) {
                      if (input.charCodeAt(pos.offset) === 44) {
                        result7 = ",";
                        advance(pos, 1);
                      } else {
                        result7 = null;
                        if (reportFailures === 0) {
                          matchFailed("\",\"");
                        }
                      }
                      if (result7 !== null) {
                        result4 = [result4, result5, result6, result7];
                      } else {
                        result4 = null;
                        pos = clone(pos3);
                      }
                    } else {
                      result4 = null;
                      pos = clone(pos3);
                    }
                  } else {
                    result4 = null;
                    pos = clone(pos3);
                  }
                } else {
                  result4 = null;
                  pos = clone(pos3);
                }
              }
              if (result3 !== null) {
                result4 = parse___();
                if (result4 !== null) {
                  result5 = parse_boolean_expr();
                  if (result5 !== null) {
                    result3 = [result3, result4, result5];
                  } else {
                    result3 = null;
                    pos = clone(pos2);
                  }
                } else {
                  result3 = null;
                  pos = clone(pos2);
                }
              } else {
                result3 = null;
                pos = clone(pos2);
              }
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result4 = parse___();
                if (result4 !== null) {
                  if (input.charCodeAt(pos.offset) === 41) {
                    result5 = ")";
                    advance(pos, 1);
                  } else {
                    result5 = null;
                    if (reportFailures === 0) {
                      matchFailed("\")\"");
                    }
                  }
                  if (result5 !== null) {
                    result0 = [result0, result1, result2, result3, result4, result5];
                  } else {
                    result0 = null;
                    pos = clone(pos1);
                  }
                } else {
                  result0 = null;
                  pos = clone(pos1);
                }
              } else {
                result0 = null;
                pos = clone(pos1);
              }
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, funcName, args) {
        		        var argsList = [];
        		        _.each(args[0], function(toks) {
        		            argsList.push(toks[1]);
        		        });
                        argsList.push(args[2]);
                        return new Webvs.AstFuncCall(flattenChars(funcName), argsList);
        		})(pos0.offset, pos0.line, pos0.column, result0[0], result0[3]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        if (result0 === null) {
          result0 = parse_primary_expr();
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_primary_expr() {
        var cacheKey = "primary_expr@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1, result2;
        var pos0, pos1;
        
        result0 = parse_value();
        if (result0 === null) {
          result0 = parse_constant();
          if (result0 === null) {
            result0 = parse_register();
            if (result0 === null) {
              result0 = parse_identifier();
              if (result0 === null) {
                pos0 = clone(pos);
                pos1 = clone(pos);
                if (input.charCodeAt(pos.offset) === 40) {
                  result0 = "(";
                  advance(pos, 1);
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"(\"");
                  }
                }
                if (result0 !== null) {
                  result1 = parse_boolean_expr();
                  if (result1 !== null) {
                    if (input.charCodeAt(pos.offset) === 41) {
                      result2 = ")";
                      advance(pos, 1);
                    } else {
                      result2 = null;
                      if (reportFailures === 0) {
                        matchFailed("\")\"");
                      }
                    }
                    if (result2 !== null) {
                      result0 = [result0, result1, result2];
                    } else {
                      result0 = null;
                      pos = clone(pos1);
                    }
                  } else {
                    result0 = null;
                    pos = clone(pos1);
                  }
                } else {
                  result0 = null;
                  pos = clone(pos1);
                }
                if (result0 !== null) {
                  result0 = (function(offset, line, column, e) { return e; })(pos0.offset, pos0.line, pos0.column, result0[1]);
                }
                if (result0 === null) {
                  pos = clone(pos0);
                }
              }
            }
          }
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_assignable() {
        var cacheKey = "assignable@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0;
        
        result0 = parse_register();
        if (result0 === null) {
          result0 = parse_identifier();
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_identifier() {
        var cacheKey = "identifier@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (/^[a-zA-Z_]/.test(input.charAt(pos.offset))) {
          result0 = input.charAt(pos.offset);
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[a-zA-Z_]");
          }
        }
        if (result0 !== null) {
          result1 = [];
          if (/^[a-zA-Z_0-9]/.test(input.charAt(pos.offset))) {
            result2 = input.charAt(pos.offset);
            advance(pos, 1);
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[a-zA-Z_0-9]");
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            if (/^[a-zA-Z_0-9]/.test(input.charAt(pos.offset))) {
              result2 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[a-zA-Z_0-9]");
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, val) { return new Webvs.AstPrimaryExpr(flattenChars(val).toLowerCase(), "ID"); })(pos0.offset, pos0.line, pos0.column, result0);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_constant() {
        var cacheKey = "constant@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 36) {
          result0 = "$";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"$\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          if (/^[a-zA-Z_0-9]/.test(input.charAt(pos.offset))) {
            result2 = input.charAt(pos.offset);
            advance(pos, 1);
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[a-zA-Z_0-9]");
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            if (/^[a-zA-Z_0-9]/.test(input.charAt(pos.offset))) {
              result2 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[a-zA-Z_0-9]");
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, val) { return new Webvs.AstPrimaryExpr(flattenChars(val).toLowerCase(), "CONST"); })(pos0.offset, pos0.line, pos0.column, result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_register() {
        var cacheKey = "register@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 64) {
          result0 = "@";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"@\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          if (/^[a-zA-Z_0-9]/.test(input.charAt(pos.offset))) {
            result2 = input.charAt(pos.offset);
            advance(pos, 1);
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[a-zA-Z_0-9]");
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            if (/^[a-zA-Z_0-9]/.test(input.charAt(pos.offset))) {
              result2 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[a-zA-Z_0-9]");
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, val) { return new Webvs.AstPrimaryExpr("__REG_AT_" + flattenChars(val).toLowerCase(), "REG"); })(pos0.offset, pos0.line, pos0.column, result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        if (result0 === null) {
          pos0 = clone(pos);
          pos1 = clone(pos);
          if (/^[rR]/.test(input.charAt(pos.offset))) {
            result0 = input.charAt(pos.offset);
            advance(pos, 1);
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("[rR]");
            }
          }
          if (result0 !== null) {
            if (/^[eE]/.test(input.charAt(pos.offset))) {
              result1 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[eE]");
              }
            }
            if (result1 !== null) {
              if (/^[gG]/.test(input.charAt(pos.offset))) {
                result2 = input.charAt(pos.offset);
                advance(pos, 1);
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("[gG]");
                }
              }
              if (result2 !== null) {
                if (/^[0-9]/.test(input.charAt(pos.offset))) {
                  result3 = input.charAt(pos.offset);
                  advance(pos, 1);
                } else {
                  result3 = null;
                  if (reportFailures === 0) {
                    matchFailed("[0-9]");
                  }
                }
                if (result3 !== null) {
                  if (/^[0-9]/.test(input.charAt(pos.offset))) {
                    result4 = input.charAt(pos.offset);
                    advance(pos, 1);
                  } else {
                    result4 = null;
                    if (reportFailures === 0) {
                      matchFailed("[0-9]");
                    }
                  }
                  if (result4 !== null) {
                    result0 = [result0, result1, result2, result3, result4];
                  } else {
                    result0 = null;
                    pos = clone(pos1);
                  }
                } else {
                  result0 = null;
                  pos = clone(pos1);
                }
              } else {
                result0 = null;
                pos = clone(pos1);
              }
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
          if (result0 !== null) {
            result0 = (function(offset, line, column, val) { return new Webvs.AstPrimaryExpr("__REG_" + flattenChars(val).toLowerCase(), "REG"); })(pos0.offset, pos0.line, pos0.column, result0);
          }
          if (result0 === null) {
            pos = clone(pos0);
          }
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_value() {
        var cacheKey = "value@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1, pos2;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        result0 = [];
        if (/^[0-9]/.test(input.charAt(pos.offset))) {
          result1 = input.charAt(pos.offset);
          advance(pos, 1);
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("[0-9]");
          }
        }
        while (result1 !== null) {
          result0.push(result1);
          if (/^[0-9]/.test(input.charAt(pos.offset))) {
            result1 = input.charAt(pos.offset);
            advance(pos, 1);
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("[0-9]");
            }
          }
        }
        if (result0 !== null) {
          if (input.charCodeAt(pos.offset) === 46) {
            result1 = ".";
            advance(pos, 1);
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\".\"");
            }
          }
          if (result1 !== null) {
            if (/^[0-9]/.test(input.charAt(pos.offset))) {
              result3 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("[0-9]");
              }
            }
            if (result3 !== null) {
              result2 = [];
              while (result3 !== null) {
                result2.push(result3);
                if (/^[0-9]/.test(input.charAt(pos.offset))) {
                  result3 = input.charAt(pos.offset);
                  advance(pos, 1);
                } else {
                  result3 = null;
                  if (reportFailures === 0) {
                    matchFailed("[0-9]");
                  }
                }
              }
            } else {
              result2 = null;
            }
            if (result2 !== null) {
              pos2 = clone(pos);
              if (/^[Ee]/.test(input.charAt(pos.offset))) {
                result3 = input.charAt(pos.offset);
                advance(pos, 1);
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("[Ee]");
                }
              }
              if (result3 !== null) {
                if (/^[0-9]/.test(input.charAt(pos.offset))) {
                  result5 = input.charAt(pos.offset);
                  advance(pos, 1);
                } else {
                  result5 = null;
                  if (reportFailures === 0) {
                    matchFailed("[0-9]");
                  }
                }
                if (result5 !== null) {
                  result4 = [];
                  while (result5 !== null) {
                    result4.push(result5);
                    if (/^[0-9]/.test(input.charAt(pos.offset))) {
                      result5 = input.charAt(pos.offset);
                      advance(pos, 1);
                    } else {
                      result5 = null;
                      if (reportFailures === 0) {
                        matchFailed("[0-9]");
                      }
                    }
                  }
                } else {
                  result4 = null;
                }
                if (result4 !== null) {
                  result3 = [result3, result4];
                } else {
                  result3 = null;
                  pos = clone(pos2);
                }
              } else {
                result3 = null;
                pos = clone(pos2);
              }
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = clone(pos1);
              }
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, val) { return new Webvs.AstPrimaryExpr(parseFloat(flattenChars(val)), "VALUE"); })(pos0.offset, pos0.line, pos0.column, result0);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        if (result0 === null) {
          pos0 = clone(pos);
          pos1 = clone(pos);
          if (/^[a-fA-F0-9]/.test(input.charAt(pos.offset))) {
            result1 = input.charAt(pos.offset);
            advance(pos, 1);
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("[a-fA-F0-9]");
            }
          }
          if (result1 !== null) {
            result0 = [];
            while (result1 !== null) {
              result0.push(result1);
              if (/^[a-fA-F0-9]/.test(input.charAt(pos.offset))) {
                result1 = input.charAt(pos.offset);
                advance(pos, 1);
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("[a-fA-F0-9]");
                }
              }
            }
          } else {
            result0 = null;
          }
          if (result0 !== null) {
            if (/^[hH]/.test(input.charAt(pos.offset))) {
              result1 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[hH]");
              }
            }
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
          if (result0 !== null) {
            result0 = (function(offset, line, column, val) { return new Webvs.AstPrimaryExpr(parseInt(flattenChars(val), 16), "VALUE"); })(pos0.offset, pos0.line, pos0.column, result0[0]);
          }
          if (result0 === null) {
            pos = clone(pos0);
          }
          if (result0 === null) {
            pos0 = clone(pos);
            pos1 = clone(pos);
            if (/^[0-9]/.test(input.charAt(pos.offset))) {
              result1 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[0-9]");
              }
            }
            if (result1 !== null) {
              result0 = [];
              while (result1 !== null) {
                result0.push(result1);
                if (/^[0-9]/.test(input.charAt(pos.offset))) {
                  result1 = input.charAt(pos.offset);
                  advance(pos, 1);
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("[0-9]");
                  }
                }
              }
            } else {
              result0 = null;
            }
            if (result0 !== null) {
              if (/^[dD]/.test(input.charAt(pos.offset))) {
                result1 = input.charAt(pos.offset);
                advance(pos, 1);
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("[dD]");
                }
              }
              result1 = result1 !== null ? result1 : "";
              if (result1 !== null) {
                result0 = [result0, result1];
              } else {
                result0 = null;
                pos = clone(pos1);
              }
            } else {
              result0 = null;
              pos = clone(pos1);
            }
            if (result0 !== null) {
              result0 = (function(offset, line, column, val) { return new Webvs.AstPrimaryExpr(parseInt(flattenChars(val), 10), "VALUE"); })(pos0.offset, pos0.line, pos0.column, result0[0]);
            }
            if (result0 === null) {
              pos = clone(pos0);
            }
          }
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse___() {
        var cacheKey = "__@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1;
        
        result0 = [];
        result1 = parse_whiteSpace();
        if (result1 === null) {
          result1 = parse_lineEnd();
          if (result1 === null) {
            result1 = parse_comment();
          }
        }
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_whiteSpace();
          if (result1 === null) {
            result1 = parse_lineEnd();
            if (result1 === null) {
              result1 = parse_comment();
            }
          }
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_whiteSpace() {
        var cacheKey = "whiteSpace@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0;
        
        if (/^[\t\x0B\f \xA0\uFEFF]/.test(input.charAt(pos.offset))) {
          result0 = input.charAt(pos.offset);
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\t\\x0B\\f \\xA0\\uFEFF]");
          }
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_lineEnd() {
        var cacheKey = "lineEnd@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0;
        
        if (/^[\n\r\u2028\u2029]/.test(input.charAt(pos.offset))) {
          result0 = input.charAt(pos.offset);
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\n\\r\\u2028\\u2029]");
          }
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      function parse_comment() {
        var cacheKey = "comment@" + pos.offset;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = clone(cachedResult.nextPos);
          return cachedResult.result;
        }
        
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = clone(pos);
        if (input.substr(pos.offset, 2) === "/*") {
          result0 = "/*";
          advance(pos, 2);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"/*\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          pos1 = clone(pos);
          pos2 = clone(pos);
          reportFailures++;
          if (input.substr(pos.offset, 2) === "*/") {
            result2 = "*/";
            advance(pos, 2);
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("\"*/\"");
            }
          }
          reportFailures--;
          if (result2 === null) {
            result2 = "";
          } else {
            result2 = null;
            pos = clone(pos2);
          }
          if (result2 !== null) {
            if (input.length > pos.offset) {
              result3 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("any character");
              }
            }
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = clone(pos1);
            }
          } else {
            result2 = null;
            pos = clone(pos1);
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = clone(pos);
            pos2 = clone(pos);
            reportFailures++;
            if (input.substr(pos.offset, 2) === "*/") {
              result2 = "*/";
              advance(pos, 2);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"*/\"");
              }
            }
            reportFailures--;
            if (result2 === null) {
              result2 = "";
            } else {
              result2 = null;
              pos = clone(pos2);
            }
            if (result2 !== null) {
              if (input.length > pos.offset) {
                result3 = input.charAt(pos.offset);
                advance(pos, 1);
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("any character");
                }
              }
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = clone(pos1);
              }
            } else {
              result2 = null;
              pos = clone(pos1);
            }
          }
          if (result1 !== null) {
            if (input.substr(pos.offset, 2) === "*/") {
              result2 = "*/";
              advance(pos, 2);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"*/\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = clone(pos0);
            }
          } else {
            result0 = null;
            pos = clone(pos0);
          }
        } else {
          result0 = null;
          pos = clone(pos0);
        }
        if (result0 === null) {
          pos0 = clone(pos);
          if (input.substr(pos.offset, 2) === "//") {
            result0 = "//";
            advance(pos, 2);
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"//\"");
            }
          }
          if (result0 !== null) {
            result1 = [];
            pos1 = clone(pos);
            pos2 = clone(pos);
            reportFailures++;
            result2 = parse_lineEnd();
            reportFailures--;
            if (result2 === null) {
              result2 = "";
            } else {
              result2 = null;
              pos = clone(pos2);
            }
            if (result2 !== null) {
              if (input.length > pos.offset) {
                result3 = input.charAt(pos.offset);
                advance(pos, 1);
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("any character");
                }
              }
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = clone(pos1);
              }
            } else {
              result2 = null;
              pos = clone(pos1);
            }
            while (result2 !== null) {
              result1.push(result2);
              pos1 = clone(pos);
              pos2 = clone(pos);
              reportFailures++;
              result2 = parse_lineEnd();
              reportFailures--;
              if (result2 === null) {
                result2 = "";
              } else {
                result2 = null;
                pos = clone(pos2);
              }
              if (result2 !== null) {
                if (input.length > pos.offset) {
                  result3 = input.charAt(pos.offset);
                  advance(pos, 1);
                } else {
                  result3 = null;
                  if (reportFailures === 0) {
                    matchFailed("any character");
                  }
                }
                if (result3 !== null) {
                  result2 = [result2, result3];
                } else {
                  result2 = null;
                  pos = clone(pos1);
                }
              } else {
                result2 = null;
                pos = clone(pos1);
              }
            }
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = clone(pos0);
            }
          } else {
            result0 = null;
            pos = clone(pos0);
          }
        }
        
        cache[cacheKey] = {
          nextPos: clone(pos),
          result:  result0
        };
        return result0;
      }
      
      
      function cleanupExpected(expected) {
        expected.sort();
        
        var lastExpected = null;
        var cleanExpected = [];
        for (var i = 0; i < expected.length; i++) {
          if (expected[i] !== lastExpected) {
            cleanExpected.push(expected[i]);
            lastExpected = expected[i];
          }
        }
        return cleanExpected;
      }
      
      
      
          function makeBinaryExpr(head, tail) {
              var result = head;
              _.each(tail, function(tailItem) {
                  result = new Webvs.AstBinaryExpr(tailItem[1], result, tailItem[3]);
              });
              return result;
          }
      
          function flattenChars(val) {
              return _.flatten(val).join("");
          }
      
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos.offset === input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos.offset < input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos.offset === 0|
       *   - |rightmostFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos.offset !== input.length) {
        var offset = Math.max(pos.offset, rightmostFailuresPos.offset);
        var found = offset < input.length ? input.charAt(offset) : null;
        var errorPosition = pos.offset > rightmostFailuresPos.offset ? pos : rightmostFailuresPos;
        
        throw new this.SyntaxError(
          cleanupExpected(rightmostFailuresExpected),
          found,
          offset,
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(expected, found, offset, line, column) {
    function buildMessage(expected, found) {
      var expectedHumanized, foundHumanized;
      
      switch (expected.length) {
        case 0:
          expectedHumanized = "end of input";
          break;
        case 1:
          expectedHumanized = expected[0];
          break;
        default:
          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
            + " or "
            + expected[expected.length - 1];
      }
      
      foundHumanized = found ? quote(found) : "end of input";
      
      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
    }
    
    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.message = buildMessage(expected, found);
    this.offset = offset;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();
/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * An object that encapsulates the generated executable code
 * and its state values. Also contains implementations of
 * functions callable from expressions
 * @constructor
 * @memberof Webvs
 */
function CodeInstance() {}
Webvs.CodeInstance = Webvs.defineClass(CodeInstance, Object, {
    /**
     * avs expression rand function
     * @memberof Webvs.CodeInstance#
     */
    rand: function(max) { 
        return Math.floor(Math.random() * max) + 1;
    },

    /**
     * avs expression gettime function
     * @memberof Webvs.CodeInstance#
     */
    gettime: function(startTime) {
        switch(startTime) {
            case 0:
                var currentTime = (new Date()).getTime();
                return (currentTime-this._bootTime)/1000;
            default: throw new Error("Invalid startTime mode for gettime call");
        }
    },

    /**
     * avs expression getosc function
     * @memberof Webvs.CodeInstance#
     */
    getosc: function(band, width, channel) {
        var osc = this._analyser.getWaveform();
        var pos = Math.floor((band - width/2)*(osc.length-1));
        var end = Math.floor((band + width/2)*(osc.length-1));

        var sum = 0;
        for(var i = pos;i <= end;i++) {
            sum += osc[i];
        }
        return sum/(end-pos+1);
    },

    /**
     * bind state values to uniforms
     * @param {Webvs.ShaderProgram} program - program to which the state values 
     *                                        should be bound
     * @memberof Webvs.CodeInstance#
     */
    bindUniforms: function(program) {
        var that = this;
        // bind all values
        var toBeBound = _.difference(_.keys(this), this._treatAsNonUniform);
        _.each(toBeBound, function(name) {
            var value = that[name];
            if(typeof value !== "number") { return; }
            program.setUniform(name, "1f", value);
        });

        // bind registers
        _.each(this._registerUsages, function(name) {
            program.setUniform(name, "1f", this._registerBank[name]);
        });

        // bind random step value if there are usages of random
        if(this.hasRandom) {
            var step = [Math.random()/100, Math.random()/100];
            program.setUniform("__randStep", "2fv", step);
        }

        // bind time values for gettime calls
        if(this.hasGettime) {
            var time0 = ((new Date()).getTime()-this._bootTime)/1000;
            program.setUniform("__gettime0", "1f", time0);
        }

        // bind precomputed values
        _.each(this._preCompute, function(item, index) {
            var args = _.map(_.last(item, item.length-2), function(arg) {
                if(_.isString(arg)) {
                    if(arg.substring(0, 5) == "__REG") {
                        return this._registerBank[arg];
                    } else {
                        return this[arg];
                    }
                } else {
                    return arg;
                }
            });
            var result = this[item[0]].apply(this, args);
            program.setUniform(item[1], "1f", result);
        });
    },

    /**
     * initializes this codeinstance
     * @param {Webvs.Main} main - webvs main instance
     * @param {Webvs.Component} parent - the component thats using this codeinstance
     * @memberof Webvs.CodeInstance#
     */
    setup: function(main, parent) {
        this._registerBank = main.registerBank;
        this._bootTime = main.bootTime;
        this._analyser = main.analyser;

        this.w = main.canvas.width;
        this.h = main.canvas.height;

        // clear all used registers
        _.each(this._registerUsages, function(name) {
            if(!_.has(main.registerBank, name)) {
                main.registerBank[name] = 0;
            }
        });
    }
});

CodeInstance.clone = function(codeInst, count) {
    codeInst.cid = 0;
    var clones = [codeInst];
    if(count > 1) {
        _.times(count-1, function(index) {
            var clone = _.clone(codeInst);
            clone.cid = index+1;
            clones.push(clone);
        });
    }
    return clones;
};


})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * AVS expression parser and code generator.
 * Generates JS and GLSL code from avs expressions
 * @param {object.<string, string>} codeSrc - object containing avs expression code string
 * @param {Array.<string>} externalVars - list of variables that will be supplied externally.
 * @memberof Webvs
 * @constructor
 */
function ExprCodeGenerator(codeSrc, externalVars) {
    this.codeSrc = {};
    for(var key in codeSrc) {
        var code = codeSrc[key];
        if(_.isArray(code)) {
            code = code.join("\n");
        }
        code = code.trim();
        if(code !== "") {
            this.codeSrc[key] = code;
        }
    }
    this.externalVars = _.union(externalVars || [], ["w", "h", "cid"]);
    this._parseSrc();
}
Webvs.ExprCodeGenerator = Webvs.defineClass(ExprCodeGenerator, Object, {
    _parseSrc: function() {
        // Generate AST and find variables usages in all the expressions
        var codeAst = {};
        var variables = [];
        var funcUsages = {};
        var registerUsages = [];
        for(var name in this.codeSrc) {
            try {
                var codeSrc = this.codeSrc[name];
                codeAst[name] = Webvs.PegExprParser.parse(codeSrc);
                var vars = [];
                var fu = [];
                this._getVars(codeAst[name], variables, fu, registerUsages);
                funcUsages[name] = fu;
            } catch(e) {
                throw new Error("Error parsing " + name + "(" + e.line + ":" + e.column + ")" + " : " + e);
            }
        }
        this.codeAst = codeAst;
        this.funcUsages = funcUsages;

        // find instance variables
        this.instanceVars = _.uniq(this.externalVars.concat(variables));

        // find register variable usages
        this.registerUsages = _.uniq(registerUsages);
    },

    /**
     * Generates js and glsl executable code for each expression code string
     * @param {Array.<string>} jsFuncs - functions to be generated as javascript
     * @param {Array.<string>} jsFuncs - functions to be generated as glsl
     * @param {Array.<string>} treatAsNonUniform - variables to be treated as 
     *                                             uniform variables in the glsl code
     * @returns {Array} pair containing {@link Webvs.CodeInstance} and a glsl code
     * @memberof Webvs.ExprCodeGenerator#
     */
    generateJs: function(jsFuncs) {
        var codeInst = new Webvs.CodeInstance();

        _.each(this.instanceVars, function(ivar) {
            codeInst[ivar] = 0;
        });

        var jsFuncList = _.intersection(_.keys(this.codeAst), jsFuncs);
        var missingJsFuncList = _.difference(jsFuncs, jsFuncList);

        // generate javascript functions and assign to code instance
        _.each(jsFuncList, function(name) {
            var ast = this.codeAst[name];
            var codeString = this._generateJs(ast);
            codeInst[name] = new Function(codeString);
        }, this);
        // add noops for missing expressions
        _.each(missingJsFuncList, function(name) {
            codeInst[name] = Webvs.noop;
        });

        codeInst._registerUsages = this.registerUsages;

        return codeInst;
    },

    generateGlsl: function(glslFuncs, treatAsNonUniform, codeInst) {
        var glsl = [];
        treatAsNonUniform = treatAsNonUniform || [];

        _.each(this.instanceVars, function(ivar) {
            // create declarations for instance variables in glsl
            var prefix = "";
            if(!_.contains(treatAsNonUniform, ivar)) {
                prefix = "uniform ";
            }
            glsl.push(prefix + "float " + ivar + ";");
        });

        var glslFuncList = _.intersection(_.keys(this.codeAst), glslFuncs);
        var missingGlslFuncList = _.difference(glslFuncs, glslFuncList);
        var glsFuncUsages = _.uniq(
            _.flatMap(glslFuncList, function(name) { return this.funcUsages[name]; }, this)
        );

        // include required functions in glsl
        _.each(glsFuncUsages, function(usage) {
            var code = this.glslFuncCode[usage];
            if(!code) {
                return;
            }
            glsl.push(code);
        }, this);
        var preCompute = []; // list of precomputed bindings
        var generatedGlslFuncs = [];
        // generate glsl functions
        _.each(glslFuncList, function(name) {
            var ast = this.codeAst[name];
            var codeString = this._generateGlsl(ast, preCompute);
            generatedGlslFuncs.push("void " + name + "() {");
            generatedGlslFuncs.push(codeString);
            generatedGlslFuncs.push("}");
        }, this);
        // add the uniform declarations for precomputed functions
        glsl = glsl.concat(_.map(preCompute, function(item) {
            return "uniform float " + item[1] + ";";
        }));
        glsl = glsl.concat(generatedGlslFuncs);

        // generate noops for missing functions
        _.each(missingGlslFuncList, function(name) {
            glsl.push("void " + name + "() {}");
        });

        // create required bindings in the code instance
        codeInst._preCompute = preCompute;
        if(_.contains(glslFuncList, "rand")) {
            codeInst.hasRandom = true;
        }
        if(_.contains(glslFuncList, "gettime")) {
            codeInst.hasGettime = true;
        }
        codeInst._treatAsNonUniform = treatAsNonUniform;

        return glsl.join("\n");
    },

    funcArgLengths: {
        "above": 2,
        "below": 2,
        "equal": 2,
        "pow": 2,
        "sqr": 1,
        "sqrt": 1,
        "invsqrt": 1,
        "floor" : 1,
        "ceil" : 1,
        "abs": 1,
        "if": 3,
        "min": 2,
        "max": 2,
        "sin": 1,
        "cos": 1,
        "tan": 1,
        "asin": 1,
        "acos": 1,
        "atan": 1,
        "atan2": 2,
        "log": 1,
        "band": 2,
        "bor": 2,
        "bnot": 1,
        "rand": 1,
        "gettime": 1,
        "getosc": 3,
        "select": {min: 2}
    },

    jsMathFuncs: ["min", "max", "sin", "cos", "abs", "tan", "asin", "acos", "atan", "log", "pow", "sqrt", "floor", "ceil"],

    glslFuncCode: {
        "rand": [
            "uniform vec2 __randStep;",
            "vec2 __randSeed;",
            "float rand(float max) {",
            "   __randCur += __randStep;",
            "   float val = fract(sin(dot(__randSeed.xy ,vec2(12.9898,78.233))) * 43758.5453);",
            "   return (floor(val*max)+1);",
            "}"
        ].join("\n"),
        "gettime": [
            "uniform float __gettime0;",
            "int gettime(int startTime) {",
            "   int time = 0;",
            "   if(startTime == 0) {",
            "       time = __gettime0;",
            "   }",
            "   return time;",
            "}"
        ].join("\n")
    },

    _checkFunc: function(ast) {
        var requiredArgLength = this.funcArgLengths[ast.funcName];
        if(requiredArgLength === undefined) {
            throw Error("Unknown function " + ast.funcName);
        }
        if(_.isNumber(requiredArgLength)) {
            if(ast.args.length != requiredArgLength) {
                throw Error(ast.funcName + " accepts " + requiredArgLength + " arguments");
            }
        } else if(requiredArgLength.min) {
            if(ast.args.length < requiredArgLength.min) {
                throw Error(ast.funcName + " accepts atleast " + requiredArgLength.min + " arguments");
            }
        }
    },

    _generateGlsl: function(ast, preCompute) {

        if(ast instanceof Webvs.AstBinaryExpr) {
            return "(" + this._generateGlsl(ast.leftOperand, preCompute) + ast.operator + this._generateGlsl(ast.rightOperand, preCompute) + ")";
        }
        if(ast instanceof Webvs.AstUnaryExpr) {
            return "(" + ast.operator + this._generateGlsl(ast.operand, preCompute) + ")";
        }
        if(ast instanceof Webvs.AstFuncCall) {
            this._checkFunc(ast);
            switch(ast.funcName) {
                case "above":
                    return [
                        "(",
                        this._generateGlsl(ast.args[0], preCompute),
                        ">",
                        this._generateGlsl(ast.args[1], preCompute),
                        "?1.0:0.0)"
                    ].join("");
                case "below":
                    return [
                        "(",
                        this._generateGlsl(ast.args[0], preCompute),
                        "<",
                        this._generateGlsl(ast.args[1], preCompute),
                        "?1.0:0.0)"
                    ].join("");
                case "equal":
                    return [
                        "(",
                        this._generateGlsl(ast.args[0], preCompute),
                        "==",
                        this._generateGlsl(ast.args[1], preCompute),
                        "?1.0:0.0)"
                    ].join("");
                case "if":
                    return [
                        "(",
                        this._generateGlsl(ast.args[0], preCompute),
                        "!=0.0?",
                        this._generateGlsl(ast.args[1], preCompute),
                        ":",
                        this._generateGlsl(ast.args[2], preCompute),
                        ")"
                    ].join("");
                case "select":
                    var selectExpr = this._generateGlsl(ast.args[0], preCompute);
                    var that = this;
                    var generateSelect = function(args, i) {
                        if(args.length == 1) {
                            return that._generateGlsl(args[0], preCompute);
                        }
                        else {
                            return [
                                "(("+selectExpr+" === "+i+")?",
                                "("+that._generateGlsl(args[0], preCompute)+"):",
                                "("+generateSelect(_.last(args, args.length-1), i+1)+"))"
                            ].join("");
                        }
                    };
                    return generateSelect(_.last(ast.args, ast.args.length-1), 0);
                case "sqr":
                    return "(pow((" + this._generateGlsl(ast.args[0], preCompute) + "), 2))";
                case "band":
                    return "(float(("+this._generateGlsl(ast.args[0], preCompute)+")&&("+this._generateGlsl(ast.args[1], preCompute)+")))";
                case "bor":
                    return "(float(("+this._generateGlsl(ast.args[0], preCompute)+")||("+this._generateGlsl(ast.args[1], preCompute)+")))";
                case "bnot":
                    return "(float(!("+this._generateGlsl(ast.args[0], preCompute)+")))";
                case "invsqrt":
                    return "(1/sqrt("+this._generateGlsl(ast.args[0], preCompute)+"))";
                case "atan2":
                    return "(atan(("+this._generateGlsl(ast.args[0], preCompute)+"),("+this._generateGlsl(ast.args[1], preCompute)+"))";
                case "getosc":
                    var allStatic = _.every(ast.args, function(arg) {
                        return arg instanceof Webvs.AstPrimaryExpr;
                    });
                    if(!allStatic) {
                        throw new Error("Non Pre-Computable arguments for getosc in shader code, use variables or constants");
                    }
                    var uniformName = "__PC_" +  ast.funcName + "_" + pos;
                    var item = [ast.funcName, uniformName].concat(_.map(ast.args, function(arg) {return arg.value;}));
                    var pos = _.indexOf(preCompute, item);
                    if(pos == -1) {
                        preCompute.push(item);
                        pos = preCompute.length-1;
                    }
                    return uniformName;
                default:
                    var args = _.map(ast.args, function(arg) {return this._generateGlsl(arg, preCompute);}, this).join(",");
                    var funcName = ast.funcName;
                    if(_.contains(this.varArgFuncs, ast.funcName)) {
                        funcName += ast.args.length;
                    }
                    return "(" + funcName + "(" + args + "))";
            }
        }
        if(ast instanceof Webvs.AstAssignment) {
            return this._generateGlsl(ast.lhs, preCompute) + "=" + this._generateGlsl(ast.expr, preCompute);
        }
        if(ast instanceof Webvs.AstProgram) {
            var stmts = _.map(ast.statements, function(stmt) {return this._generateGlsl(stmt, preCompute);}, this);
            return stmts.join(";\n")+";";
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "VALUE") {
            return Webvs.glslFloatRepr(ast.value);
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "CONST") {
            return this._translateConstants(ast.value).toString();
        }
        if(ast instanceof Webvs.AstPrimaryExpr && (ast.type === "ID" || ast.type === "REG")) {
            return ast.value;
        }
    },

    _generateJs: function(ast) {
        var prefix;

        if(ast instanceof Webvs.AstBinaryExpr) {
            return "(" + this._generateJs(ast.leftOperand) + ast.operator + this._generateJs(ast.rightOperand) + ")";
        }
        if(ast instanceof Webvs.AstUnaryExpr) {
            return "(" + ast.operator + this._generateJs(ast.operand) + ")";
        }
        if(ast instanceof Webvs.AstFuncCall) {
            this._checkFunc(ast);
            switch(ast.funcName) {
                case "above":
                    return [
                        "(",
                        this._generateJs(ast.args[0]),
                        ">",
                        this._generateJs(ast.args[1]),
                        "?1:0)"
                    ].join("");
                case "below":
                    return [
                        "(",
                        this._generateJs(ast.args[0]),
                        "<",
                        this._generateJs(ast.args[1]),
                        "?1:0)"
                    ].join("");
                case "equal":
                    return [
                        "(",
                        this._generateJs(ast.args[0]),
                        "==",
                        this._generateJs(ast.args[1]),
                        "?1:0)"
                    ].join("");
                case "if":
                    return [
                        "(",
                        this._generateJs(ast.args[0]),
                        "!==0?",
                        this._generateJs(ast.args[1]),
                        ":",
                        this._generateJs(ast.args[2]),
                        ")"
                    ].join("");
                case "select":
                    var code = ["((function() {"];
                    code.push("switch("+this._generateJs(ast.args[0])+") {");
                    _.each(_.last(ast.args, ast.args.length-1), function(arg, i) {
                        code.push("case "+i+": return "+this._generateJs(arg)+";");
                    }, this);
                    code.push("default : throw new Error('Unknown selector value in select');");
                    code.push("}}).call(this))");
                    return code.join("");
                case "sqr":
                    return "(Math.pow((" + this._generateJs(ast.args[0]) + "),2))";
                case "band":
                    return "((("+this._generateJs(ast.args[0])+")&&("+this._generateJs(ast.args[1])+"))?1:0)";
                case "bor":
                    return "((("+this._generateJs(ast.args[0])+")||("+this._generateJs(ast.args[1])+"))?1:0)";
                case "bnot":
                    return "((!("+this._generateJs(ast.args[0])+"))?1:0)";
                case "invsqrt":
                    return "(1/Math.sqrt("+this._generateJs(ast.args[0])+"))";
                case "atan2":
                    return "(Math.atan(("+this._generateJs(ast.args[0])+")/("+this._generateJs(ast.args[1])+")))";
                default:
                    var args = _.map(ast.args, function(arg) {return this._generateJs(arg);}, this).join(",");
                    if(_.contains(this.jsMathFuncs, ast.funcName)) {
                        prefix = "Math.";
                    } else {
                        prefix = "this.";
                    }
                    return "(" + prefix + ast.funcName + "(" + args + "))";
            }
        }
        if(ast instanceof Webvs.AstAssignment) {
            return this._generateJs(ast.lhs) + "=" + this._generateJs(ast.expr);
        }
        if(ast instanceof Webvs.AstProgram) {
            var stmts = _.map(ast.statements, function(stmt) {return this._generateJs(stmt);}, this);
            return stmts.join(";\n");
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "VALUE") {
            return ast.value.toString();
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "CONST") {
            return this._translateConstants(ast.value).toString();
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "ID") {
            return "this." + ast.value;
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "REG") {
            return "this._registerBank[\"" + ast.value + "\"]";
        }
    },

    _getVars: function(ast, vars, funcUsages, regUsages) {
        if(ast instanceof Webvs.AstBinaryExpr) {
            this._getVars(ast.leftOperand, vars, funcUsages, regUsages);
            this._getVars(ast.rightOperand, vars, funcUsages, regUsages);
        }

        else if(ast instanceof Webvs.AstUnaryExpr) {
            this._getVars(ast.operand, vars, funcUsages, regUsages);
        }
        else if(ast instanceof Webvs.AstFuncCall) {
            funcUsages.push(ast.funcName);
            _.each(ast.args, function(arg) {
               this._getVars(arg, vars, funcUsages, regUsages);
            }, this);
        }
        else if(ast instanceof Webvs.AstAssignment) {
            this._getVars(ast.lhs, vars, funcUsages, regUsages);
            this._getVars(ast.expr, vars, funcUsages, regUsages);
        }
        else if(ast instanceof Webvs.AstProgram) {
            _.each(ast.statements, function(stmt) {
                this._getVars(stmt, vars, funcUsages, regUsages);
            }, this);
        }
        else if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "ID") {
            vars.push(ast.value);
        }
        else if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "REG") {
            regUsages.push(ast.value);
        }
    },

    _translateConstants: function(value) {
        switch(value) {
            case "pi": return Math.PI;
            case "e": return Math.E;
            case "phi": return 1.6180339887;
            default: throw new Error("Unknown constant " + value);
        }
    }
});

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that simply runs some avs expressions.
 * Useful to maintain global state
 *
 * @param {object} options - options object
 * @param {string} [options.code.init] - code to be run at startup
 * @param {string} [options.code.onBeat] - code to be run when a beat occurs
 * @param {string} [ptions.code.perFrame]- code to be run on every frame
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
function GlobalVar(options) {
	Webvs.checkRequiredOptions(options, ["code"]);
	var codeGen = new Webvs.ExprCodeGenerator(options.code, ["b"]);
    this.code = codeGen.generateJs(["init", "onBeat", "perFrame"]);
    this.inited = false;

    GlobalVar.super.constructor.apply(this, arguments);
}
Webvs.GlobalVar = Webvs.defineClass(GlobalVar, Webvs.Component, {
    /**
     * initializes the globalvar component
     * @memberof Webvs.GlobalVar#
     */
	init: function(gl, main, parent) {
		GlobalVar.super.init.call(this, gl, main, parent);

        this.code.setup(main, this);
	},

    /**
     * Runs the code
     * @memberof Webvs.GlobalVar#
     */
	update: function() {
		var code = this.code;
		code.b = this.main.analyser.beat?1:0;

		if(!this.inited) {
			code.init();
			this.inited = true;
		}

		if(this.main.analyser.beat) {
			code.onBeat();
		}

		code.perFrame();
	}
});

GlobalVar.ui = {
    disp: "Global Var",
    type: "GlobalVar",
    schema: {
        code: {
            type: "object",
            title: "Code",
            default: {},
            properties: {
                init: {
                    type: "string",
                    title: "Init",
                },
                onBeat: {
                    type: "string",
                    title: "On Beat",
                },
                perFrame: {
                    type: "string",
                    title: "Per Frame",
                }
            },
        }
    }
};

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A components that saves or restores a copy of the current
 * frame buffer.
 *
 * @param {object} options - options object
 * @param {string} [options.action="SAVE"] - the action to be performed. viz. "SAVE",
 *     "RESTORE", "RESTORESAVE", "SAVERESTORE"
 * @param {number} [options.bufferId=1] - an identifying number for the buffer. This number
 *     is used to share buffer between different instances of BufferSave
 * @param {string} [options.blendMode="REPLACE"] - blending mode when restoring buffers
 * @constructor
 * @augments Webvs.Component
 * @memberof Webvs
 */
function BufferSave(options) {
    options = _.defaults(options, {
        action: "SAVE",
        bufferId: 1,
        blendMode: "REPLACE"
    });
    this.blendMode = Webvs.blendModes[options.blendMode];
    this.action = this.actions[options.action];
    if(!this.action) {
        throw new Error("Unknown BufferSave action " + options.action);
    }

    if(this.action == this.actions.SAVERESTORE) {
        this._nextAction = this.actions.SAVE;
    } else if(this.action == this.actions.RESTORESAVE) {
        this._nextAction = this.actions.RESTORE;
    }
    this._bufferId = "__BUFFERSAVE_" + options.bufferId;
    BufferSave.super.constructor.apply(this, arguments);
}
Webvs.BufferSave  = Webvs.defineClass(BufferSave, Webvs.Component, {
    actions: {
        SAVE: 1,
        RESTORE: 2,
        SAVERESTORE: 3,
        RESTORESAVE: 4
    },

    /**
     * Initializes the BufferSave component
     * @memberof Webvs.BufferSave#
     */
    init: function(gl, main, parent) {
        BufferSave.super.init.call(this, gl, main, parent);

        // create frame buffer manager
        if(!main.registerBank[this._bufferId]) {
            var fm = new Webvs.FrameBufferManager(main.canvas.width, main.canvas.height, gl, main.copier, true, 1);
            main.registerBank[this._bufferId] = fm;
        }
    },

    /**
     * Saves or Renders the current frame
     * @memberof Webvs.BufferSave#
     */
    update: function() {
        var gl = this.gl;
        var fm = this.main.registerBank[this._bufferId];

        // find the current action
        var currentAction;
        if(this.action == this.actions.SAVERESTORE || this.action == this.RESTORESAVE) {
            currentAction = this._nextAction;
            // set the next action
            if(this._nextAction == this.actions.SAVE) {
                this._nextAction = this.actions.RESTORE;
            } else {
                this._nextAction = this.actions.SAVE;
            }
        } else {
            currentAction = this.action;
        }

        switch(currentAction) {
            case this.actions.SAVE:
                fm.setRenderTarget();
                this.main.copier.run(null, null, this.parent.fm.getCurrentTexture());
                fm.restoreRenderTarget();
                break;
            case this.actions.RESTORE:
                this.main.copier.run(this.parent.fm, this.blendMode, fm.getCurrentTexture());
                break;
        }
    },

    /**
     * Releases resources.
     * @memberof Webgl.BufferSave#
     */
    destroy: function() {
        BufferSave.super.destroy.call(this);
        // destroy the framebuffermanager
        this.main.registerBank[this._bufferId].destroy();
    }
});

BufferSave.ui = {
    disp: "Buffer Save",
    type: "BufferSave",
    schema: {
        action: {
            type: "string",
            title: "Buffer save action",
            enum: ["SAVE", "RESTORE", "SAVERESTORE", "RESTORESAVE"]
        },
        bufferId: {
            type: "number",
            title: "Buffer Id",
            enum: [1,2,3,4,5,6,7,8]
        },
        blendMode: {
            type: "string",
            title: "Blend mode",
            enum: _.keys(Webvs.blendModes)
        }
    }
};

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that slowly fades the screen to a specified color
 *
 * @param {object} options - options object
 * @param {number} [speed=1] - speed at which the screen is faded 0 (never) - 1 (fastest)
 * @param {string} [color="#000000"] - fade color
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 * @constructor
 */
function FadeOut(options) {
    options = _.defaults(options, {
        speed: 1,
        color: "#000000"
    });
    this.color = Webvs.parseColorNorm(options.color);

    this.frameCount = 0;
    this.maxFrameCount = Math.floor(1/options.speed);
    this.program = new Webvs.ClearScreenProgram(Webvs.AVERAGE);

    FadeOut.super.constructor.apply(this, arguments);
}
Webvs.FadeOut = Webvs.defineClass(FadeOut, Webvs.Component, {
    componentName: "FadeOut",

    /**
     * initializes the FadeOut component
     * @memberof Webvs.FadeOut#
     */
    init: function(gl, main, parent) {
        FadeOut.super.init.call(this, gl, main, parent);
        this.program.init(gl);
    },

    /**
     * fades the screen
     * @memberof Webvs.FadeOut#
     */
    update: function() {
        var gl = this.gl;
        this.frameCount++;
        if(this.frameCount == this.maxFrameCount) {
            this.frameCount = 0;
            this.program.run(this.parent.fm, null, this.color);
        }
    },

    /**
     * releases resources
     * @memberof Webvs.FadeOut#
     */
    destroy: function() {
        FadeOut.super.destroy.call(this);
        this.program.cleanup();
    }
});

FadeOut.ui = {
    type: "FadeOut",
    disp: "Fade Out",
    schema: {
        speed: {
            type: "number",
            title: "Speed",
            maximum: 0,
            minimum: 1,
            default: 1
        },
        color: {
            type: "string",
            title: "Fadeout color",
            format: "color",
            default: "#FFFFFF"
        }
    },
    form: [
        {key: "speed", type: "range", step: "0.05"},
        "color"
    ]
};

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that applies a convolution kernel
 *
 * @param {object} options - options object
 * @param {Array.<Array.<number>>} options.kernel - an NxN array of numbers
 * @param {number} [options.bias=0] - bias value to be added
 * @param {number} [options.scale] - scale for the kernel. default is sum of kernel values
 * @param {object} [options.edgeMode="EXTEND"] - how the frame edge cases should be handled viz. `WRAP`, `EXTEND`
 *
 * @constructor
 * @augments Webvs.Component
 * @memberof Webvs
 */
function Convolution(options) {
    Webvs.checkRequiredOptions(options, ["kernel"]);
    options = _.defaults(options, {
        edgeMode: "EXTEND",
        bias: 0
    });

    var kernel;
    if(options.kernel in Convolution.kernels) {
        kernel = Convolution.kernels[options.kernel];
    } else if(_.isArray(options.kernel) && options.kernel.length%2 === 1) {
        kernel = options.kernel;
    } else {
        throw new Error("Invalid convolution kernel");
    }

    var kernelSize = Math.floor(Math.sqrt(kernel.length));
    if(kernelSize*kernelSize != kernel.length) {
        throw new Error("Invalid convolution kernel");
    }

    this.program = new Webvs.ConvolutionProgram(kernel, kernelSize, 
                                                options.edgeMode, options.scale,
                                                options.bias);

    Convolution.super.constructor.apply(this, arguments);
}
Webvs.Convolution = Webvs.defineClass(Convolution, Webvs.Component, {
    componentName: "Convolution",

    /**
     * initializes the Convolution component
     * @method
     * @memberof Webvs.Convolution#
     */
    init: function(gl, main, parent) {
        Convolution.super.init.call(this, gl, main, parent);
        this.program.init(gl);
    },

    /**
     * applies the Convolution matrix
     * @method
     * @memberof Webvs.Convolution#
     */
    update: function() {
        this.program.run(this.parent.fm, null);
    },

    /**
     * releases resources
     * @memberof Webvs.Convolution#
     */
    destroy: function() {
        Convolution.super.destroy.call(this);
        this.program.cleanup();
    }
});

Convolution.kernels = {
    normal: [
        0, 0, 0,
        0, 1, 0,
        0, 0, 0
    ],
    gaussianBlur: [
        0.045, 0.122, 0.045,
        0.122, 0.332, 0.122,
        0.045, 0.122, 0.045
    ],
    unsharpen: [
        -1, -1, -1,
        -1,  9, -1,
        -1, -1, -1
    ],
    emboss: [
        -2, -1,  0,
        -1,  1,  1,
        0,  1,  2
    ],
    blur: [
        1, 1, 1,
        1, 1, 1,
        1, 1, 1
    ]
};

function ConvolutionProgram(kernel, kernelSize, edgeMode, scale, bias) {
    // generate edge correction function
    var edgeFunc = "";
    switch(edgeMode) {
        case "WRAP":
            edgeFunc = "pos = vec2(pos.x<0?pos.x+1.0:pos.x%1, pos.y<0?pos.y+1.0:pos.y%1);";
            break;
        case "EXTEND":
            edgeFunc = "pos = clamp(pos, vec2(0,0), vec2(1,1));";
            break;
        default:
            throw new Error("Invalid edge mode");
    }

    var i,j;

    // generate kernel multiplication code
    var colorSumEq = [];
    var mid = Math.floor(kernelSize/2);
    for(i = 0;i < kernelSize;i++) {
        for(j = 0;j < kernelSize;j++) {
            var value = kernel[(i*kernelSize+j)];
            if(value === 0) {
                continue;
            }
            colorSumEq.push("pos = v_position + texel * vec2("+(i-mid)+","+(j-mid)+");");
            colorSumEq.push(edgeFunc);
            colorSumEq.push("colorSum += texture2D(u_srcTexture, pos) * "+Webvs.glslFloatRepr(value)+";");
        }
    }

    // compute kernel scaling factor
    if(_.isUndefined(scale)) {
        scale = _.reduce(kernel, function(memo, num){ return memo + num; }, 0);
    }

    ConvolutionProgram.super.constructor.call(this, {
        swapFrame: true,
        fragmentShader: [
            "void main() {",
            "   vec2 texel = 1.0/(u_resolution-vec2(1,1));",
            "   vec2 pos;",
            "   vec4 colorSum = vec4(0,0,0,0);",
            colorSumEq.join("\n"),
            "   setFragColor(vec4(((colorSum+"+Webvs.glslFloatRepr(bias)+") / "+Webvs.glslFloatRepr(scale)+").rgb, 1.0));",
            "}"
        ]
    });
}
Webvs.ConvolutionProgram = Webvs.defineClass(ConvolutionProgram, Webvs.QuadBoxProgram);

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * a component that changes colors according to a gradient map using
 * a key generated from the source colors
 *
 * @param {object} options - options object
 * @param {Array.<Array.<object>>} options.maps - a set of color maps. each colormap consists of
 *     a set of keystones. The map is generated by interpolating colors between the keystones.
 * @param {string} options.maps[i][j].color - keystone color
 * @param {number} options.maps[i][j].index - position of keystone (0-255)
 * @param {object} options.maps - a set of color map
 * @param {string} [options.key="RED"] - the key function viz. `RED`, `GREEN`, `BLUE`, `(R+G+B)/2`, `(R+G+B)/3`, `MAX`
 * @param {string} [options.output="REPLACE"] - output blending mode
 * @param {string} [options.mapCycleMode="SINGLE"] - how to cycle between maps
 *
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
function ColorMap(options) {
    Webvs.checkRequiredOptions(options, ["maps"]);
    options = _.defaults(options, {
        key: "RED",
        output: "REPLACE",
        mapCycleMode: "SINGLE",
    });

    var that = this;
    this.maps = options.maps;
    this.currentMap = 0;

    this.mapCycleMode = this.mapCycleModes[options.mapCycleMode];
    if(!this.mapCycleMode) {
        throw new Error("Unknown mapCycleMode " + options.mapCycleMode);
    }

    this.program = new Webvs.ColorMapProgram(options.key, Webvs.getBlendMode(options.output));

    ColorMap.super.constructor.apply(this, arguments);
}
Webvs.ColorMap = Webvs.defineClass(ColorMap, Webvs.Component, {
    mapCycleModes: {
        SINGLE: 1,
        ONBEATRANDOM: 2,
        ONBEATSEQUENTIAL: 3
    },

    /**
     * initializes the ColorMap component
     * @memberof Webvs.ColorMap#
     */
    init: function(gl, main, parent) {
        ColorMap.super.init.call(this, gl, main, parent);

        this.colorMaps = _.map(this.maps, function(map) {
            return this._buildColorMap(map);
        }, this);
        this.currentMap = 0;

        this.program.init(gl);
    },

    /**
     * maps the colors
     * @memberof Webvs.ColorMap#
     */
    update: function() {
        if(this.main.analyser.beat) {
            switch(this.mapCycleMode) {
                case this.mapCycleModes.ONBEATRANDOM:
                    this.currentMap = Math.floor(Math.random()*this.colorMaps.length);
                    break;
                case this.mapCycleModes.ONBEATSEQUENTIAL:
                    this.currentMap = (this.currentMap+1)%this.colorMaps.length;
                    break;
            }
        }

        this.program.run(this.parent.fm, null, this.colorMaps[this.currentMap]);
    },

    /**
     * releases resources
     * @memberof Webvs.ColorMap#
     */
    destroy: function() {
        ColorMap.super.destroy.call(this);
        this.program.cleanup();
    },

    _buildColorMap: function(map) {
        var gl = this.gl;
        map = _.sortBy(map, function(mapItem) {return mapItem.index;});

        // check for repeated indices
        var indices = _.map(map, function(mapItem) {return mapItem.index;});
        if(_.uniq(indices).length != indices.length) {
            throw new Error("map cannot have repeated indices");
        }

        // parse all the colors
        map = _.map(map, function(mapItem) {
            var color = Webvs.parseColor(mapItem.color);
            return {color:color, index:mapItem.index};
        });

        // add a cap entries at the ends
        var first = _.first(map);
        if(first.index !== 0) {
            map.splice(0, 0, {color:first.color, index:0});
        }
        var last = _.last(map);
        if(last.index !== 255) {
            map.push({color:last.color, index:255});
        }

        // lerp intermediate values
        var colorMap = new Uint8Array(256*3);
        var cmi = 0;
        var pairs = _.zip(_.first(map, map.length-1), _.last(map, map.length-1));
        _.each(pairs, function(pair, i) {
            var first = pair[0];
            var second = pair[1];
            var steps = second.index - first.index;
            _.times(steps, function(i) {
                colorMap[cmi++] = Math.floor((first.color[0]*(255-i) + second.color[0]*i)/255);
                colorMap[cmi++] = Math.floor((first.color[1]*(255-i) + second.color[1]*i)/255);
                colorMap[cmi++] = Math.floor((first.color[2]*(255-i) + second.color[2]*i)/255);
            });
        });
        colorMap[cmi++] = last.color[0];
        colorMap[cmi++] = last.color[1];
        colorMap[cmi++] = last.color[2];

        // put the color values into a 256x1 texture
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 256, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, colorMap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return texture;
    }
});

function ColorMapProgram(key, blendMode) {
    var keyEq = "";
    switch(key) {
        case "RED": keyEq = "srcColor.r"; break;
        case "GREEN": keyEq = "srcColor.g"; break;
        case "BLUE": keyEq = "srcColor.b"; break;
        case "(R+G+B)/2": keyEq = "mod((srcColor.r+srcColor.g+srcColor.b)/2.0, 1.0)"; break;
        case "(R+G+B)/3": keyEq = "(srcColor.r+srcColor.g+srcColor.b)/3.0"; break;
        case "MAX": keyEq = "max(srcColor.r, max(srcColor.g, srcColor.b))"; break;
        default: throw new Error("Unknown colormap key function " + options.key);
    }

    ColorMapProgram.super.constructor.call(this, {
        outputBlendMode: blendMode,
        swapFrame: true,
        fragmentShader: [
            "uniform sampler2D u_colorMap;",
            "void main() {",
            "   vec4 srcColor = getSrcColor();",
            "   setFragColor(texture2D(u_colorMap, vec2(("+keyEq+"), 0)));",
            "}"
        ]
    });
}
Webvs.ColorMapProgram = Webvs.defineClass(ColorMapProgram, Webvs.QuadBoxProgram, {
    draw: function(colorMap) {
        this.setUniform("u_colorMap", "texture2D", colorMap);
        ColorMapProgram.super.draw.call(this);
    }
});

ColorMap.ui = {
    disp: "Color Map",
    type: "ColorMap",
    schema: {
        maps: {
            type: "array",
            items: {
                type: "array",
                title: "Map",
                items: {
                    type: "object",
                    properties: {
                        color: {
                            type: "string",
                            title: "Color",
                            format: "color",
                            default: "#FFFFFF"
                        },
                        index: {
                            type: "number",
                            title: "Index",
                            minimum: 0,
                            maximum: 255,
                        }
                    }
                }
            }
        },
        key: {
            type: "string",
            title: "Map key",
            enum: ["RED", "GREEN", "BLUE", "(R+G+B)/2", "(R+G+B)/3", "MAX"],
            default: "RED"
        },
        mapCycleMode: {
            type: "string",
            title: "Map Cycle Mode",
            enum: ["SINGLE", "ONBEATRANDOM", "ONBEATSEQUENTIAL"],
            default: "SINGLE"
        },
        output: {
            type: "string",
            title: "Output blend mode",
            enum: _.keys(Webvs.blendModes),
            default: "REPLACE"
        }
    }
};

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that clips colors to a different color depending
 * on whether the source colors are above or below a reference color.
 * 
 * @see r_contrast.cpp
 * @param {object} options - options object
 * @param {string} [options.mode="BELOW"] - comparison mode viz. `BELOW`, `ABOVE`, `NEAR`
 * @param {string} [options.color="#202020"] - reference color against which the
 *     the screen colors are compared
 * @param {string} [options.outColor="#202020"] - output color for clipped pixels
 * @param {number} [options.level=0] - when mode is `NEAR`, this value decides the distance
 *     between source and reference colors below which pixels would be clipped. 0-1 normalized
 *
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
function ColorClip(options) {
    Webvs.checkRequiredOptions(options, ["mode", "color", "outColor"]);
    options = _.defaults(options, {
        mode: "BELOW",
        color: "#202020",
        outColor: "#202020",
        level: 0
    });

    this.mode = _.indexOf(this.modes, options.mode);
    if(this.mode == -1) {
        throw new Error("ColorClip: invalid mode");
    }
    this.color = Webvs.parseColorNorm(options.color);
    this.outColor = Webvs.parseColorNorm(options.outColor);
    this.level = options.level;

    this.program = new Webvs.ColorClipProgram();

    ColorClip.super.constructor.apply(this, arguments);
}
Webvs.ColorClip = Webvs.defineClass(ColorClip, Webvs.Component, {
    modes: ["BELOW", "ABOVE", "NEAR"],
    componentName: "ChannelShift",

    /**
     * initializes the ColorClip component
     * @memberof Webvs.ColorClip#
     */
    init: function(gl, main, parent) {
        ColorClip.super.init.call(this, gl, main, parent);

        this.program.init(gl);
    },

    /**
     * clips the colors
     * @memberof Webvs.ColorClip#
     */
    update: function() {
        this.program.run(this.parent.fm, null, this.mode, this.color, this.outColor, this.level);
    },

    /**
     * releases resources
     * @memberof Webvs.ColorClip#
     */
    destroy: function() {
        ColorClip.super.destroy.call(this);
        this.program.cleanup();
    }
});

function ColorClipProgram() {
    ColorClipProgram.super.constructor({
        swapFrame: true,
        fragmentShader: [
            "uniform int u_mode;",
            "uniform vec3 u_color;",
            "uniform vec3 u_outColor;",
            "uniform float u_level;",

            "void main() {",
            "   vec4 inColor4 = getSrcColor();",
            "   vec3 inColor = inColor4.rgb;",
            "   bool clip = false;",
            "   if(u_mode == 0) {",
            "           clip = all(lessThanEqual(inColor, u_color));",
            "   }",
            "   if(u_mode == 1) {",
            "           clip = all(greaterThanEqual(inColor, u_color));",
            "   }",
            "   if(u_mode == 2) {",
            "           clip = (distance(inColor, u_color) <= u_level*0.5);",
            "   }",
            "   if(clip) {",
            "       setFragColor(vec4(u_outColor, inColor4.a));",
            "   } else {",
            "       setFragColor(inColor4);",
            "   }",
            "}",
        ]
    });
}
Webvs.ColorClipProgram = Webvs.defineClass(ColorClipProgram, Webvs.QuadBoxProgram, {
    draw: function(mode, color, outColor, level) {
        this.setUniform("u_mode", "1i", mode);
        this.setUniform.apply(this, ["u_color", "3f"].concat(color));
        this.setUniform.apply(this, ["u_outColor", "3f"].concat(outColor));
        this.setUniform("u_level", "1f", level);
        ColorClipProgram.super.draw.call(this);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that moves pixels according to user code.
 * 
 * #### Code variables
 *
 * The following variables are available in the code
 *
 * + x - x position of the pixel (-1 to +1)
 * + y - y position of the pixel (-1 to +1)
 * + d - length of pixel position vector (0 to 1)
 * + r - angle of the position vector with y axis in clockwise direction in radians
 * + w - width of the screen
 * + h - height of the screen
 * + b - 1 if a beat has occured else 0
 *
 * @param {object} options - options object
 * @param {string} [options.code.init] - code to be run at startup
 * @param {string} [options.code.onBeat] - code to be run when a beat occurs
 * @param {string} [options.code.perFrame] - code to be run on every frame
 * @param {string} [options.code.perPixel] - code that will be run once for every pixel. should set 
 *       `x`, `y` or `d`, `r` variables (depending on coord) to specify point location. Note: state 
 *        of this code does not persist.
 * @param {number} [options.gridW=16] - width of the interpolation grid
 * @param {number} [options.gridH=16] - height of the interpolation grid
 * @param {boolean} [options.noGrid=false] - if true, then interpolation grid is not used
 *      ie. movement will be pixel accurate
 * @param {boolean} [options.compat=false] - if true, then calculations are low precision.
 *      useful to map winamp AVS behaviour more closely
 * @param {boolean} [options.bFilter=true] - use bilinear interpolation for pixel sampling
 * @param {string} [options.coord="POLAR"] - coordinate system to be used viz. `POLAR`, `RECT`
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 * @constructor
 */
function DynamicMovement(options) {
    Webvs.checkRequiredOptions(options, ["code"]);
    options = _.defaults(options, {
        gridW: 16,
        gridH: 16,
        noGrid: false,
        bFilter: true,
        compat: false,
        coord: "POLAR"
    });

    var codeSrc;
    if(_.isObject(options.code)) {
        codeSrc = options.code;
    } else {
        throw new Error("Invalid Dynamic movement code");
    }
    var codeGen = new Webvs.ExprCodeGenerator(codeSrc, ["x", "y", "r", "d", "b"]);
    this.code = codeGen.generateJs(["init", "onBeat", "perFrame"]);
    var glslCode = codeGen.generateGlsl(["perPixel"], ["x", "y", "d", "r"], this.code);

    this.inited = false;

    this.noGrid = options.noGrid;
    this.gridW = options.gridW;
    this.gridH = options.gridH;

    this.coordMode = options.coord;
    this.bFilter = options.bFilter;
    this.compat = options.compat;

    if(this.noGrid) {
        this.program = new Webvs.DMovProgramNG(this.coordMode, this.bFilter,
                                               this.compat, this.code.hasRandom,
                                               glslCode);
    } else {
        this.program = new Webvs.DMovProgram(this.coordMode, this.bFilter,
                                             this.compat, this.code.hasRandom,
                                             glslCode);
    }

    DynamicMovement.super.constructor.apply(this, arguments);
}
Webvs.DynamicMovement = Webvs.defineClass(DynamicMovement, Webvs.Component, {
    componentName: "DynamicMovement",

    /**
     * initializes the DynamicMovement component
     * @memberof Webvs.DynamicMovement#
     */
    init: function(gl, main, parent) {
        DynamicMovement.super.init.call(this, gl, main, parent);

        this.program.init(gl);

        this.code.setup(main, parent);

        // calculate grid vertices
        if(!this.noGrid) {
            var gridW = Webvs.clamp(this.gridW, 1, this.main.canvas.width);
            var gridH = Webvs.clamp(this.gridH, 1, this.main.canvas.height);
            var nGridW = (gridW/this.main.canvas.width)*2;
            var nGridH = (gridH/this.main.canvas.height)*2;
            var gridCountAcross = Math.ceil(this.main.canvas.width/gridW);
            var gridCountDown = Math.ceil(this.main.canvas.height/gridH);
            var gridVertices = new Float32Array(gridCountAcross*gridCountDown*6*2);
            var pbi = 0;
            var curx = -1;
            var cury = -1;
            for(var i = 0;i < gridCountDown;i++) {
                for(var j = 0;j < gridCountAcross;j++) {
                    var cornx = Math.min(curx+nGridW, 1);
                    var corny = Math.min(cury+nGridH, 1);

                    gridVertices[pbi++] = curx;
                    gridVertices[pbi++] = cury;
                    gridVertices[pbi++] = cornx;
                    gridVertices[pbi++] = cury;
                    gridVertices[pbi++] = curx;
                    gridVertices[pbi++] = corny;

                    gridVertices[pbi++] = cornx;
                    gridVertices[pbi++] = cury;
                    gridVertices[pbi++] = cornx;
                    gridVertices[pbi++] = corny;
                    gridVertices[pbi++] = curx;
                    gridVertices[pbi++] = corny;

                    curx += nGridW;
                }
                curx = -1;
                cury += nGridH;
            }
            this.gridVertices = gridVertices;
            this.gridVerticesSize = pbi/2;
        }
    },

    /**
     * moves the pixels
     * @memberof Webvs.DynamicMovement#
     */
    update: function() {
        var code = this.code;

        // run init, if required
        if(!this.inited) {
            code.init();
            this.inited = true;
        }

        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        // run per frame
        code.perFrame();
        // run on beat
        if(beat) {
            code.onBeat();
        }

        if(this.noGrid) {
            this.program.run(this.parent.fm, null, this.code);
        } else {
            this.program.run(this.parent.fm, null, this.code, this.gridVertices, this.gridVerticesSize);
        }
    },

    /**
     * releases resources
     * @memberof Webvs.DynamicMovement#
     */
    destroy: function() {
        DynamicMovement.super.destroy.call(this);
        this.program.cleanup();
    }
});

var GlslHelpers = {
    glslRectToPolar: function(coordMode) {
        if(coordMode === "POLAR") {
            return [
                "float ar = u_resolution.x/u_resolution.y;",
                "x=x*ar;",
                "d = distance(vec2(x, y), vec2(0,0))/sqrt(2.0);",
                "r = mod(atan(y, x)+PI*0.5, 2.0*PI);"
            ].join("\n");
        } else {
            return "";
        }
    },

    glslPolarToRect: function(coordMode) {
        if(coordMode === "POLAR") {
            return [
                "d = d*sqrt(2.0);",
                "x = d*sin(r)/ar;",
                "y = -d*cos(r);"
            ].join("\n");
        } else {
            return "";
        }
    },

    glslFilter: function(bFilter, compat) {
        if(bFilter && !compat) {
            return [
                "vec3 filter(vec2 point) {",
                "   vec2 texel = 1.0/(u_resolution-vec2(1,1));",
                "   vec2 coord = (point+1.0)/2.0;",
                "   vec2 cornoff = fract(coord/texel);",
                "   vec2 corn = floor(coord/texel)*texel;",

                "   vec3 tl = getSrcColorAtPos(corn).rgb;",
                "   vec3 tr = getSrcColorAtPos(corn + vec2(texel.x, 0)).rgb;",
                "   vec3 bl = getSrcColorAtPos(corn + vec2(0, texel.y)).rgb;",
                "   vec3 br = getSrcColorAtPos(corn + texel).rgb;",

                "   vec3 pt = mix(tl, tr, cornoff.x);",
                "   vec3 pb = mix(bl, br, cornoff.x);",
                "   return mix(pt, pb, cornoff.y);",
                "}"
            ].join("\n");
        } else if(bFilter && compat) {
            return [
                "vec3 filter(vec2 point) {",
                "   vec2 texel = 1.0/(u_resolution-vec2(1,1));",
                "   vec2 coord = (point+1.0)/2.0;",
                "   vec2 corn = floor(coord/texel)*texel;",

                "   ivec2 cornoff = (ivec2(fract(coord/texel)*255.0));",

                "   ivec3 tl = ivec3(255.0 * getSrcColorAtPos(corn).rgb);",
                "   ivec3 tr = ivec3(255.0 * getSrcColorAtPos(corn + vec2(texel.x, 0)).rgb);",
                "   ivec3 bl = ivec3(255.0 * getSrcColorAtPos(corn + vec2(0, texel.y)).rgb);",
                "   ivec3 br = ivec3(255.0 * getSrcColorAtPos(corn + texel).rgb);",

                "   #define bt(i, j) int((float(i)/255.0)*float(j))",

                "   int a1 = bt(255-cornoff.x,255-cornoff.y);",
                "   int a2 = bt(cornoff.x    ,255-cornoff.y);",
                "   int a3 = bt(255-cornoff.x,cornoff.y);",
                "   int a4 = bt(cornoff.x    ,cornoff.y);",
                "   float r = float(bt(a1,tl.r) + bt(a2,tr.r) + bt(a3,bl.r) + bt(a4,br.r))/255.0;",
                "   float g = float(bt(a1,tl.g) + bt(a2,tr.g) + bt(a3,bl.g) + bt(a4,br.g))/255.0;",
                "   float b = float(bt(a1,tl.b) + bt(a2,tr.b) + bt(a3,bl.b) + bt(a4,br.b))/255.0;",
                "   return vec3(r,g,b);",
                "}"
            ].join("\n");
        } else {
            return [
                "vec3 filter(vec2 point) {",
                "   return getSrcColorAtPos((point+1.0)/2.0).rgb;",
                "}"
            ].join("\n");
        }
    }
};

function DMovProgramNG(coordMode, bFilter, compat, randSeed, exprCode) {
    var fragmentShader = [
        exprCode,
        this.glslFilter(bFilter, compat),
        "void main() {",
        (randSeed?"__randSeed = v_position;":""),
        "   x = v_position.x*2.0-1.0;",
        "   y = -(v_position.y*2.0-1.0);",
        this.glslRectToPolar(coordMode),
        "   perPixel();",
        this.glslPolarToRect(coordMode),
        "   setFragColor(vec4(filter(vec2(x, -y)), 1));",
        "}"
    ];

    DMovProgramNG.super.constructor.call(this, {
        fragmentShader: fragmentShader,
        swapFrame: true
    });
}
Webvs.DMovProgramNG = Webvs.defineClass(DMovProgramNG, Webvs.QuadBoxProgram, GlslHelpers, {
    draw: function(code) {
        code.bindUniforms(this);
        DMovProgramNG.super.draw.call(this);
    }
});

function DMovProgram(coordMode, bFilter, compat, randSeed, exprCode) {
    var vertexShader = [
        "attribute vec2 a_position;",
        "varying vec2 v_newPoint;",
        "uniform int u_coordMode;",
        exprCode,
        "void main() {",
        (randSeed?"__randSeed = a_position;":""),
        "   x = a_position.x;",
        "   y = -a_position.y;",
        this.glslRectToPolar(coordMode),
        "   perPixel();",
        this.glslPolarToRect(coordMode),
        "   v_newPoint = vec2(x,-y);",
        "   setPosition(a_position);",
        "}"
    ];

    var fragmentShader = [
        "varying vec2 v_newPoint;",
        this.glslFilter(bFilter, compat),
        "void main() {",
        "   setFragColor(vec4(filter(v_newPoint), 1));",
        "}"
    ];

    DMovProgram.super.constructor.call(this, {
        fragmentShader: fragmentShader,
        vertexShader: vertexShader,
        swapFrame: true
    });
}
Webvs.DMovProgram = Webvs.defineClass(DMovProgram, Webvs.ShaderProgram, GlslHelpers, {
    draw: function(code, gridVertices, gridVerticesSize) {
        code.bindUniforms(this);
        this.setVertexAttribArray("a_position", gridVertices, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, gridVerticesSize);
    }
});

DynamicMovement.ui = {
    type: "DynamicMovement",
    disp: "Dynamic Movement",
    schema: {
        code: {
            type: "object",
            title: "Code",
            default: {},
            properties: {
                init: {
                    type: "string",
                    title: "Init",
                },
                onBeat: {
                    type: "string",
                    title: "On Beat",
                },
                perFrame: {
                    type: "string",
                    title: "Per Frame",
                },
                perPixel: {
                    type: "string",
                    title: "Per Point",
                }
            },
        },
        gridW: {
            type: "number",
            title: "Grid Width",
            default: 16,
        },
        gridH: {
            type: "number",
            title: "Grid Height",
            default: 16,
        },
        coord: {
            type: "string",
            title: "Coordinate System",
            enum: ["POLAR", "RECT"],
            default: "POLAR"
        }
    },
    form: [
        { key: "code.init", type: "textarea" },
        { key: "code.onBeat", type: "textarea" },
        { key: "code.perFrame", type: "textarea" },
        { key: "code.perPixel", type: "textarea" },
        "gridW",
        "gridH",
        "coord"
    ]
};

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * An alias class for {@link Webvs.DynamicMovement} with noGrid=true option
 * @param {object} options - options object
 * @param {string} [options.code.perPixel] - code that will be run once for every pixel. should set 
 *       `x`, `y` or `d`, `r` variables (depending on coord) to specify point location. Note: state 
 *        of this code does not persist.
 * @param {boolean} [options.compat=false] - if true, then calculations are low precision.
 *      useful to map winamp AVS behaviour more closely
 * @param {boolean} [options.bFilter=true] - use bilinear interpolation for pixel sampling
 * @param {string} [options.coord="POLAR"] - coordinate system to be used viz. `POLAR`, `RECT`
 * @augments Webvs.DynamicMovement
 * @constructor
 * @memberof Webvs
 * @constructor
 */
function Movement(options) {
    options = _.defaults(options, {
        bFilter: true,
        coord: "POLAR",
        compat: false
    });

    Movement.super.constructor.call(this, {
        noGrid: true,
        bFilter: options.bFilter,
        compat: options.compat,
        coord: options.coord,
        code: options.code
    });
    this.options = options;
}
Webvs.Movement = Webvs.defineClass(Movement, Webvs.DynamicMovement);

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

var channels = ["RGB", "RBG", "BRG", "BGR", "GBR", "GRB"];

/**
 * @class
 * A component that swizzles the color component
 *
 * @param {object} options - options object
 * @param {string} [options.channel="RGB"] - the component combination 
 *     viz. `RGB`, `RBG`, `BRG`, `BGR`, `GBR`, `GRB`
 * @param {boolean} [options.onBeatRandom=false] - if set then the color components
 *     combination is changed randomly on beat
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
function ChannelShift(options) {
    options = _.defaults(options, {
        channel: "RGB",
        onBeatRandom: false
    });

    this.channel = channels.indexOf(options.channel);
    if(this.channel == -1) {
        throw new Error("Invalid Channel");
    }
    this.onBeatRandom = options.onBeatRandom;

    this.program = new ChannelShiftProgram();

    ChannelShift.super.constructor.apply(this, arguments);
}
Webvs.ChannelShift = Webvs.defineClass(ChannelShift, Webvs.Component, {
    componentName: "ChannelShift",

    /**
     * initializes the ChannelShift component
     * @memberof Webvs.ChannelShift#
     */
    init: function(gl, main, parent) {
        ChannelShift.super.init.call(this, gl, main, parent);

        this.program.init(gl);
    },

    /**
     * shifts the colors
     * @memberof Webvs.ChannelShift#
     */
    update: function() {
        if(this.onBeatRandom && this.main.analyser.beat) {
            this.channel = Math.floor(Math.random() * channels.length);
        }
        this.program.run(this.parent.fm, null, this.channel);
    },

    /**
     * releases resources
     * @memberof Webvs.ChannelShift#
     */
    destroy: function() {
        ChannelShift.super.destroy.call(this);
        this.program.cleanup();
    }

});

function ChannelShiftProgram() {
    ChannelShiftProgram.super.constructor.call(this, {
        swapFrame: true,
        fragmentShader: [
            "uniform int u_channel;",
            "void main() {",
            "   vec3 color = getSrcColor().rgb;",

            _.flatMap(channels, function(channel, index) {
                return [
                    "if(u_channel == "+index+") {",
                    "   setFragColor(vec4(color." + channel.toLowerCase() + ",1));",
                    "}"
                ];
            }).join("\n"),
        "}"
        ]
    });
}
Webvs.ChannelShiftProgram = Webvs.defineClass(ChannelShiftProgram, Webvs.QuadBoxProgram, {
    draw: function(channel) {
        this.setUniform("u_channel", "1i", channel);
        ChannelShiftProgram.super.draw.call(this);
    }
});

ChannelShift.ui = {
    disp: "Channel Shift",
    type: "ChannelShift",
    schema: {
        channel: {
            type: "string",
            title: "Channel",
            enum: channels
        },
        onBeatRandom: {
            type: "boolean",
            title: "On beat random",
        }
    }
};

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A Component that applies a unique color tone
 * @param {object} options - options object
 * @param {string} [options.color="#FFFFFF"] - the color tone
 * @param {boolean} [options.invert=false] - if set then tone is inverted
 * @param {string} [options.blendMode="REPLACE"] - blending mode for this component
 * @augments Webvs.Component
 * @memberof Webvs
 * @constructor
 */
function UniqueTone(options) {
    options = _.defaults(options, {
        color: "#ffffff",
        invert: false,
        blendMode: "REPLACE"
    });

    this.tone = Webvs.parseColorNorm(options.color);
    this.invert = options.invert;
    this.program = new UniqueToneProgram(Webvs.getBlendMode(options.blendMode));
}
Webvs.UniqueTone = Webvs.defineClass(UniqueTone, Webvs.Component, {
    /**
     * initializes the UniqueTone component
     * @memberof Webvs.UniqueTone#
     */
    init: function(gl, main, parent) {
        UniqueTone.super.init.call(this, gl, main, parent);
        this.program.init(gl);
    },

    /**
     * applies unique tone
     * @memberof Webvs.UniqueTone#
     */
    update: function() {
        this.program.run(this.parent.fm, null, this.tone, this.invert);
    },

    /**
     * releases resources
     * @memberof Webvs.UniqueTone#
     */
    destroy: function() {
        UniqueTone.super.destroy.call(this);
        this.program.cleanup();
    }
});

function UniqueToneProgram(blendMode) {
    UniqueToneProgram.super.constructor.call(this, {
        outputBlendMode: blendMode,
        swapFrame: true,
        fragmentShader: [
            "uniform vec3 u_tone;",
            "uniform bool u_invert;",
            "void main() {",
            "   vec4 srcColor = getSrcColor();",
            "   float depth = max(srcColor.r, max(srcColor.g, srcColor.b));",
            "   if(u_invert) {",
            "       depth = 1.0-depth;",
            "   }",
            "   setFragColor(vec4(depth*u_tone, 1));",
            "}"
        ]
    });
}
Webvs.UniqueToneProgram = Webvs.defineClass(UniqueToneProgram, Webvs.QuadBoxProgram, {
    draw: function(tone, invert) {
        this.setUniform.apply(this, ["u_tone", "3f"].concat(tone));
        this.setUniform("u_invert", "1f", invert?1:0);
        UniqueToneProgram.super.draw.call(this);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A generic scope, that can draw points or lines based on user code
 *
 * #### Code variables
 *
 * The following variables are available in the code
 *
 * + n (default: 100) - the number of points.
 * + i - 0-1 normalized loop counter
 * + v - the value of the superscope at current position (-1 to +1)
 * + x - x position of the dot (-1 to +1)
 * + y - y position of the dot (-1 to +1)
 * + w - width of the screen
 * + h - height of the screen
 * + b - 1 if a beat has occured else 0
 * + red (default: set from colors option) - red component of color (0-1)
 * + green (default: set from colors option) - green component of color (0-1)
 * + blue (default: set from colors option) - blue component of color (0-1)
 * + cid - the clone id of this component. if it is a clone
 *
 * @param {object} options - options object
 * @param {string} [options.code.init] - code to be run at startup
 * @param {string} [options.code.onBeat] - code to be run when a beat occurs
 * @param {string} [options.code.perFrame] - code to be run on every frame
 * @param {string} [options.code.perPoint] - code that will be run once for every point. should set 
 *       `x`, `y` variables to specify point location. set `red`, `green` or `blue` variables
 *       to specify point color
 * @param {string} [options.source="SPECTRUM"] - the scope data source viz. `SPECTRUM`, `WAVEFORM`
 * @param {string} [options.drawMode="LINES"] - switch between drawing `LINES` or `DOTS`
 * @param {Array.<String>} [options.colors=["#FFFFFF"]] - rendering color cycles through these colors
 * @param {number} [options.thickness] - thickenss of line or dot
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
function SuperScope(options) {
    Webvs.checkRequiredOptions(options, ["code"]);
    options = _.defaults(options, {
        source: "SPECTRUM",
        drawMode: "LINES",
        colors: ["#ffffff"]
    });

    var codeSrc;
    if(_.isObject(options.code)) {
        codeSrc = options.code;
    } else {
        throw new Error("Invalid superscope");
    }
    var codeGen = new Webvs.ExprCodeGenerator(codeSrc, ["n", "v", "i", "x", "y", "b", "red", "green", "blue"]);
    this.code = codeGen.generateJs(["init", "onBeat", "perFrame", "perPoint"]);
    this.code.n = 100;
    this.clone = options.clone || 1;

    this.spectrum = options.source == "SPECTRUM";
    this.dots = options.drawMode == "DOTS";

    this.colors = _.map(options.colors, Webvs.parseColorNorm);
    this.currentColor = [];
    this.maxStep = 100;

    this.step = this.maxStep; // so that we compute steps, the first time
    this.colorId = 0;
    this.colorStep = [0,0,0];

    this.thickness = options.thickness?options.thickness:1;

    this.inited = false;

    this.program = new SuperScopeShader();

    SuperScope.super.constructor.apply(this, arguments);
}
Webvs.SuperScope = Webvs.defineClass(SuperScope, Webvs.Component, {
    componentName: "SuperScope",

    /**
     * initializes the SuperScope component
     * @memberof Webvs.SuperScope#
     */
    init: function(gl, main, parent) {
        SuperScope.super.init.call(this, gl, main, parent);
        this.program.init(gl);
        this.code.setup(main, this);

        this.code = Webvs.CodeInstance.clone(this.code, this.clone);
    },

    update: function() {
        this._stepColor();
        _.each(this.code, function(code) {
            this.drawScope(code, !this.inited);
        }, this);
        this.inited = true;
    },

    /**
     * renders the scope
     * @memberof Webvs.SuperScope#
     */
    drawScope: function(code, runInit) {
        var gl = this.gl;

        code.red = this.currentColor[0];
        code.green = this.currentColor[1];
        code.blue = this.currentColor[2];

        if(runInit) {
            code.init();
        }

        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        code.perFrame();
        if(beat) {
            code.onBeat();
        }

        var nPoints = Math.floor(code.n);
        var data = this.spectrum ? this.main.analyser.getSpectrum() : this.main.analyser.getWaveform();
        var bucketSize = data.length/nPoints;
        var pbi = 0;
        var cdi = 0;

        var pointBufferData = new Float32Array((this.dots?nPoints:(nPoints*2-2)) * 2);
        var colorData = new Float32Array((this.dots?nPoints:(nPoints*2-2)) * 3);
        for(var i = 0;i < nPoints;i++) {
            var value = 0;
            var size = 0;
            for(var j = Math.floor(i*bucketSize);j < (i+1)*bucketSize;j++,size++) {
                value += data[j];
            }
            value = value/size;

            var pos = i/((nPoints > 1)?(nPoints-1):1);
            code.i = pos;
            code.v = value;
            code.perPoint();
            pointBufferData[pbi++] = code.x;
            pointBufferData[pbi++] = code.y*-1;
            if(i !== 0 && i != nPoints-1 && !this.dots) {
                pointBufferData[pbi++] = code.x;
                pointBufferData[pbi++] = code.y*-1;
            }
            if(this.dots) {
                colorData[cdi++] = code.red;
                colorData[cdi++] = code.green;
                colorData[cdi++] = code.blue;
            } else if(i !== 0) {
                colorData[cdi++] = code.red;
                colorData[cdi++] = code.green;
                colorData[cdi++] = code.blue;
                colorData[cdi++] = code.red;
                colorData[cdi++] = code.green;
                colorData[cdi++] = code.blue;
            }
        }

        this.program.run(this.parent.fm, null, pointBufferData, colorData, this.dots, this.thickness);
    },

    /**
     * releases resources
     * @memberof Webvs.SuperScope#
     */
    destroy: function() {
        SuperScope.super.destroy.call(this);
        this.program.cleanup();
    },

    _stepColor: function() {
        var i;
        if(this.colors.length > 1) {
            if(this.step == this.maxStep) {
                var curColor = this.colors[this.colorId];
                this.colorId = (this.colorId+1)%this.colors.length;
                var nextColor = this.colors[this.colorId];
                for(i = 0;i < 3;i++) {
                    this.colorStep[i] = (nextColor[i]-curColor[i])/this.maxStep;
                }
                this.step = 0;
                for(i = 0;i < 3;i++) {
                    this.currentColor[i] = curColor[i];
                }
            } else {
                for(i = 0;i < 3;i++) {
                    this.currentColor[i] += this.colorStep[i];
                }
                this.step++;
            }
        } else {
            this.currentColor = this.colors[0];
        }
    }
});

function SuperScopeShader() {
    SuperScopeShader.super.constructor.call(this, {
        copyOnSwap: true,
        vertexShader: [
            "attribute vec2 a_position;",
            "attribute vec3 a_color;",
            "varying vec3 v_color;",
            "uniform float u_pointSize;",
            "void main() {",
            "   gl_PointSize = u_pointSize;",
            "   setPosition(clamp(a_position, vec2(-1,-1), vec2(1,1)));",
            "   v_color = a_color;",
            "}"
        ],
        fragmentShader: [
            "varying vec3 v_color;",
            "void main() {",
            "   setFragColor(vec4(v_color, 1));",
            "}"
        ]
    });
}
Webvs.SuperScopeShader = Webvs.defineClass(SuperScopeShader, Webvs.ShaderProgram, {
    draw: function(points, colors, dots, thickness) {
        var gl = this.gl;

        this.setUniform("u_pointSize", "1f", thickness);
        this.setVertexAttribArray("a_position", points, 2, gl.FLOAT, false, 0, 0);
        this.setVertexAttribArray("a_color", colors, 3, gl.FLOAT, false, 0, 0);

        var prevLineWidth;
        if(!dots) {
            prevLineWidth = gl.getParameter(gl.LINE_WIDTH);
            gl.lineWidth(thickness);
        }

        gl.drawArrays(dots?gl.POINTS:gl.LINES, 0, points.length/2);

        if(!dots) {
            gl.lineWidth(prevLineWidth);
        }
    }
});

SuperScope.ui = {
    disp: "SuperScope",
    type: "SuperScope",
    schema: {
        code: {
            type: "object",
            title: "Code",
            default: {},
            properties: {
                init: {
                    type: "string",
                    title: "Init",
                },
                onBeat: {
                    type: "string",
                    title: "On Beat",
                },
                perFrame: {
                    type: "string",
                    title: "Per Frame",
                },
                perPoint: {
                    type: "string",
                    title: "Per Point",
                }
            },
        },
        source: {
            type: "string",
            title: "Source",
            default: "WAVEFORM",
            enum: ["WAVEFORM", "SPECTRUM"]
        },
        drawMode: {
            type: "string",
            title: "Draw Mode",
            default: "LINES",
            enum: ["DOTS", "LINES"]
        },
        colors: {
            type: "array",
            title: "Cycle Colors",
            items: {
                type: "string",
                format: "color",
                default: "#FFFFFF"
            }
        }
    }
};


})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A simple scope that displays either waveform or spectrum data
 * @param {object} options - options object
 * @param {string} [options.drawMode="SOLID"] - draw mode viz. `SOLID`, `DOTS`, `LINES`
 * @param {string} [options.source="WAVEFORM"] - scope data source viz. `WAVEFORM`, `SPECTRUM`
 * @param {string} [options.align="CENTER"] - scope alignment viz. `TOP`, `CENTER`, `BOTTOM`
 * @param {Array.<String>} [options.colors=["#FFFFFF"]] - rendering color cycles through these colors
 * @augments Webvs.SuperScope
 * @constructor
 * @memberof Webvs
 */
function Simple(options) {
    options = _.defaults(options, {
        drawMode: "SOLID",
        source: "WAVEFORM",
        align: "CENTER",
        colors: ["#ffffff"]
    });

    var code = {};
    if(options.drawMode != "SOLID") {
        code.init = "n=w;";
        code.perPoint = ({
            "TOP":    "x=i*2-1; y=-v/2-0.5;",
            "CENTER": "x=i*2-1; y=-v/2;",
            "BOTTOM": "x=i*2-1; y=v/2+0.5;"
        })[options.align];
    } else {
        code.init = "n=w*2;";
        code.perFrame = "c=0;";
        if(options.source == "SPECTRUM") {
            code.perPoint = ({
                "TOP":    "x=i*2-1; y=if(c%2,0,-v/2-0.5); c=c+1;",
                "CENTER": "x=i*2-1; y=if(c%2,0.5,-v/2);   c=c+1;",
                "BOTTOM": "x=i*2-1; y=if(c%2,0,v/2+0.5);  c=c+1;",
            })[options.align];
        } else {
            code.perPoint = ({
                "TOP":    "x=i*2-1; y=if(c%2,-0.5,-v/2-0.5); c=c+1;",
                "CENTER": "x=i*2-1; y=if(c%2,0,-v/2);        c=c+1;",
                "BOTTOM": "x=i*2-1; y=if(c%2,0.5,v/2+0.5);   c=c+1;",
            })[options.align];
        }
    }

    Simple.super.constructor.call(this, {
        source: options.source,
        drawMode: (options.drawMode=="SOLID"?"LINES":options.drawMode),
        colors: options.colors,
        code: code
    });
    this.options = options; // set Simple option instead of superscope options
}
Webvs.Simple = Webvs.defineClass(Simple, Webvs.SuperScope);

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A SuperScope like component that places images at points.
 *
 * The following variables are available in the code
 *
 * + n (default: 100) - the number of points.
 * + i - 0-1 normalized loop counter
 * + v - the value of the superscope at current position
 * + x - x position of the image (-1 to +1)
 * + y - y position of the image (-1 to +1)
 * + sizex - horizontal scale of the image. 1 = original size, 0.5 = half the size etc.
 * + sizey - vertical scale of the image. 1 = original size, 0.5 = half the size etc.
 * + y - y position of the image (-1 to +1)
 * + w - width of the screen
 * + h - height of the screen
 * + b - 1 if a beat has occured else 0
 * + red (default: 1) - red component of color (0-1)
 * + green (default: 1) - green component of color (0-1)
 * + blue (default: 1) - blue component of color (0-1)
 * + cid - the clone id of this component. if it is a clone
 *
 * @param {object} options - options object
 * @param {string} [options.code.init] - code to be run at startup
 * @param {string} [options.code.onBeat] - code to be run when a beat occurs
 * @param {string} [options.code.perFrame] - code to be run on every frame
 * @param {string} [options.code.perPoint] - code that will be run once for every point. should set 
 *       `x`, `y` variables to specify image location. set `red`, `green` or `blue` variables
 *       to specify color filter. set `sizex` or `sizey` for horizontal and vertical scaling.
 * @param {string} [options.source="SPECTRUM"] - the scope data source viz. `SPECTRUM`, `WAVEFORM`
 * @param {boolean} [options.wrapAround=false] - if set then images hanging off the edge wraps around
 *        from the other side
 * @param {boolean} [options.colorFiltering=false] - if set then color filter is applied to image
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
function Texer(options) {
    Webvs.checkRequiredOptions(options, ["code", "imageSrc"]);
    options = _.defaults(options, {
        source: "SPECTRUM",
        resizing: false,
        wrapAround: false,
        colorFiltering: true
    });

    this.resizing = options.resizing;
    this.colorFiltering = options.colorFiltering;
    this.wrapAround = options.wrapAround;
    this.imageSrc = options.imageSrc;

    var codeGen = new Webvs.ExprCodeGenerator(options.code, ["n", "v", "i", "x", "y", "b", "sizex", "sizey", "red", "green", "blue"]);
    this.code = codeGen.generateJs(["init", "onBeat", "perFrame", "perPoint"]);
    this.code.n = 100;
    this.spectrum = options.source == "SPECTRUM";

    this._inited = false;

    this.program = new TexerProgram();

    Texer.super.constructor.apply(this, arguments);
}
Webvs.Texer = Webvs.defineClass(Texer, Webvs.Component, {
    componentName: "Texer",

    /**
     * initializes the Texer component
     * @memberof Webvs.Texer#
     */
    init: function(gl, main, parent) {
        Texer.super.init.call(this, gl, main, parent);

        this.program.init(gl);
        this.code.setup(main, this);

        var image = new Image();
        image.src = main.getResource(this.imageSrc);
        this.imagewidth = image.width;
        this.imageHeight = image.height;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    },

    /**
     * renders the scope
     * @memberof Webvs.Texer#
     */
    update: function() {
        var code = this.code;
        if(!this._inited) {
            code.init();
        }

        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        code.perFrame();
        if(beat) {
            code.onBeat();
        }

        var nPoints = Math.floor(code.n);
        var data = this.spectrum ? this.main.analyser.getSpectrum() : this.main.analyser.getWaveform();
        var bucketSize = data.length/nPoints;

        var vertexData = [];
        var texVertexData = [];
        var vertexIndices = [];
        var colorData = this.colorFiltering?[]:null;
        var index = 0;
        function addRect(cornx, corny, sizex, sizey, red, green, blue) {
            if(cornx < -1-sizex || cornx > 1||
               corny < -1-sizey || corny > 1) {
                return;
            }
            // screen coordinates
            vertexData.push(
                cornx,       corny,
                cornx+sizex, corny,
                cornx+sizex, corny+sizey,
                cornx,       corny+sizey
            );

            // texture coordinates
            texVertexData.push(
                0, 0,
                1, 0,
                1, 1,
                0, 1
            );

            if(colorData) {
                // color data
                colorData.push(
                    red, green, blue,
                    red, green, blue,
                    red, green, blue,
                    red, green, blue
                );
            }

            // indices
            vertexIndices.push(
                index+0, index+1, index+2,
                index+0, index+2, index+3
            );
            index += 4;
        }

        var imageSizex = (this.imagewidth/this.parent.fm.width)*2;
        var imageSizey = (this.imageHeight/this.parent.fm.height)*2;

        for(var i = 0;i < nPoints;i++) {
            var value = 0;
            var size = 0;
            for(var j = Math.floor(i*bucketSize);j < (i+1)*bucketSize;j++,size++) {
                value += data[j];
            }
            value = value/size;

            var pos = i/(nPoints-1);
            code.i = pos;
            code.v = value;
            code.sizex = 1;
            code.sizey = 1;
            code.red = 1;
            code.green = 1;
            code.blue = 1;
            code.perPoint();

            var sizex = imageSizex;
            var sizey = imageSizey;
            if(this.resizing) {
                sizex *= code.sizex;
                sizey *= code.sizey;
            }
            var cornx = code.x-sizex/2;
            var corny = (-code.y)-sizey/2;
            
            addRect(cornx, corny, sizex, sizey, code.red, code.green, code.blue);
            if(this.wrapAround) {
                // wrapped around x value is 1-(-1-cornx) or -1-(1-cornx)
                // depending on the edge
                // ie. 2+cornx or -2+cornx
                var xwrap = (cornx < -1)?2:((cornx > (1-sizex))?-2:0);
                var ywrap = (corny < -1)?2:((corny > (1-sizey))?-2:0);
                if(xwrap) {
                    addRect(xwrap+cornx, corny, sizex, sizey, code.red, code.green, code.blue);
                }
                if(ywrap) {
                    addRect(cornx, ywrap+corny, sizex, sizey, code.red, code.green, code.blue);
                }
                if(xwrap && ywrap) {
                    addRect(xwrap+cornx, ywrap+corny, sizex, sizey, code.red, code.green, code.blue);
                }
            }
        }

        this.program.run(this.parent.fm, null,
                         new Float32Array(vertexData),
                         new Float32Array(texVertexData),
                         new Uint16Array(vertexIndices),
                         colorData?new Float32Array(colorData):null,
                         this.texture);
    },

    /**
     * release resource
     * @memberof Webvs.Texer#
     */
    destroy: function() {
        Texer.super.destroy.call(this);
        this.gl.deleteTexture(this.texture);
        this.program.cleanup();
    }
});

function TexerProgram() {
    TexerProgram.super.constructor.call(this, {
        vertexShader: [
            "uniform bool u_colorFilter;",
            "attribute vec2 a_texVertex;",
            "attribute vec2 a_vertex;",
            "attribute vec3 a_color;",
            "varying vec2 v_texVertex;",
            "varying vec3 v_color;",
            "void main() {",
            "   if(u_colorFilter) {",
            "       v_color = a_color;",
            "   }",
            "   v_texVertex = a_texVertex;",
            "   setPosition(a_vertex);",
            "}"
        ],
        fragmentShader: [
            "uniform bool u_colorFilter;",
            "uniform sampler2D u_image;",
            "varying vec2 v_texVertex;",
            "varying vec3 v_color;",
            "void main() {",
            "   vec3 outColor = texture2D(u_image, v_texVertex).rgb;",
            "   if(u_colorFilter) {",
            "       outColor = outColor*v_color;",
            "   }",
            "   setFragColor(vec4(outColor, 1));",
            "}"
        ]
    });
}
Webvs.TexerProgram = Webvs.defineClass(TexerProgram, Webvs.ShaderProgram, {
    draw: function(vertices, texVertices, indices, colors, image) {
        this.setUniform("u_image", "texture2D", image);
        this.setVertexAttribArray("a_vertex", vertices);
        this.setVertexAttribArray("a_texVertex", texVertices);
        if(colors) {
            this.setUniform("u_colorFilter", "1f", 1);
            this.setVertexAttribArray("a_color", colors, 3);
        } else {
            this.setUniform("u_colorFilter", "1f", 0);
        }

        this.setElementArray(indices);
        this.gl.drawElements(this.gl.TRIANGLES, indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that clears the screen
 *
 * @param {object} options - options object
 * @param {number} [options.n=0] - beat counter, screen will be cleared for every n beats.
 *      use 0 to clear all frames.
 * @param {string} [options.color="#000000"] - color to which screen is to be cleared
 * @param {string} [options.blendMode="REPLACE"] - blend clearing onto previous buffer
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
function ClearScreen(options) {
    options = _.defaults(options, {
        n: 0,
        color: "#000000",
        blendMode: "REPLACE"
    });
    this.n = options.n;
    this.color = Webvs.parseColorNorm(options.color);

    this.outputBlendMode = Webvs.blendModes[options.blendMode];

    this.prevBeat = false;
    this.beatCount = 0;

    this.program = new Webvs.ClearScreenProgram(this.outputBlendMode);

    ClearScreen.super.constructor.apply(this, arguments);
}
Webvs.ClearScreen = Webvs.defineClass(ClearScreen, Webvs.Component, {
    componentName: "ClearScreen",

    /**
     * initializes the ClearScreen component
     * @memberof Webvs.ClearScreen#
     */
    init: function(gl, main, parent) {
        ClearScreen.super.init.call(this, gl, main, parent);
        this.program.init(gl);
    },

    /**
     * clears the screen
     * @memberof Webvs.ClearScreen#
     */
    update: function() {
        var clear = false;
        if(this.n === 0) {
            clear = true;
        } else {
            if(this.main.analyser.beat && !this.prevBeat) {
                this.beatCount++;
                if(this.beatCount == this.n) {
                    clear = true;
                    this.beatCount = 0;
                }
            }
            this.prevBeat = this.main.analyser.beat;
        }

        if(clear) {
            this.program.run(this.parent.fm, null, this.color);
        }
    },

    /**
     * releases resources
     * @memberof Webvs.ClearScreen#
     */
    destroy: function() {
        this.program.cleanup();
    }
});

ClearScreen.ui = {
    type: "ClearScreen",
    disp: "Clear Screen",
    schema: {
        n: {
            type: "number",
            title: "Clear on beat (0 = always clear)",
            default: 0
        },
        color: {
            type: "string",
            title: "Clear color",
            format: "color",
            default: "#000000"
        },
        blendMode: {
            type: "string",
            title: "Blend Mode",
            enum: _.keys(Webvs.blendModes)
        }
    }
};

})(Webvs);

/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that renders an image onto the screen
 *
 * @param {object} options - options object
 * @param {string} src - image file source
 * @param {number} x - image x position
 * @param {number} y - image y position
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
function Picture(options) {
    Webvs.checkRequiredOptions(options, ["src", "x", "y"]);

    this.x = options.x;
    this.y = options.y;
    this.src = options.src;

    this.program = new Webvs.PictureProgram();
    Picture.super.constructor.apply(this, arguments);
}
Webvs.Picture = Webvs.defineClass(Picture, Webvs.Component, {
    /**
     * initializes the ClearScreen component
     * @memberof Webvs.Picture#
     */
    init: function(gl, main, parent) {
        Picture.super.init.call(this, gl, main, parent);

        this.program.init(gl);

        var image = new Image();
        image.src = main.getResource(this.src);
        this.width = image.width;
        this.height = image.height;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    },

    /**
     * renders the image
     * @memberof Webvs.Picture#
     */
    update: function() {
        this.program.run(this.parent.fm, null, this.x, this.y, this.texture, this.width, this.height);
    },

    /**
     * releases resources
     * @memberof Webvs.Picture#
     */
    destroy: function() {
        this.program.cleanup();
        this.gl.deleteTexture(this.texture);
    }
});

function PictureProgram() {
    PictureProgram.super.constructor.call(this, {
        copyOnSwap: true,
        vertexShader: [
            "attribute vec2 a_texVertex;",
            "uniform vec2 u_pos;",
            "uniform vec2 u_texRes;",
            "varying vec2 v_texCoord;",

            "void main() {",
            "   v_texCoord = a_texVertex;",
            "   setPosition(a_texVertex*(u_texRes/u_resolution)*vec2(2,-2)+u_pos);",
            "}"
        ],
        fragmentShader: [
            "uniform sampler2D u_image;",
            "varying vec2 v_texCoord;",
            "void main() {",
            "   setFragColor(texture2D(u_image, v_texCoord));",
            "}"
        ]
    });
}
Webvs.PictureProgram = Webvs.defineClass(PictureProgram, Webvs.ShaderProgram, {
    draw: function(x, y, image, imgw, imgh) {
        this.setUniform("u_pos", "2f", x, -y);
        this.setUniform("u_texRes", "2f", imgw, imgh);
        this.setUniform("u_image", "texture2D", image);
        this.setVertexAttribArray(
            "a_texVertex", 
            new Float32Array([
                0,  0,
                0,  1,
                1,  1,
                0,  0,
                1,  1,
                1,  0
            ])
        );
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
});

})(Webvs);
