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

// Events mixin. Use Backbone Events if available
// else we expect a global Events mixin with similar
// API to be present
Webvs.Events = (window.Backbone && Backbone.Events) || window.Events;
Webvs.ModelLike = _.extend(_.clone(Webvs.Events), {
    get: function(key) {
        throw new Error("get not implemented");
    },

    toJSON: function(key) {
        throw new Error("toJSON not implemented");
    },

    setAttribute: function(key) {
        throw new Error("setAttribute not implemented");
    },

    set: function(key, value, options) {
        var success, silent;

        if(!_.isString(key) && arguments.length <= 2) {
            // if map of key values are passed
            // then set each value separately
            silent = value.silent;
            options = _.defaults({silent:true}, value);
            value = _.clone(key);

            success = false;
            for(key in value) {
                if(this.setAttribute(key, value[key], options)) {
                    success = true;
                    if(!silent) {
                        this.trigger("change:" + key, this, value[key], options); 
                    }
                }
            }
            if(success && !silent) {
                this.trigger("change", this, options); 
            }
        } else {
            options = options || {};
            success = this.setAttribute(key, value, options);
            if(success && !options.silent) {
                this.trigger("change:" + key, this, value, options); 
                this.trigger("change", this, options); 
            }
        }

        return success;
    }
});

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

Webvs.ComponentRegistry = {};
Webvs.registerComponent = function(componentClass, meta) {
    Webvs.checkRequiredOptions(meta, ["name"]);
    componentClass.Meta = meta;
    Webvs[meta.name] = componentClass;
    Webvs.ComponentRegistry[meta.name] = componentClass;
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

_.flatMap = _.compose(_.flatten, _.map);

/**
 * Blend mode constants
 */
Webvs.BlendModes = {
    REPLACE: 1,
    MAXIMUM: 2,
    AVERAGE: 3,
    ADDITIVE: 4,
    SUBTRACTIVE1: 5,
    SUBTRACTIVE2: 6,
    MULTIPLY: 7,
    MULTIPLY2: 8,
    ADJUSTABLE: 9,
    ALPHA: 10
};
_.extend(Webvs, Webvs.BlendModes);

Webvs.Channels = {
    CENTER: 0,
    LEFT: 1,
    RIGHT: 2
};
_.extend(Webvs, Webvs.Channels);

Webvs.Source = {
    SPECTRUM: 1,
    WAVEFORM: 2
};
_.extend(Webvs, Webvs.Source);

Webvs.getEnumValue = function(key, enumeration) {
    key = key.toUpperCase();
    if(!(key in enumeration)) {
        throw new Error("Unknown key " + key + ", expecting one of " + _.keys(enumeration).join(","));
    }
    return enumeration[key];
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

/**
 * Returns the component class with the given name. Throws
 * and Error if it doesnt exist
 * @param {string} name - name of the class
 * @returns {function} - constructor for the component
 */
Webvs.getComponentClass = function(name) {
    var componentClass = Webvs.ComponentRegistry[name];
    if(!componentClass) {
        throw new Error("Unknown Component class " + name);
    }
    return componentClass;
};

/**
 * Returns the value of property given its (dot separated) path in an object
 * @param {object} obj - the object
 * @param {string} name - path to the property
 * @returns the value of the property, undefined if it doesnt exist
 */
Webvs.getProperty = function(obj, name) {
    if(_.isString(name)) {
        name = name.split(".");
    }
    var value = obj[name.shift()];
    if(value) {
        if(name.length > 0) {
            return Webvs.getProperty(value, name);
        } else {
            return value;
        }
    }
};

/**
 * Sets a property, given its (dot separated) path in an object
 * @param {object} obj - the object
 * @param {string} name - path to the property
 * @param value - value to be set
 */
Webvs.setProperty = function(obj, name, value) {
    if(_.isString(name)) {
        name = name.split(".");
    }
    var propertyName = name.shift();
    if(name.length === 0) {
        obj[propertyName] = value;
    } else {
        Webvs.setProperty(obj[propertyName], name, value);
    }
};

})(window);
