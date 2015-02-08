/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(window) {

// Webvs namespace that contains all classes
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

// A wrapper around Object.create to help with class definition
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

Webvs.noop = function() {};

// Checks if an object contains the required properties
Webvs.checkRequiredOptions = function(options, requiredOptions) {
    for(var i in requiredOptions) {
        var key =  requiredOptions[i];
        if(!(key in options)) {
            throw new Error("Required option " + key + " not found");
        }
    }
};

// Returns a floating point value representation of a number
// embeddable in glsl shader code
Webvs.glslFloatRepr = function(val) {
    return val + (val%1 === 0?".0":"");
};

// Parse css color string #RRGGBB or rgb(r, g, b)
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

// 0-1 normalized version of Webvs.parseColor
Webvs.parseColorNorm = function(color) {
    return _.map(Webvs.parseColor(color), function(value) { return value/255; });
};

// Pretty prints a shader compilation error
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

// Blend mode constants
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

// Returns an enumeration(plain object with numeric values)
// value or throws an exception if it doesnt exists
Webvs.getEnumValue = function(key, enumeration) {
    key = key.toUpperCase();
    if(!(key in enumeration)) {
        throw new Error("Unknown key " + key + ", expecting one of " + _.keys(enumeration).join(","));
    }
    return enumeration[key];
};

// Returns a random string of given length
Webvs.randString = function(count, chars) {
    var string = [];
    chars = chars || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0;i < count;i++) {
        string.push(chars.charAt(Math.floor(Math.random()*chars.length)));
    }
    return string.join("");
};

// Clamps a number between two given numbers
Webvs.clamp = function(num, min, max) {
  return Math.min(Math.max(num, min), max);
};

// Returns the component class with the given name. Throws
Webvs.getComponentClass = function(name) {
    var componentClass = Webvs.ComponentRegistry[name];
    if(!componentClass) {
        throw new Error("Unknown Component class " + name);
    }
    return componentClass;
};

// Returns the value of property given its (dot separated) path in an object
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

// Sets a property, given its (dot separated) path in an object
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

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

Webvs.ResourcePack = {
    name: "Builtin",
    prefix: "./resources/",
    fileNames: [
        "avsres_texer_circle_edgeonly_19x19.bmp",
        "avsres_texer_circle_edgeonly_29x29.bmp",
        "avsres_texer_circle_fade_13x13.bmp",
        "avsres_texer_circle_heavyblur_19x19.bmp",
        "avsres_texer_circle_heavyblur_21x21.bmp",
        "avsres_texer_circle_heavyblur_29x29.bmp",
        "avsres_texer_circle_sharp_09x09.bmp",
        "avsres_texer_circle_sharp_19x19.bmp",
        "avsres_texer_circle_slightblur_13x13.bmp",
        "avsres_texer_circle_slightblur_21x21.bmp",
        "avsres_texer_hexagon-h_blur_123x123.bmp",
        "avsres_texer_square_edgeonly_24x24.bmp",
        "avsres_texer_square_edgeonly_28x28.bmp",
        "avsres_texer_square_edgeonly_30x30.bmp",
        "avsres_texer_square_sharp_20x20.bmp",
        "avsres_texer_square_sharp_32x32.bmp",
        "avsres_texer_square_sharp_48x48.bmp",
        "avsres_texer_square_sharp_60x60.bmp",
        "avsres_texer_square_sharp_64x64.bmp",
        "avsres_texer_square_sharp_72x72.bmp",
        "avsres_texer_square_sharp_96x96.bmp",
        "avsres_texer_square_sharp_250x250.bmp"
    ]
};

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// ResourceManager manages async loading and caching of resources.
// Basically, it maintains a map of fileNames to URI for the resource.
// When a request for resource fileName is received, the uri is looked up
// and the file is either async loaded or served from cache. This also manages
// a ready state with callbacks that tells when one or more resources are being loaded and
// when all resources are ready.
function ResourceManager(packs) {
    if(packs) {
        if(!_.isArray(packs)) {
            packs = [packs];
        }
        this.packs = packs;
    } else {
        this.packs = [];
    }
    this.clear();
}
Webvs.ResourceManager = Webvs.defineClass(ResourceManager, Object, Webvs.ModelLike, {
    // Register a filename and a URI in the resource manager.
    registerUri: function(fileName, uri) {
        if(_.isString(fileName) && _.isString(uri)) {
            this.uris[fileName] = uri;
        } else {
            _.extend(this.uris, fileName);
        }
    },

    get: function(key, value) {
        if(key == "uris") {
            return this.uris;
        } else if(key == "packs") {
            return this.packs;
        }
    },

    setAttribute: function(key, value, options) {
        if(key == "uris") {
            this.uris = value;
            return true;
        }
        return false;
    },

    toJSON: function() {
        return {
            uris: _.clone(this.uris)
        };
    },

    // Clears state, uri mappings and caches. Browser caches still apply.
    clear: function() {
        this.uris = {};
        this.images = {};
        this.waitCount = 0;
        this.ready = true;
    },

    destroy: function() {
        this.stopListening();
    },

    _getUri: function(fileName) {
        var uri = this.uris[fileName];
        if(uri) {
            return uri;
        }
        for(var i = this.packs.length-1;i >= 0;i--) {
            var pack = this.packs[i];
            if(pack.fileNames.indexOf(fileName) != -1) {
                return pack.prefix + fileName;
            }
        }
    },

    _loadStart: function() {
        this.waitCount++;
        if(this.waitCount == 1) {
            this.ready = false;
            this.trigger("wait");
        }
    },

    _loadEnd: function() {
        this.waitCount--;
        if(this.waitCount === 0) {
            this.ready = true;
            this.trigger("ready");
        }
    },
    
    // Loads an Image resource
    getImage: function(fileName, success, error, context) {
        context = context || this;
        var this_ = this;
        var image = this.images[fileName];
        if(image) { // check in cache
            if(success) {
                success.call(context, image);
            }
            return;
        }

        // load file
        var uri = this._getUri(fileName);
        if(!uri) {
            throw new Error("Unknown image file " + fileName);
        }
        image = new Image();
        if(uri.indexOf("data:") !== 0) {
            // add cross origin attribute for
            // remote images
            image.crossOrigin = "anonymous";
        }
        image.onload = function() {
            this_.images[fileName] = image;
            if(success) {
                success.call(context, image);
            }
            this_._loadEnd();
        };
        if(error) {
            image.onError = function() {
                if(error.call(context)) { 
    
                    // then we treat this load as complete
                    // and handled properly
                    this_._loadEnd();
                }
            };
        }
        this._loadStart();
        image.src = uri;
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// AnalyserAdapter adapts music data analysers so that it can be plugged into Webvs.
// Adapters extend this class and define the required methods.
function AnalyserAdapter() {}
Webvs.AnalyserAdapter = Webvs.defineClass(AnalyserAdapter, Object, {
    // boolean value indicating whether a beat
    // is in progress or not
    beat: false,

    // Called every frame. Override and implement analyser code
    update: function() {},

    // Returns array of waveform values
    getWaveform: function(channel) {return new Float32Array(0);},

    // Returns array of spectrum values
    getSpectrum: function(channel) {return new Float32Array(0);}
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// Analyser adapter that adapts the Dancer library.
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
    // returns array of waveform values
    getWaveform: function() {
        return this.dancer.getWaveform();
    },

    // Returns array of spectrum values
    getSpectrum: function() {
        return this.dancer.getSpectrum();
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// SMAnalyser connects SoundManager2 waveform and eqData to Webvs
function SMAnalyser(options) {
    options = _.defaults(options||{}, {
        threshold: 0.125,
        decay: 0.02
    });

    this.threshold = options.threshold;
    this.movingThreshold = 0;
    this.decay = options.decay;

    this.eqData = [];
    this.waveformData = [];

    // initialize with empty data
    for(var ch = 0;ch < 3;ch++) {
        this.eqData[ch] = new Float32Array(256);
        this.waveformData[ch] = new Float32Array(256);
    }
}
Webvs.SMAnalyser = Webvs.defineClass(SMAnalyser, Webvs.AnalyserAdapter, {
    // Creates a new SMSound object and attaches it to this analyser
    createSound: function(options) {
        options.useWaveformData = true;
        options.useEQData = true;
        this.setSound(soundManager.createSound(options));
        return this.sound;
    },

    setSound: function(sound) {
        this.sound = sound;
    },

    update: function() {
        if(!this.sound || 
           this.sound.eqData.left.length === 0 || 
           this.sound.waveformData.left.length === 0) {
            return; // no sound. nothing to update
        }
        var i;

        this.eqData[1] = new Float32Array(this.sound.eqData.left);
        this.eqData[2]= new Float32Array(this.sound.eqData.right);

        this.waveformData[1] = new Float32Array(this.sound.waveformData.left);
        this.waveformData[2] = new Float32Array(this.sound.waveformData.right);

        for(i = 0;i < 256;i++) {
            // compute center channel
            this.eqData[0][i] = this.eqData[1][i]/2 + this.eqData[2][i]/2;
            this.waveformData[0][i] = this.waveformData[1][i]/2 + this.waveformData[2][i]/2;
        }

        // Simple kick detection 
        this.beat = false;
        var peak_left = 0, peak_right = 0;
        for(i = 0;i < 256;i++) {
            peak_left += Math.abs(this.waveformData[1][i]);
            peak_right += Math.abs(this.waveformData[2][i]);
        }
        var peak = Math.max(peak_left, peak_right)/256;

        if(peak >= this.movingThreshold && peak >= this.threshold) {
            this.movingThreshold = peak;
            this.beat = true;
        } else {
            this.movingThreshold = this.movingThreshold*(1-this.decay)+peak*this.decay;
        }
    },

    // Returns array of waveform values
    getWaveform: function(channel) {
        channel = _.isUndefined(channel)?0:channel;
        return this.waveformData[channel];
    },

    // Returns array of spectrum values
    getSpectrum: function(channel) {
        channel = _.isUndefined(channel)?0:channel;
        return this.eqData[channel];
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// AnalyserAdapter adapts music data analysers so that it can be plugged into Webvs.
// Adapters extend this class and define the required methods.
function WebAudioAnalyser(options) {
    options = _.defaults(options||{}, {
        fftSize: 512,
        threshold: 0.125,
        decay: 0.02
    });

    if(options.context) {
        this.context = options.context;
    } else if(window.webkitAudioContext) {
        this.context = new webkitAudioContext();
    } else if(window.AudioContext) {
        this.context = new AudioContext();
    } else {
        throw new Error("Cannot create webaudio context");
    }

    this.fftSize = options.fftSize;

    this.threshold = options.threshold;
    this.movingThreshold = 0;
    this.decay = options.decay;

    this.visData = [];
    for(var ch = 0;ch < 3;ch++) {
        var spectrum = new Float32Array(this.fftSize/2);
        var waveform = new Float32Array(this.fftSize);
        this.visData[ch] = {spectrum: spectrum, waveform: waveform};
    }
}
Webvs.WebAudioAnalyser = Webvs.defineClass(WebAudioAnalyser, Webvs.AnalyserAdapter, {
    // Connect this analyser to any WebAudio Node
    connectToNode: function(sourceNode) {
        this.source = sourceNode;

        // this gain node simply up/down mixes input source to stereo output
        this.gain = this.context.createGain();
        this.gain.channelCountMode = "explicit";
        this.gain.channelCount = 2;
        this.source.connect(this.gain);

        // split the stereo output into respective mono channels
        this.channelSplit = this.context.createChannelSplitter(2);
        this.gain.connect(this.channelSplit);

        // analser node for each channel
        this.analysers = [];
        for(var ch = 0;ch < 2;ch++) {
            var analyser = this.context.createAnalyser();
            analyser.fftSize = this.fftSize;
            this.channelSplit.connect(analyser, ch);
            this.analysers[ch] = analyser;
        }
    },

    update: function() {
        if(!this.analysers) {
            return; // analysers not ready. nothing update
        }
        var i;
        var byteBuffer = new Uint8Array(this.fftSize);
        for(var ch = 0;ch < 2;ch++) {
            var visData = this.visData[ch+1];
            var analyser = this.analysers[ch];

            analyser.getByteFrequencyData(byteBuffer);
            for(i = 0;i < visData.spectrum.length;i++) { // scale to 0-1 range
                visData.spectrum[i] = byteBuffer[i]/255;
            }

            analyser.getByteTimeDomainData(byteBuffer);
            for(i = 0;i < visData.waveform.length;i++) { // scale to -1 to 1 range
                visData.waveform[i] = (byteBuffer[i]/255)*2-1;
            }
        }

        // center channel is average of left and right
        var centerVisData = this.visData[0];
        for(i = 0;i < centerVisData.spectrum.length;i++) {
            centerVisData.spectrum[i] = (this.visData[1].spectrum[i]/2+this.visData[2].spectrum[i]/2);
        }
        for(i = 0;i < centerVisData.waveform.length;i++) {
            centerVisData.waveform[i] = (this.visData[1].waveform[i]/2+this.visData[2].waveform[i]/2);
        }

        // Simple kick detection 
        this.beat = false;
        var peak_left = 0, peak_right = 0;
        for(i = 0;i < this.fftSize;i++) {
            peak_left += Math.abs(this.visData[1].waveform[i]);
            peak_right += Math.abs(this.visData[2].waveform[i]);
        }
        var peak = Math.max(peak_left, peak_right)/this.fftSize;

        if(peak >= this.movingThreshold && peak >= this.threshold) {
            this.movingThreshold = peak;
            this.beat = true;
        } else {
            this.movingThreshold = this.movingThreshold*(1-this.decay)+peak*this.decay;
        }
    },

    // Helper for Webvs.WebAudioAnalyser#connectToNode. This creates Audio object
    // for the audio file and connects this analyser to its mediaElementSource
    load: function(source, readyFunc) {
        var element;
        if(source instanceof HTMLMediaElement) {
            element = source;
            this.source = this.context.createMediaElementSource(element);
        } else {
            element = new Audio();
            element.src = source;
            this.source = this.context.createMediaElementSource(element);
        }

        var onCanPlay = _.bind(function() {
            this.connectToNode(this.source);
            this.source.connect(this.context.destination);

            if(readyFunc) {
                readyFunc(element);
            }

            element.removeEventListener("canplay", onCanPlay);
        }, this);
        if(element.readyState < 3) {
            element.addEventListener("canplay", onCanPlay);
        } else {
            onCanPlay();
        }

        return element;
    },

    // Returns array of waveform values
    getWaveform: function(channel) {
        channel = _.isUndefined(channel)?0:channel;
        return this.visData[channel].waveform;
    },

    // Returns array of spectrum values
    getSpectrum: function(channel) {
        channel = _.isUndefined(channel)?0:channel;
        return this.visData[channel].spectrum;
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// Main Webvs object, that represents a running webvs instance.
function Main(options) {
    Webvs.checkRequiredOptions(options, ["canvas", "analyser"]);
    options = _.defaults(options, {
        showStat: false
    });
    this.canvas = options.canvas;
    this.msgElement = options.msgElement;
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

    this.meta = {};
    this._initResourceManager(options.resourcePrefix);
    this._registerContextEvents();
    this._initGl();
    this._setupRoot({id: "root"});
}
Webvs.Main = Webvs.defineClass(Main, Object, Webvs.ModelLike, {
    _initResourceManager: function(prefix) {
        var builtinPack = Webvs.ResourcePack;
        if(prefix) {
            builtinPack = _.clone(builtinPack);
            builtinPack.prefix = prefix;
        }
        this.rsrcMan = new Webvs.ResourceManager(builtinPack);
        this.listenTo(this.rsrcMan, "wait", this.handleRsrcWait);
        this.listenTo(this.rsrcMan, "ready", this.handleRsrcReady);

        var this_ = this;
    },

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
            this.gl = this.canvas.getContext("webgl", {alpha: false});
            this.copier = new Webvs.CopyProgram(this.gl, {dynamicBlend: true});
            this.buffers = new Webvs.FrameBufferManager(this.gl, this.copier, true, 0);
        } catch(e) {
            throw new Error("Couldnt get webgl context" + e);
        }
    },

    _setupRoot: function(preset) {
        this.registerBank = {};
        this.bootTime = (new Date()).getTime();
        this.rootComponent = new Webvs.EffectList(this.gl, this, null, preset);
    },

    _startAnimation: function() {
        var _this = this;
        var drawFrame = function() {
            _this.analyser.update();
            _this.rootComponent.draw();
            _this.animReqId = requestAnimationFrame(drawFrame);
        };

        // Wrap drawframe in stats collection if required
        if(this.stats) {
            var oldDrawFrame = drawFrame;
            drawFrame = function() {
                _this.stats.begin();
                oldDrawFrame.call(this, arguments);
                _this.stats.end();
            };
        }
        this.animReqId = requestAnimationFrame(drawFrame);
    },

    _stopAnimation: function() {
        cancelAnimationFrame(this.animReqId);
    },

    // Starts the animation if not already started
    start: function() {
        if(this.isStarted) {
            return;
        }
        this.isStarted = true;
        if(this.rsrcMan.ready) {
            this._startAnimation();
        }
    },

    // Stops the animation
    stop: function() {
        if(!this.isStarted) {
            return;
        }
        this.isStarted = false;
        if(this.rsrcMan.ready) {
            this._stopAnimation();
        }
    },

    // Loads a preset JSON. If a preset is already loaded and running, then
    // the animation is stopped, and the new preset is loaded.
    loadPreset: function(preset) {
        preset = _.clone(preset); // use our own copy
        preset.id = "root";
        this.rootComponent.destroy();

        // setup resources
        this.rsrcMan.clear();
        if("resources" in preset && "uris" in preset.resources) {
            this.rsrcMan.registerUri(preset.resources.uris);
        }

        // load meta
        this.meta = _.clone(preset.meta);

        this._setupRoot(preset);
    },

    // Reset all the components.
    resetCanvas: function() {
        var preset = this.rootComponent.generateOptionsObj();
        this.rootComponent.destroy();
        this.copier.cleanup();
        this.buffers.destroy();
        this._initGl();
        this._setupRoot(preset);
    },

    notifyResize: function() {
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.buffers.resize();
        this.trigger("resize", this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    },

    setAttribute: function(key, value, options) {
        if(key == "meta") {
            this.meta = value;
            return true;
        }
        return false;
    },

    get: function(key, value) {
        if(key == "meta") {
            return this.meta;
        }
    },

    // Generates and returns the instantaneous preset JSON 
    // representation
    toJSON: function() {
        var preset = this.rootComponent.toJSON();
        preset = _.pick(preset, "clearFrame", "components");
        preset.resources = this.rsrcMan.toJSON();
        preset.meta = _.clone(this.meta);
        return preset;
    },

    destroy: function() {
        this.stop();
        this.rootComponent.destroy();
        this.rootComponent = null;
        if(this.stats) {
            var statsDomElement = this.stats.domElement;
            statsDomElement.parentNode.removeChild(statsDomElement);
            this.stats = null;
        }
        this.rsrcMan.destroy();
        this.rsrcMan = null;
        this.stopListening();
    },

    // event handlers
    handleRsrcWait: function() {
        if(this.isStarted) {
            this._stopAnimation();
        }
    },
    
    handleRsrcReady: function() {
        if(this.isStarted) {
            this._startAnimation();
        }
    }
});

})(Webvs);





/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function Component(gl, main, parent, options) {
    this.gl = gl;
    this.main = main;
    this.parent = parent;

    this.id = options.id; // TODO: check for id uniqueness
    if(!this.id) {
        this.id = _.uniqueId(this.constructor.Meta.name + "_");
    }
    this.enabled = _.isUndefined(options.enabled)?true:options.enabled;

    this.opts = _.omit(options, ["id", "enabled"]);
    if(this.defaultOptions) {
        this.opts = _.defaults(this.opts, this.defaultOptions);
    }

    this.init();
}
Webvs.Component = Webvs.defineClass(Component, Object, Webvs.ModelLike, {
    init: function() {},

    draw: function() {},

    destroy: function() {
        this.stopListening();
    },

    setParent: function(newParent) {
        this.parent = newParent;
    },

    toJSON: function() {
        var opts = _.clone(this.opts);
        opts.id = this.id;
        opts.type = this.constructor.Meta.name;
        opts.enabled = this.enabled;
        return opts;
    },

    setAttribute: function(key, value, options) {
        var oldValue = this.get(key);
        if(key == "type" || _.isEqual(value, oldValue)) {
            return false;
        }

        // set the property
        if(key == "enabled") {
            this.enabled = value;
        } else if(key == "id") {
            this.id = value;
        } else {
            this.opts[key] = value;
        }

        // call all onchange handlers
        // we just call these manually here no need to
        // go through event triggers
        if(this.onChange) {
            try {
                var onChange = _.flatten([
                    this.onChange[key] || [],
                    this.onChange["*"] || []
                ]);

                for(var i = 0;i < onChange.length;i++) {
                    this[onChange[i]].call(this, value, key, oldValue);
                }
            } catch(e) {
                // restore old value in case any of the onChange handlers fail
                if(key == "enabled") {
                    this.enabled = oldValue;
                } else if(key == "id") {
                    this.id = oldValue;
                } else {
                    this.opts[key] = oldValue;
                }

                this.lastError = e;
                this.trigger("error:" + key, this, value, options, e);
            }
        }

        return true;
    },

    get: function(key) {
        if(key == "enabled") {
            return this.enabled;
        } else if(key == "id") {
            return this.id;
        } else {
            return this.opts[key];
        }
    },

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
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {


// A base class for all components that can have sub components.
// Manages, cloning and component tree operations
function Container(gl, main, parent, opts) {
    Container.super.constructor.call(this, gl, main, parent, opts);
    delete this.opts.components;
}
Webvs.Container = Webvs.defineClass(Container, Webvs.Component, {
    init: function(gl, main, parent) {
        var components = [];
        if(this.opts.components) {
            for(var i = 0;i < this.opts.components.length;i++) {
                var opts = this.opts.components[i];
                var component = new (Webvs.getComponentClass(opts.type))(this.gl, this.main, this, opts);
                components.push(component);
            }
        }
        this.components = components;
    },

    destroy: function() {
        Container.super.destroy.call(this);
        for(var i = 0;i < this.components.length;i++) {
            this.components[i].destroy();
        }
    },
    
    createComponent: function(opts) {
        return (new (Webvs.getComponentClass(opts.type))(this.gl, this.main, this, opts));
    },
    
    // Adds a component as child of the given parent that
    // resides under this containers subtree
    addComponent: function(componentOpts, pos, options) {
        var component;
        if(componentOpts instanceof Webvs.Component) {
            component = componentOpts;
            component.setParent(this);
        } else {
            component = this.createComponent(componentOpts);
        }
        if(!_.isNumber(pos)) {
            pos = this.components.length;
        }
        this.components.splice(pos, 0, component);

        options = _.defaults({pos: pos}, options);
        this.trigger("addComponent", component, this, options);
        return component;
    },

    detachComponent: function(pos, options) {
        if(_.isString(pos)) {
            var id = pos;
            var i;
            for(i = 0;i < this.components.length;i++) {
                if(this.components[i].id == id) {
                    pos = i;
                    break;
                }
            }
            if(i == this.components.length) {
                return;
            }
        }
        var component = this.components[pos];
        this.components.splice(pos, 1);

        options = _.defaults({pos: pos}, options);
        this.trigger("detachComponent", component, this, options);
        return component;
    },

    findComponent: function(id) {
        var i;
        for(i = 0;i < this.components.length;i++) {
            var component = this.components[i];
            if(component.id == id) {
                return component;
            }
        }

        // search in any subcontainers
        for(i = 0;i < this.components.length;i++) {
            var container = this.components[i];
            if(!(container instanceof Container)) {
                continue;
            }
            var subComponent = container.findComponent(id);
            if(subComponent) {
                return subComponent;
            }
        }
    },

    // Constructs complete options object for this container and its
    // subtree
    toJSON: function() {
        var opts = Container.super.toJSON.call(this);

        opts.components = [];
        for(var i = 0;i < this.components.length;i++) {
            opts.components.push(this.components[i].toJSON());
        }
        return opts;
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// Effectlist is a container that renders components to a separate buffer. and blends
// it in with the parent buffer. Its also used as the root component in Webvs.Main
function EffectList(gl, main, parent, opts) {
    EffectList.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(EffectList, {
    name: "EffectList"
});

var ELBlendModes = _.extend({
    "IGNORE": 50
}, Webvs.BlendModes);
EffectList.ELBlendModes = ELBlendModes;

Webvs.defineClass(EffectList, Webvs.Container, {
    defaultOptions: {
        code: {
            init: "",
            perFrame: ""
        },
        output: "REPLACE",
        input: "IGNORE",
        clearFrame: false,
        enableOnBeat: false,
        enableOnBeatFor: 1
    },

    onChange: {
        code: "updateCode",
        output: "updateBlendMode",
        input: "updateBlendMode"
    },

    init: function() {
        EffectList.super.init.call(this);
        this.fm = new Webvs.FrameBufferManager(this.gl, this.main.copier, this.parent?true:false);
        this.updateCode();
        this.updateBlendMode(this.opts.input, "input");
        this.updateBlendMode(this.opts.output, "output");
        this.frameCounter = 0;
        this.first = true;
        this.listenTo(this.main, "resize", this.handleResize);
    },

    draw: function() {
        var opts = this.opts;

        if(opts.enableOnBeat) {
            if(this.main.analyser.beat) {
                this.frameCounter = opts.enableOnBeatFor;
            } else if(this.frameCounter > 0) {
                this.frameCounter--;
            }

            // only enable for enableOnBeatFor # of frames
            if(this.frameCounter === 0) {
                return;
            }
        }

        this.code.beat = this.main.analyser.beat?1:0;
        this.code.enabled = 1;
        this.code.clear = opts.clearFrame;
        if(!this.inited) {
            this.inited = true;
            this.code.init();
        }
        this.code.perFrame();
        if(this.code.enabled === 0) {
            return;
        }

        // set rendertarget to internal framebuffer
        this.fm.setRenderTarget();

        // clear frame
        if(opts.clearFrame || this.first || this.code.clear) {
            this.gl.clearColor(0,0,0,1);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.first = false;
        }

        // blend input texture onto internal texture
        if(this.input !== ELBlendModes.IGNORE) {
            var inputTexture = this.parent.fm.getCurrentTexture();
            this.main.copier.run(this.fm, this.input, inputTexture);
        }

        // render all the components
        for(var i = 0;i < this.components.length;i++) {
            if(this.components[i].enabled) {
                this.components[i].draw();
            }
        }

        // switch to old framebuffer
        this.fm.restoreRenderTarget();

        // blend current texture to the output framebuffer
        if(this.output != ELBlendModes.IGNORE) {
            if(this.parent) {
                this.main.copier.run(this.parent.fm, this.output, this.fm.getCurrentTexture());
            } else {
                this.main.copier.run(null, null, this.fm.getCurrentTexture());
            }
        }
    },

    destroy: function() {
        EffectList.super.destroy.call(this);
        if(this.fm) {
            // destroy the framebuffer manager
            this.fm.destroy();
        }
    },

    updateCode: function() {
        this.code = Webvs.compileExpr(this.opts.code, ["init", "perFrame"]).codeInst;
        this.code.setup(this.main, this);
        this.inited = false;
    },

    updateBlendMode: function(value, name) {
        this[name] = Webvs.getEnumValue(value, ELBlendModes);
    },

    handleResize: function() {
        this.fm.resize();
        this.code.updateDimVars(this.gl);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// Base class for Webgl Shaders. This provides an abstraction
// with support for blended output, easier variable bindings
// etc.

// For outputblending, we try to use GL blendEq and blendFunc
// if possible, otherwise we fallback to shader based blending,
// where we swap the frame, sample the previous texture, and blend
// the colors in the shader itself. To do this seamlessly, shader code in subclasses
// should use a set of macros. eg: setFragColor instead of
// setting gl_FragColor directly. The proper macro implementation
// is inserted based on the blending modes.

// #### glsl utilities

// The following utilities are usable inside the shader code in subclasses

// + `setPosition(vec2 pos)` - sets gl_Position
// + `getSrcColorAtPos(vec2 pos)` - pixel value at pos in u_srcTexture
// + `getSrcColor(vec2 pos)` - same as above, but uses v_position
// + `setFragColor(vec4 color)` - sets the correctly blended fragment color
// + `sampler2D u_srcTexture` - the source texture from previous frame. enabled
//     when swapFrame is set to true
// + `vec2 u_resolution` - the screen resolution. enabled only if fm is 
//     passed to {@link Webvs.ShaderProgram.run} call
// + `vec2 v_position` - a 0-1, 0-1 normalized varying of the vertex. enabled
//     when varyingPos option is used
function ShaderProgram(gl, opts) {
    opts = _.defaults(opts, {
        blendMode: Webvs.REPLACE,
        swapFrame: false,
        copyOnSwap: false,
        dynamicBlend: false,
        blendValue: 0.5
    });

    var vsrc = [
        "precision mediump float;",
        "varying vec2 v_position;",
        "uniform vec2 u_resolution;",
        "uniform sampler2D u_srcTexture;",

        "#define PI "+Math.PI,
        "#define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))",
        "#define setPosition(pos) (v_position = (((pos)+1.0)/2.0),gl_Position = vec4((pos), 0, 1))"
    ];

    var fsrc = [
        "precision mediump float;",
        "varying vec2 v_position;",
        "uniform vec2 u_resolution;",
        "uniform sampler2D u_srcTexture;",

        "#define PI "+Math.PI,
        "#define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))",
        "#define getSrcColor() (texture2D(u_srcTexture, v_position))"
    ];

    this.gl = gl;
    this.swapFrame = opts.swapFrame;
    this.copyOnSwap = opts.copyOnSwap;
    this.blendValue = opts.blendValue;
    this.blendMode = opts.blendMode;
    this.dynamicBlend = opts.dynamicBlend;

    if(this.dynamicBlend) {
        fsrc.push(
            "uniform int u_blendMode;",
            "void setFragColor(vec4 color) {"
        );
        _.each(ShaderProgram.shaderBlendEq, function(eq, mode) {
            fsrc.push(
                "   if(u_blendMode == "+mode+") {",
                "       gl_FragColor = ("+eq+");",
                "   }",
                "   else"
            );
        }, this);
        fsrc.push(
            "   {",
            "       gl_FragColor = color;",
            "   }",
            "}"
        );
    } else {
        if(this._isShaderBlend(this.blendMode)) {
            var eq = ShaderProgram.shaderBlendEq[this.blendMode];
            fsrc.push("#define setFragColor(color) (gl_FragColor = ("+eq+"))");
        } else {
            fsrc.push("#define setFragColor(color) (gl_FragColor = color)");
        }
    }

    this.fragmentSrc = fsrc.join("\n") + "\n" + opts.fragmentShader.join("\n");
    this.vertexSrc = vsrc.join("\n") + "\n" + opts.vertexShader.join("\n");
    this._locations = {};
    this._textureVars = [];
    this._arrBuffers = {};

    this._compile();
}

// these are blend modes not supported with gl.BLEND
// and the formula to be used inside shader
ShaderProgram.shaderBlendEq = _.object([
    [Webvs.MAXIMUM, "max(color, texture2D(u_srcTexture, v_position))"],
    [Webvs.MULTIPLY, "clamp(color * texture2D(u_srcTexture, v_position) * 256.0, 0.0, 1.0)"]
]);

Webvs.ShaderProgram = Webvs.defineClass(ShaderProgram, Object, {
    _isShaderBlend: function(mode) {
        return (mode in ShaderProgram.shaderBlendEq);
    },

    _compile: function() {
        var gl = this.gl;
        var vertex = this._compileShader(this.vertexSrc, gl.VERTEX_SHADER);
        var fragment = this._compileShader(this.fragmentSrc, gl.FRAGMENT_SHADER);
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

    // Performs the actual drawing and any further bindings and calculations if required.
    draw: function() {},

    // Runs this shader program
    run: function(fm, blendMode) {
        var gl = this.gl;
        var oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.useProgram(this.program);

        if(blendMode && !this.dynamicBlend) {
            throw new Error("Cannot set blendmode at runtime. Use dynamicBlend");
        }
        blendMode = blendMode || this.blendMode;

        if(fm) {
            this.setUniform("u_resolution", "2f", gl.drawingBufferWidth, gl.drawingBufferHeight);
            if(this.swapFrame || this._isShaderBlend(blendMode)) {
                this.setUniform("u_srcTexture", "texture2D", fm.getCurrentTexture());
                fm.switchTexture();
                if(this.copyOnSwap) {
                    fm.copyOver();
                }
            } else if(this.dynamicBlend) {
                this.setUniform("u_srcTexture", "texture2D", null);
            }
        }

        if(this.dynamicBlend) {
            this.setUniform("u_blendMode", "1i", blendMode);
        }

        this._setGlBlendMode(blendMode);
        this.draw.apply(this, _.drop(arguments, 2));
        gl.disable(gl.BLEND);
        gl.useProgram(oldProgram);
    },

    _setGlBlendMode: function(mode) {
        var gl = this.gl;
        switch(mode) {
            case Webvs.ADDITIVE:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case Webvs.SUBTRACTIVE1:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
                break;
            case Webvs.SUBTRACTIVE2:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_SUBTRACT);
                break;
            case Webvs.ALPHA:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case Webvs.MULTIPLY2:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.DST_COLOR, gl.ZERO);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case Webvs.ADJUSTABLE:
                gl.enable(gl.BLEND);
                gl.blendColor(0, 0, 0, this.blendValue);
                gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case Webvs.AVERAGE:
                gl.enable(gl.BLEND);
                gl.blendColor(0.5, 0.5, 0.5, 1);
                gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            // shader blending cases
            case Webvs.REPLACE:
            case Webvs.MULTIPLY:
            case Webvs.MAXIMUM:
                gl.disable(gl.BLEND);
                break;
            default:
                throw new Error("Unknown blend mode " + mode + " in shader");
        }
    },

    // returns the location of a uniform or attribute. locations are cached.
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

    // returns the index of a texture. assigns id if not already assigned.
    getTextureId: function(name) {
        var id = _.indexOf(this._textureVars, name);
        if(id === -1) {
            this._textureVars.push(name);
            id = this._textureVars.length-1;
        }
        return id;
    },

    // binds value of a uniform variable in this program
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

    // binds the vertex attribute array
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

    // destroys webgl resources consumed by this program.
    // call in component destroy
    destroy: function() {
        var gl = this.gl;
        _.each(this._buffers, function(buffer) {
            gl.deleteBuffer(buffer);
        }, this);
        gl.deleteProgram(this.program);
        gl.deleteShader(this.vertexShader);
        gl.deleteShader(this.fragmentShader);
    }

});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A Base for shaders that provides a vertexShader and vertices
// for a rectangle that fills the entire screen
function QuadBoxProgram(gl, options) {
    options = _.defaults(options, {
        vertexShader: [
            "attribute vec2 a_position;",
            "void main() {",
            "   setPosition(a_position);",
            "}"
        ]
    });
    QuadBoxProgram.super.constructor.call(this, gl, options);
}
Webvs.QuadBoxProgram = Webvs.defineClass(QuadBoxProgram, Webvs.ShaderProgram, {
    // Sets the vertices for the quad box
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
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A Shader that copies given texture onto current buffer
function CopyProgram(gl, options) {
    options = _.defaults(options||{}, {
        fragmentShader: [
            "uniform sampler2D u_copySource;",
            "void main() {",
            "   setFragColor(texture2D(u_copySource, v_position));",
            "}"
        ]
    });
    CopyProgram.super.constructor.call(this, gl, options);
}
Webvs.CopyProgram = Webvs.defineClass(CopyProgram, Webvs.QuadBoxProgram, {
    // Renders this shader
    draw: function(srcTexture) {
        this.setUniform("u_copySource", "texture2D", srcTexture);
        CopyProgram.super.draw.call(this);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// FrameBufferManager maintains a set of render targets
// and can switch between them.
function FrameBufferManager(gl, copier, textureOnly, texCount) {
    this.gl = gl;
    this.copier = copier;
    this.initTexCount = _.isNumber(texCount)?texCount:2;
    this.textureOnly = textureOnly;
    this._initFrameBuffers();
}
Webvs.FrameBufferManager = Webvs.defineClass(FrameBufferManager, Object, {
    _initFrameBuffers: function() {
        var gl = this.gl;

        if(!this.textureOnly) {
            this.framebuffer = gl.createFramebuffer();
        }

        this.names = {};
        this.textures = [];
        for(var i = 0;i < this.initTexCount;i++) {
            this.addTexture();
        }
        this.curTex = 0;
        this.isRenderTarget = false;
    },

    addTexture: function(name) {
        if(name && name in this.names) {
            this.names[name].refCount++;
            return this.names[name];
        }
        var gl = this.gl;
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth,
                      gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        this.textures.push(texture);
        if(name) {
            this.names[name] = {
                refCount: 1,
                index: this.textures.length-1
            };
        }
        return this.textures.length-1;
    },

    removeTexture: function(arg) {
        if(_.isString(arg) && arg in this.names) {
            if(this.names[arg].refCount > 1) {
                this.names[arg].refCount--;
                return;
            }
        }
        var index = this._findIndex(arg);
        if(index == this.curTex && (this.oldTexture || this.oldFrameBuffer)) {
            throw new Error("Cannot remove current texture when set as render target");
        }
        var gl = this.gl;
        gl.deleteTexture(this.textures[index]);
        this.textures.splice(index, 1);
        if(this.curTex >= this.textures.length) {
            this.curTex = this.textures.lenght-1;
        }
        delete this.names[arg];
    },

    // Saves the current render target and sets this
    // as the render target
    setRenderTarget: function(texName) {
        var gl = this.gl;
        var curFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        if(this.textureOnly) {
            if(!curFrameBuffer) {
                throw new Error("Cannot use textureOnly when current rendertarget is the default FrameBuffer");
            }
            this.oldTexture = gl.getFramebufferAttachmentParameter(
                                  gl.FRAMEBUFFER,
                                  gl.COLOR_ATTACHMENT0,
                                  gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
        } else {
            this.oldFrameBuffer = curFrameBuffer;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        }
        this.isRenderTarget = true;
        if(!_.isUndefined(texName)) {
            this.switchTexture(texName);
        } else {
            var texture = this.textures[this.curTex];
            gl.framebufferTexture2D(gl.FRAMEBUFFER,
                                    gl.COLOR_ATTACHMENT0,
                                    gl.TEXTURE_2D,
                                    texture, 0);
        }
    },

    // Restores the render target previously saved with
    // a Webvs.FrameBufferManager.setRenderTarget call
    restoreRenderTarget: function() {
        var gl = this.gl;
        if(this.textureOnly) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER,
                                    gl.COLOR_ATTACHMENT0,
                                    gl.TEXTURE_2D,
                                    this.oldTexture, 0);
            this.oldTexture = null;
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.oldFrameBuffer);
            this.oldFrameBuffer = null;
        }
        this.isRenderTarget = false;
    },

    // Returns the texture that is currently being used
    getCurrentTexture: function() {
        return this.textures[this.curTex];
    },

    getTexture: function(arg) {
        var index = this._findIndex(arg);
        return this.textures[index];
    },

    // Copies the previous texture into the current texture
    copyOver: function() {
        var texCount = this.textures.length;
        var prevTexture = this.textures[(texCount+this.curTex-1)%texCount];
        this.copier.run(null, null, prevTexture);
    },

    // Swaps the current texture
    switchTexture: function(arg) {
        if(!this.isRenderTarget) {
            throw new Error("Cannot switch texture when not set as rendertarget");
        }
        var gl = this.gl;
        this.curTex = _.isUndefined(arg)?(this.curTex+1):this._findIndex(arg);
        this.curTex %= this.textures.length;
        var texture = this.textures[this.curTex];
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
                                gl.COLOR_ATTACHMENT0,
                                gl.TEXTURE_2D, texture, 0);
    },

    resize: function() {
        // TODO: investigate chrome warning: INVALID_OPERATION: no texture
        var gl = this.gl;
        for(var i = 0;i < this.textures.length;i++) {
            gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth,
                          gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
    },

    // cleans up all webgl resources
    destroy: function() {
        var gl = this.gl;
        for(var i = 0;i < this.textures.length;i++) {
            gl.deleteTexture(this.textures[i]);
        }
        if(!this.textureOnly) {
            gl.deleteFramebuffer(this.frameBuffer);
        }
    },

    _findIndex: function(arg) {
        var index;
        if(_.isString(arg) && arg in this.names) {
            index = this.names[arg].index;
        } else if(_.isNumber(arg) && arg >=0 && arg < this.textures.length) {
            index = arg;
        } else {
            throw new Error("Unknown texture '" + arg + "'");
        }
        return index;
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A Shader that clears the screen to a given color
function ClearScreenProgram(gl, blendMode) {
    ClearScreenProgram.super.constructor.call(this, gl, {
        fragmentShader: [
            "uniform vec3 u_color;",
            "void main() {",
            "   setFragColor(vec4(u_color, 1));",
            "}"
        ],
        blendMode: blendMode
    });
}
Webvs.ClearScreenProgram = Webvs.defineClass(ClearScreenProgram, Webvs.QuadBoxProgram, {
    // Renders this shader
    draw: function(color) {
        this.setUniform.apply(this, ["u_color", "3f"].concat(color));
        ClearScreenProgram.super.draw.call(this);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// Base class for AVS expression Syntax Tree
function AstBase() {}
Webvs.AstBase = Webvs.defineClass(AstBase, Object);

// Binary Expression
function AstBinaryExpr(operator, leftOperand, rightOperand) {
    this.operator = operator;
    this.leftOperand = leftOperand;
    this.rightOperand = rightOperand;
}
Webvs.AstBinaryExpr = Webvs.defineClass(AstBinaryExpr, AstBase);

// Unary Expression
function AstUnaryExpr(operator, operand) {
    this.operator = operator;
    this.operand = operand;
}
Webvs.AstUnaryExpr = Webvs.defineClass(AstUnaryExpr, AstBase);

// Function call
function AstFuncCall(funcName, args) {
    this.funcName = funcName;
    this.args = args;
}
Webvs.AstFuncCall = Webvs.defineClass(AstFuncCall, AstBase);

// Variable assignment
function AstAssignment(lhs, expr) {
    this.lhs = lhs;
    this.expr = expr;
}
Webvs.AstAssignment = Webvs.defineClass(AstAssignment, AstBase);

// Code start symbol
function AstProgram(statements) {
    this.statements = statements;
}
Webvs.AstProgram = Webvs.defineClass(AstProgram, AstBase);

// Atomic expression
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
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// An object that encapsulates the generated executable code
// and its state values. Also contains implementations of
// functions callable from expressions
function CodeInstance() {}
Webvs.CodeInstance = Webvs.defineClass(CodeInstance, Object, {
    // avs expression rand function
    rand: function(max) { 
        return Math.floor(Math.random() * max) + 1;
    },

    // avs expression gettime function
    gettime: function(startTime) {
        switch(startTime) {
            case 0:
                var currentTime = (new Date()).getTime();
                return (currentTime-this._bootTime)/1000;
            default: throw new Error("Invalid startTime mode for gettime call");
        }
    },

    // avs expression getosc function
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

    // bind state values to uniforms
    bindUniforms: function(program) {
        // bind all values
        _.each(this._uniforms, function(name) {
            program.setUniform(name, "1f", this[name]);
        }, this);

        // bind registers
        _.each(this._glslRegisters, function(name) {
            program.setUniform(name, "1f", this._registerBank[name]);
        }, this);

        // bind random step value if there are usages of random
        if(this._hasRandom) {
            var step = [Math.random()/100, Math.random()/100];
            program.setUniform("__randStep", "2fv", step);
        }

        // bind precomputed values
        _.each(this._preCompute, function(entry, name) {
            var args = _.map(_.drop(entry), function(arg) {
                if(_.isString(arg)) {
                    if(arg.substring(0, 5) == "__REG") {
                        return this._registerBank[arg];
                    } else {
                        return this[arg];
                    }
                } else {
                    return arg;
                }
            }, this);
            var result = this[entry[0]].apply(this, args);
            program.setUniform(name, "1f", result);
        }, this);
    },

    // initializes this codeinstance
    setup: function(main, parent) {
        this._registerBank = main.registerBank;
        this._bootTime = main.bootTime;
        this._analyser = main.analyser;
        this.updateDimVars(parent.gl);

        // clear all used registers
        _.each(this._registerUsages, function(name) {
            if(!_.has(main.registerBank, name)) {
                main.registerBank[name] = 0;
            }
        });
    },

    updateDimVars: function(gl) {
        this.w = gl.drawingBufferWidth;
        this.h = gl.drawingBufferHeight;
    }
});

// creates an array of clones of code instances
CodeInstance.clone = function(clones, count) {
    if(!_.isArray(clones)) {
        clones.cid = 0;
        clones = [codeInst];
    }

    var clonesLength = clones.length;
    if(clonesLength < count) {
        _.times(count-clonesLength, function(index) {
            var clone = Object.create(CodeInstance.prototype);
            _.extend(clone, clones[0]);
            clone.cid = index+clonesLength;
            clones.push(clone);
        });
    } else if(clonesLength > count) {
        clones = _.first(this.clones, count);
    }
    return clones;
};

// copies instance values from one code instance to another
CodeInstance.copyValues = function(dest, src) {
    _.each(src, function(name, value) {
        if(!_.isFunction(value) && name.charAt(0) !== "_") {
            dest[name] = value;
        }
    });
};


})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {


Webvs.compileExpr = function(codeSrc, jsFuncs, glslFuncs, nonUniforms) {
    jsFuncs = jsFuncs || [];
    glslFuncs = glslFuncs || [];
    nonUniforms = nonUniforms || [];

    // cleanup code source
    codeSrc = _.chain(codeSrc).map(function(code, name) {
        if(_.isArray(code)) {
            code = code.join("\n");
        }
        code = code.trim();
        return [name, code];
    }).filter(function(code) { 
        return code[1].length > 0;
    }).object().value();

    // 1) Parse the code
    var codeAst = parseCode(codeSrc);
    // 2) Process the AST
    var tables = processAst(codeAst, jsFuncs, glslFuncs, nonUniforms);
    // 3) Generate code
    var codeInst = generateJs(codeAst, tables, jsFuncs);
    var glslCode = generateGlsl(codeAst, tables, glslFuncs);

    return {codeInst: codeInst, glslCode: glslCode};
};


function parseCode(codeSrc) {
    var codeAst = {}; // abstract syntax tree
    for(var name in codeSrc) {
        try {
            codeAst[name] = Webvs.PegExprParser.parse(codeSrc[name]);
        } catch(e) {
            throw new Error("Error parsing " + name + " (" + e.line + ":" + e.column + ")" + " : " + e);
        }
    }
    return codeAst;
}

function processAst(codeAst, jsFuncs, glslFuncs, extraNonUniforms) {
    var tables = {
        funcCall: {},
        variable: {},
        register: {},
        preCompute: {}
    };

    var preComputeCounter = 0;

    function processNode(ast, name) {
        var i;
        if(ast instanceof Webvs.AstProgram) {
            for(i = 0;i < ast.statements.length;i++) {
                processNode(ast.statements[i], name);
            }
        } else if(ast instanceof Webvs.AstBinaryExpr) {
            processNode(ast.leftOperand, name);
            processNode(ast.rightOperand, name);
        }
        else if(ast instanceof Webvs.AstUnaryExpr) {
            processNode(ast.operand, name);
        }
        else if(ast instanceof Webvs.AstFuncCall) {
            checkFunc(ast);

            // if its a precomputable function to be generated in glsl
            // then build a table entry
            if(_.contains(glslFuncs, name) && _.contains(glslPreComputeFuncs, ast.funcName)) {
                var allStatic = _.every(ast.args, function(arg) {
                    return arg instanceof Webvs.AstPrimaryExpr;
                });
                if(!allStatic) {
                    throw new Error("Non Pre-Computable arguments for "+ast.funcName+" in shader code, use variables or constants");
                }
                var entry = [ast.funcName].concat(_.map(ast.args, function(arg) {return arg.value;}));
                var uniformName;
                for(var key in tables.preCompute) {
                    if(tables.preCompute[key] == entry) {
                        break;
                    }
                }
                if(!uniformName) {
                    uniformName = "__PC_" +  ast.funcName + "_" + preComputeCounter++;
                    tables.preCompute[uniformName] = entry;
                }

                ast.preComputeUniformName = uniformName;
            }

            tables.funcCall[name].push(ast.funcName);
            for(i = 0;i < ast.args.length;i++) {
               processNode(ast.args[i], name);
            }
        }
        else if(ast instanceof Webvs.AstAssignment) {
            processNode(ast.lhs, name);
            processNode(ast.expr, name);
        }
        else if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "ID") {
            tables.variable[name].push(ast.value);
        }
        else if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "REG") {
            tables.register[name].push(ast.value);
        }
    }


    for(var name in codeAst) {
        tables.funcCall[name] = [];
        tables.variable[name] = [];
        tables.register[name] = [];

        processNode(codeAst[name], name);

        tables.funcCall[name] = _.uniq(tables.funcCall[name]);
        tables.variable[name] = _.uniq(tables.variable[name]);
        tables.register[name] = _.uniq(tables.register[name]);
    }

    tables.jsVars   = _.chain(tables.variable).pick(jsFuncs  ).values().flatten().uniq().value();
    tables.glslVars = _.chain(tables.variable).pick(glslFuncs).values().flatten().uniq().value();
    tables.nonUniforms = _.chain(tables.glslVars).difference(tables.jsVars).union(extraNonUniforms).uniq().value();
    tables.uniforms = _.intersection(tables.glslVars, tables.jsVars);
    tables.glslUsedFuncs = _.chain(tables.funcCall).pick(glslFuncs).values().flatten().uniq().value();
    tables.glslRegisters = _.chain(tables.register).pick(glslFuncs).values().flatten().uniq().value();

    return tables;
}

function generateJs(codeAst, tables, jsFuncs) {
    function generateNode(ast) {
        if(ast instanceof Webvs.AstBinaryExpr) {
            return "(" + generateNode(ast.leftOperand) + ast.operator + generateNode(ast.rightOperand) + ")";
        }
        if(ast instanceof Webvs.AstUnaryExpr) {
            return "(" + ast.operator + generateNode(ast.operand) + ")";
        }
        if(ast instanceof Webvs.AstFuncCall) {
            switch(ast.funcName) {
                case "above":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        ">",
                        generateNode(ast.args[1]),
                        "?1:0)"
                    ].join("");
                case "below":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "<",
                        generateNode(ast.args[1]),
                        "?1:0)"
                    ].join("");
                case "equal":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "==",
                        generateNode(ast.args[1]),
                        "?1:0)"
                    ].join("");
                case "if":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "!==0?",
                        generateNode(ast.args[1]),
                        ":",
                        generateNode(ast.args[2]),
                        ")"
                    ].join("");
                case "select":
                    var code = ["((function() {"];
                    code.push("switch("+generateNode(ast.args[0])+") {");
                    _.each(_.last(ast.args, ast.args.length-1), function(arg, i) {
                        code.push("case "+i+": return "+generateNode(arg)+";");
                    });
                    code.push("default : throw new Error('Unknown selector value in select');");
                    code.push("}}).call(this))");
                    return code.join("");
                case "sqr":
                    return "(Math.pow((" + generateNode(ast.args[0]) + "),2))";
                case "band":
                    return "((("+generateNode(ast.args[0])+")&&("+generateNode(ast.args[1])+"))?1:0)";
                case "bor":
                    return "((("+generateNode(ast.args[0])+")||("+generateNode(ast.args[1])+"))?1:0)";
                case "bnot":
                    return "((!("+generateNode(ast.args[0])+"))?1:0)";
                case "invsqrt":
                    return "(1/Math.sqrt("+generateNode(ast.args[0])+"))";
                case "atan2":
                    return "(Math.atan(("+generateNode(ast.args[0])+")/("+generateNode(ast.args[1])+")))";
                default:
                    var prefix;
                    var args = _.map(ast.args, function(arg) {return generateNode(arg);}).join(",");
                    if(_.contains(jsMathFuncs, ast.funcName)) {
                        prefix = "Math.";
                    } else {
                        prefix = "this.";
                    }
                    return "(" + prefix + ast.funcName + "(" + args + "))";
            }
        }
        if(ast instanceof Webvs.AstAssignment) {
            return generateNode(ast.lhs) + "=" + generateNode(ast.expr);
        }
        if(ast instanceof Webvs.AstProgram) {
            var stmts = _.map(ast.statements, function(stmt) {return generateNode(stmt);});
            return stmts.join(";\n");
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "VALUE") {
            return ast.value.toString();
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "CONST") {
            return translateConstants(ast.value).toString();
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "ID") {
            return "this." + ast.value;
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "REG") {
            return "this._registerBank[\"" + ast.value + "\"]";
        }
    }

    var i;
    var codeInst = new Webvs.CodeInstance();

    // clear all variables
    for(i = 0;i < tables.jsVars.length;i++) {
        codeInst[tables.jsVars[i]] = 0;
    }

    // generate code
    for(i = 0;i < jsFuncs.length;i++) {
        var name = jsFuncs[i];
        var ast = codeAst[name];
        if(ast) {
            var jsCodeString = generateNode(ast);
            codeInst[name] = new Function(jsCodeString);
        } else {
            codeInst[name] = Webvs.noop;
        }
    }

    codeInst._registerUsages = _.chain(tables.register).values().flatten().uniq().value();
    codeInst._glslRegisters = tables.glslRegisters;
    if(_.contains(tables.glslUsedFuncs, "rand")) {
        codeInst._hasRandom = true;
    }
    codeInst._uniforms = tables.uniforms;
    codeInst._preCompute = tables.preCompute;

    return codeInst;
}

function generateGlsl(codeAst, tables, glslFuncs) {
    function generateNode(ast) {
        if(ast instanceof Webvs.AstBinaryExpr) {
            return "(" + generateNode(ast.leftOperand) + ast.operator + generateNode(ast.rightOperand) + ")";
        }
        if(ast instanceof Webvs.AstUnaryExpr) {
            return "(" + ast.operator + generateNode(ast.operand) + ")";
        }
        if(ast instanceof Webvs.AstFuncCall) {
            if(ast.preComputeUniformName) {
                return "(" + ast.preComputeUniformName + ")";
            }
            switch(ast.funcName) {
                case "above":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        ">",
                        generateNode(ast.args[1]),
                        "?1.0:0.0)"
                    ].join("");
                case "below":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "<",
                        generateNode(ast.args[1]),
                        "?1.0:0.0)"
                    ].join("");
                case "equal":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "==",
                        generateNode(ast.args[1]),
                        "?1.0:0.0)"
                    ].join("");
                case "if":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "!=0.0?",
                        generateNode(ast.args[1]),
                        ":",
                        generateNode(ast.args[2]),
                        ")"
                    ].join("");
                case "select":
                    var selectExpr = generateNode(ast.args[0]);
                    var generateSelect = function(args, i) {
                        if(args.length == 1) {
                            return generateNode(args[0]);
                        }
                        else {
                            return [
                                "(("+selectExpr+" === "+i+")?",
                                "("+generateNode(args[0])+"):",
                                "("+generateSelect(_.last(args, args.length-1), i+1)+"))"
                            ].join("");
                        }
                    };
                    return generateSelect(_.last(ast.args, ast.args.length-1), 0);
                case "sqr":
                    return "(pow((" + generateNode(ast.args[0]) + "), 2))";
                case "band":
                    return "(float(("+generateNode(ast.args[0])+")&&("+generateNode(ast.args[1])+")))";
                case "bor":
                    return "(float(("+generateNode(ast.args[0])+")||("+generateNode(ast.args[1])+")))";
                case "bnot":
                    return "(float(!("+generateNode(ast.args[0])+")))";
                case "invsqrt":
                    return "(1/sqrt("+generateNode(ast.args[0])+"))";
                case "atan2":
                    return "(atan(("+generateNode(ast.args[0])+"),("+generateNode(ast.args[1])+"))";
                default:
                    var args = _.map(ast.args, function(arg) {return generateNode(arg);}).join(",");
                    return "(" + ast.funcName + "(" + args + "))";
            }
        }
        if(ast instanceof Webvs.AstAssignment) {
            return generateNode(ast.lhs) + "=" + generateNode(ast.expr);
        }
        if(ast instanceof Webvs.AstProgram) {
            var stmts = _.map(ast.statements, function(stmt) {return generateNode(stmt);});
            return stmts.join(";\n")+";";
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "VALUE") {
            return Webvs.glslFloatRepr(ast.value);
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "CONST") {
            return translateConstants(ast.value).toString();
        }
        if(ast instanceof Webvs.AstPrimaryExpr && (ast.type === "ID" || ast.type === "REG")) {
            return ast.value;
        }
    }

    var glslCode = [];
    var i;

    // glsl variable declarations
    glslCode = glslCode.concat(_.map(tables.nonUniforms, function(name) {
        return "float " + name + " = 0.0;";
    }));
    glslCode = glslCode.concat(_.map(tables.uniforms, function(name) {
        return "uniform float " + name + ";";
    }));
    // include required functions in glsl
    glslCode = glslCode.concat(_.chain(tables.glslUsedFuncs).map(function(name) {
        return ((name in glslFuncCode)?(glslFuncCode[name]):[]);
    }).flatten().value());

    // declarations for precomputed functions
    glslCode = glslCode.concat(_.chain(tables.preCompute).keys().map(function(name) {
        return "uniform float " + name + ";";
    }).value());

    // add the functions
    for(i = 0;i < glslFuncs.length;i++) {
        var name = glslFuncs[i];
        var ast = codeAst[name];
        if(ast) {
            var codeString = generateNode(ast);
            glslCode.push("void " + name + "() {");
            glslCode.push(codeString);
            glslCode.push("}");
        } else {
            glslCode.push("void " + name + "() {}");
        }
    }

    return glslCode.join("\n");
}

var funcArgLengths = {
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
};

var jsMathFuncs = ["min", "max", "sin", "cos", "abs", "tan", "asin", "acos", "atan", "log", "pow", "sqrt", "floor", "ceil"];

var glslPreComputeFuncs = ["getosc", "gettime"];

var glslFuncCode = {
    "rand": [
        "uniform vec2 __randStep;",
        "vec2 __randSeed;",
        "float rand(float max) {",
        "   __randSeed += __randStep;",
        "   float val = fract(sin(dot(__randSeed.xy ,vec2(12.9898,78.233))) * 43758.5453);",
        "   return (floor(val*max)+1);",
        "}"
    ].join("\n")
};

function checkFunc(ast) {
    var requiredArgLength = funcArgLengths[ast.funcName];
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
}

function translateConstants(value) {
    switch(value) {
        case "pi": return Math.PI;
        case "e": return Math.E;
        case "phi": return 1.6180339887;
        default: throw new Error("Unknown constant " + value);
    }
}

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that simply runs some avs expressions.
// Useful to maintain global state
function GlobalVar(gl, main, parent, opts) {
    GlobalVar.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(GlobalVar, {
    name: "GlobalVar",
    menu: "Misc"
});

Webvs.defineClass(GlobalVar, Webvs.Component, {
    defaultOptions: {
        code: {
            init: "",
            onBeat: "",
            perFrame: ""
        }
    },

    onChange: {
        "code": "updateCode"
    },

    init: function() {
        this.updateCode();
        this.listenTo(this.main, "resize", this.handleResize);
    },

    draw: function() {
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
    },

    updateCode: function() {
        this.code = Webvs.compileExpr(this.opts.code, ["init", "onBeat", "perFrame"]).codeInst;
        this.code.setup(this.main, this);
        this.inited = false;
    },

    handleResize: function() {
        this.code.updateDimVars(this.gl);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A components that saves or restores a copy of the current
// frame buffer.
function BufferSave(gl, main, parent, opts) {
    BufferSave.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(BufferSave, {
    name: "BufferSave",
    menu: "Misc"
});
    
var Actions = {
    "SAVE": 0,
    "RESTORE": 1,
    "SAVERESTORE": 2,
    "RESTORESAVE": 3
};
BufferSave.Actions = Actions;

Webvs.defineClass(BufferSave, Webvs.Component, {
    defaultOptions: {
        action: "SAVE",
        bufferId: "buffer1",
        blendMode: "REPLACE"
    },

    onChange: {
        "action": "updateAction",
        "bufferId": "updateBuffer",
        "blendMode": "updateBlendMode"
    },

    init: function() {
        this.updateAction();
        this.updateBlendMode();
        this.updateBuffer();
    },

    draw: function() {
        var currentAction;
        if(this.action == Actions.SAVERESTORE ||
           this.action == Actions.RESTORESAVE) {
            currentAction = this.nextAction;
            // toggle next action
            this.nextAction = (this.nextAction == Actions.SAVE)?Actions.RESTORE:Actions.SAVE;
        } else {
            currentAction = this.action;
        }

        var buffers = this.main.buffers;
        switch(currentAction) {
            case Actions.SAVE:
                buffers.setRenderTarget(this.opts.bufferId);
                this.main.copier.run(null, null, this.parent.fm.getCurrentTexture());
                buffers.restoreRenderTarget();
                break;
            case Actions.RESTORE:
                this.main.copier.run(this.parent.fm, this.blendMode, buffers.getTexture(this.opts.bufferId));
                break;
        }
    },

    destroy: function() {
        BufferSave.super.destroy.call(this);
        this.main.buffers.removeTexture(this.opts.bufferId);
    },
    
    updateAction: function() {
        this.action = Webvs.getEnumValue(this.opts.action, Actions);
        if(this.action == Actions.SAVERESTORE) {
            this.nextAction = Actions.SAVE;
        } else if(this.action == Actions.RESTORESAVE) {
            this.nextAction = Actions.RESTORE;
        }
    },

    updateBuffer: function(value, key, oldValue) {
        // buffer names in FrameBufferManager have to be string
        // converting to string to maintain backward compatibility
        this.opts.bufferId = this.opts.bufferId + "";
        if(oldValue) {
            this.main.buffers.removeTexture(oldValue);
        }
        this.main.buffers.addTexture(this.opts.bufferId);
    },

    updateBlendMode: function() {
        this.blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that slowly fades the screen to a specified color
function FadeOut(gl, main, parent, opts) {
    FadeOut.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(FadeOut, {
    name: "FadeOut",
    menu: "Trans"
});

Webvs.defineClass(FadeOut, Webvs.Component, {
    defaultOptions: {
        speed: 1,
        color: "#000000"
    },

    onChange: {
        speed: "updateSpeed",
        color: "updateColor"
    },

    init: function() {
        this.program = new Webvs.ClearScreenProgram(this.gl, Webvs.AVERAGE);
        this.updateSpeed();
        this.updateColor();
    },

    draw: function() {
        this.frameCount++;
        if(this.frameCount == this.maxFrameCount) {
            this.frameCount = 0;
            this.program.run(this.parent.fm, null, this.color);
        }
    },

    destroy: function() {
        FadeOut.super.destroy.call(this);
        this.program.destroy();
    },

    updateSpeed: function() {
        this.frameCount = 0;
        this.maxFrameCount = Math.floor(1/this.opts.speed);
    },

    updateColor: function() {
        this.color = Webvs.parseColorNorm(this.opts.color);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that applies a convolution kernel
function Convolution(gl, main, parent, opts) {
    Convolution.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(Convolution, {
    name: "Convolution",
    menu: "Trans"
});

var EdgeModes = {
    "EXTEND": 0,
    "WRAP": 1,
};
Convolution.EdgeModes = EdgeModes;

Webvs.defineClass(Convolution, Webvs.Component, {
    defaultOptions: {
        edgeMode: "EXTEND",
        autoScale: true,
        scale: 0,
        kernel: [
            0, 0, 0,
            0, 1, 0,
            0, 0, 0
        ],
        bias: 0
    },

    onChange: {
        "edgeMode": "updateProgram",
        "kernel": ["updateProgram", "updateScale"],
        "scale": "updateScale"
    },

    init: function() {
        this.updateProgram();
        this.updateScale();
    },

    draw: function() {
        this.program.run(this.parent.fm, null, this.scale, this.opts.bias);
    },

    destroy: function() {
        Convolution.super.destroy.call(this);
        this.program.destroy();
    },

    updateScale: function() {
        var opts = this.opts;
        if(opts.autoScale) {
            this.scale = _.reduce(opts.kernel, function(memo, num){ return memo + num; }, 0);
        } else {
            this.scale = opts.scale;
        }
    },

    updateProgram: function() {
        var opts = this.opts;
        if(!_.isArray(opts.kernel) || opts.kernel.length%2 !== 1) {
            throw new Error("Invalid convolution kernel");
        }
        var kernelSize = Math.floor(Math.sqrt(opts.kernel.length));
        if(kernelSize*kernelSize != opts.kernel.length) {
            throw new Error("Invalid convolution kernel");
        }

        if(this.program) {
            this.program.destroy();
        }
        var edgeMode = Webvs.getEnumValue(this.opts.edgeMode, EdgeModes);
        this.program = new Webvs.ConvolutionProgram(this.gl, opts.kernel, kernelSize, edgeMode);
    }
});

function ConvolutionProgram(gl, kernel, kernelSize, edgeMode) {
    // generate edge correction function
    var edgeFunc = "";
    switch(edgeMode) {
        case EdgeModes.WRAP:
            edgeFunc = "pos = vec2(pos.x<0?pos.x+1.0:pos.x%1, pos.y<0?pos.y+1.0:pos.y%1);";
            break;
        case EdgeModes.EXTEND:
            edgeFunc = "pos = clamp(pos, vec2(0,0), vec2(1,1));";
            break;
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
            colorSumEq.push("pos = v_position + texel * vec2("+(j-mid)+","+(mid-i)+");");
            colorSumEq.push(edgeFunc);
            colorSumEq.push("colorSum += texture2D(u_srcTexture, pos) * "+Webvs.glslFloatRepr(value)+";");
        }
    }

    ConvolutionProgram.super.constructor.call(this, gl, {
        swapFrame: true,
        fragmentShader: [
            "uniform float u_scale;",
            "uniform float u_bias;",
            "void main() {",
            "   vec2 texel = 1.0/(u_resolution-vec2(1,1));",
            "   vec2 pos;",
            "   vec4 colorSum = vec4(0,0,0,0);",
            colorSumEq.join("\n"),
            "   setFragColor(vec4(((colorSum+u_bias)/u_scale).rgb, 1.0));",
            "}"
        ]
    });
}
Webvs.ConvolutionProgram = Webvs.defineClass(ConvolutionProgram, Webvs.QuadBoxProgram, {
    draw: function(scale, bias) {
        this.setUniform("u_scale", "1f", scale);
        this.setUniform("u_bias", "1f", bias);
        ConvolutionProgram.super.draw.call(this);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// a component that changes colors according to a gradient map using
// a key generated from the source colors
function ColorMap(gl, main, parent, opts) {
    ColorMap.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(ColorMap, {
    name: "ColorMap",
    menu: "Trans"
});

var MapKey = {
    "RED": 0,
    "GREEN": 1,
    "BLUE": 2,
    "(R+G+B)/2": 3,
    "(R+G+B)/3": 4,
    "MAX": 5
};
ColorMap.MapKey = MapKey;

var MapCycleModes = {
    "SINGLE": 0,
    "ONBEATRANDOM": 1,
    "ONBEATSEQUENTIAL": 2
};
ColorMap.MapCycleModes = MapCycleModes;

Webvs.defineClass(ColorMap, Webvs.Component, {
    defaultOptions: {
        key: "RED",
        output: "REPLACE",
        mapCycleMode: "SINGLE",
        maps: [
            [
                {index: 0, color: "#000000"},
                {index: 255, color: "#FFFFFF"}
            ]
        ],
    },

    onChange: {
        "maps": "updateMap",
        "key": "updateProgram",
        "mapCycleMode": "updateCycleMode",
        "output": "updateProgram"
    },

    init: function() {
        this.updateProgram();
        this.updateMap();
        this.updateCycleMode();
    },

    draw: function() {
        if(this.main.analyser.beat) {
            if(this.mapCycleMode ==  MapCycleModes.ONBEATRANDOM) {
                this.currentMap = Math.floor(Math.random()*this.opts.maps.length);
            } else if(this.mapCycleMode == MapCycleModes.ONBEATSEQUENTIAL) {
                this.currentMap = (this.currentMap+1)%this.colorMaps.length;
            }
        }
        this.program.run(this.parent.fm, null, this.colorMaps[this.currentMap]);
    },

    destroy: function() {
        ColorMap.super.destroy.call(this);
        this.program.destroy();
        _.each(this.colorMaps, function(tex) {
            this.gl.deleteTexture(tex);
        }, this);
    },

    updateProgram: function() {
        if(this.program) {
            this.program.cleanup();
        }
        var output = Webvs.getEnumValue(this.opts.output, Webvs.BlendModes);
        var key = Webvs.getEnumValue(this.opts.key, MapKey);
        this.program = new Webvs.ColorMapProgram(this.gl, key, output);
    },

    updateMap: function() {
        if(this.colorMaps) {
            _.each(this.colorMaps, function(tex) {
                this.gl.deleteTexture(tex);
            }, this);
        }
        this.colorMaps = _.map(this.opts.maps, function(map) {
            return this._buildColorMap(map);
        }, this);
        this.currentMap = 0;
    },

    updateCycleMode: function() {
        this.mapCycleMode = Webvs.getEnumValue(this.opts.mapCycleMode, MapCycleModes);
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
                colorMap[cmi++] = Math.floor((first.color[0]*(steps-i) + second.color[0]*i)/steps);
                colorMap[cmi++] = Math.floor((first.color[1]*(steps-i) + second.color[1]*i)/steps);
                colorMap[cmi++] = Math.floor((first.color[2]*(steps-i) + second.color[2]*i)/steps);
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

function ColorMapProgram(gl, key, blendMode) {
    var keyEq = "";
    switch(key) {
        case MapKey.RED: keyEq = "srcColor.r"; break;
        case MapKey.GREEN: keyEq = "srcColor.g"; break;
        case MapKey.BLUE: keyEq = "srcColor.b"; break;
        case MapKey["(R+G+B)/2"]: keyEq = "min((srcColor.r+srcColor.g+srcColor.b)/2.0, 1.0)"; break;
        case MapKey["(R+G+B)/3"]: keyEq = "(srcColor.r+srcColor.g+srcColor.b)/3.0"; break;
        case MapKey.MAX: keyEq = "max(srcColor.r, max(srcColor.g, srcColor.b))"; break;
    }

    ColorMapProgram.super.constructor.call(this, gl, {
        blendMode: blendMode,
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

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that clips colors to a different color depending
// on whether the source colors are above or below a reference color.
function ColorClip(gl, main, parent, opts) {
    ColorClip.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(ColorClip, {
    name: "ColorClip",
    menu: "Trans"
});

var ClipModes = {
    "BELOW": 0,
    "ABOVE": 1,
    "NEAR": 2
};
ColorClip.ClipModes = ClipModes;

Webvs.defineClass(ColorClip, Webvs.Component,  {
    defaultOptions: {
        mode: "BELOW",
        color: "#202020",
        outColor: "#202020",
        level: 0
    },

    onChange: {
        mode: "updateMode",
        color: "updateColor",
        outColor: "updateColor"
    },

    init: function() {
        this.program = new ColorClipProgram(this.gl);
        this.updateColor();
        this.updateMode();
    },

    draw: function() {
        this.program.run(this.parent.fm, null, this.mode, this.color, this.outColor, this.opts.level);
    },

    destroy: function() {
        ColorClip.super.destroy.call(this);
        this.program.destroy();
    },

    updateMode: function() {
        this.mode = Webvs.getEnumValue(this.opts.mode, ClipModes);
    },

    updateColor: function() {
        this.color = Webvs.parseColorNorm(this.opts.color);
        this.outColor = Webvs.parseColorNorm(this.opts.outColor);
    }
});

function ColorClipProgram(gl) {
    ColorClipProgram.super.constructor.call(this, gl, {
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
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that moves pixels according to user code.
function DynamicMovement(gl, main, parent, opts) {
    DynamicMovement.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(DynamicMovement, {
    name: "DynamicMovement",
    menu: "Trans"
});

var CoordModes = {
    "POLAR": 0,
    "RECT": 1
};
DynamicMovement.CoordModes = CoordModes;

Webvs.defineClass(DynamicMovement, Webvs.Component, {
    defaultOptions: {
        code: {
            init: "",
            onBeat: "",
            perFrame: "",
            perPixel: ""
        },
        gridW: 16,
        gridH: 16,
        blend: false,
        noGrid: false,
        compat: false,
        bFilter: true,
        coord: "POLAR"
    },

    onChange: {
        "code": "updateCode",
        "noGrid": ["updateProgram", "updateGrid"],
        "compat": "updateProgram",
        "bFilter": "updateProgram",
        "coord": "updateProgram",
        "blend": "updateProgram",
        "gridW": "updateGrid",
        "gridH": "updateGrid"
    },
    
    init: function() {
        this.updateCode();
        this.updateGrid();
        this.listenTo(this.main, "resize", this.handleResize);
    },

    draw: function() {
        var code = this.code;

        // run init, if required
        if(!this.inited) {
            code.init();
            code.inited = true;
        }

        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        // run per frame
        code.perFrame();
        // run on beat
        if(beat) {
            code.onBeat();
        }

        this.program.run(this.parent.fm, null, this.code, this.gridVertices, this.gridVerticesSize);
    },

    destroy: function() {
        DynamicMovement.super.destroy.call(this);
        this.program.destroy();
    },

    updateCode: function() {
        var compileResult = Webvs.compileExpr(this.opts.code, ["init", "onBeat", "perFrame"], ["perPixel"], ["x", "y", "d", "r", "alpha"]);

        // js code
        var code = compileResult.codeInst;
        code.setup(this.main, this);
        this.inited = false;
        this.code = code;

        // glsl code
        this.glslCode = compileResult.glslCode;
        this.updateProgram();
    },

    updateProgram: function() {
        var opts = this.opts;
        var program;
        var coordMode = Webvs.getEnumValue(this.opts.coord, CoordModes);
        if(opts.noGrid) {
            program = new Webvs.DMovProgramNG(this.gl, coordMode, opts.bFilter,
                                              opts.compat, this.code.hasRandom,
                                              this.glslCode, opts.blend);
        } else {
            program = new Webvs.DMovProgram(this.gl, coordMode, opts.bFilter,
                                            opts.compat, this.code.hasRandom,
                                            this.glslCode, opts.blend);
        }
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    },

    updateGrid: function() {
        var opts = this.opts;
        if(opts.noGrid) {
            this.gridVertices = undefined;
            this.gridVerticesSize = undefined;
        } else {
            var gridW = Webvs.clamp(opts.gridW, 1, this.gl.drawingBufferWidth);
            var gridH = Webvs.clamp(opts.gridH, 1, this.gl.drawingBufferHeight);
            var nGridW = (gridW/this.gl.drawingBufferWidth)*2;
            var nGridH = (gridH/this.gl.drawingBufferHeight)*2;
            var gridCountAcross = Math.ceil(this.gl.drawingBufferWidth/gridW);
            var gridCountDown = Math.ceil(this.gl.drawingBufferHeight/gridH);
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

    handleResize: function() {
        this.code.updateDimVars(this.gl);
    }
});

var GlslHelpers = {
    glslRectToPolar: function(coordMode) {
        if(coordMode === CoordModes.POLAR) {
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
        if(coordMode === CoordModes.POLAR) {
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

function DMovProgramNG(gl, coordMode, bFilter, compat, randSeed, exprCode, blend) {
    var fragmentShader = [
        exprCode,
        this.glslFilter(bFilter, compat),
        "void main() {",
        (randSeed?"__randSeed = v_position;":""),
        "   x = v_position.x*2.0-1.0;",
        "   y = -(v_position.y*2.0-1.0);",
        this.glslRectToPolar(coordMode),
        "   alpha=0.5;",
        "   perPixel();",
        this.glslPolarToRect(coordMode),
        "   setFragColor(vec4(filter(vec2(x, -y)), "+(blend?"alpha":"1.0")+"));",
        "}"
    ];

    DMovProgramNG.super.constructor.call(this, gl, {
        fragmentShader: fragmentShader,
        blendMode: blend?Webvs.ALPHA:Webvs.REPLACE,
        swapFrame: true
    });
}
Webvs.DMovProgramNG = Webvs.defineClass(DMovProgramNG, Webvs.QuadBoxProgram, GlslHelpers, {
    draw: function(code) {
        code.bindUniforms(this);
        DMovProgramNG.super.draw.call(this);
    }
});

function DMovProgram(gl, coordMode, bFilter, compat, randSeed, exprCode, blend) {
    var vertexShader = [
        "attribute vec2 a_position;",
        "varying vec2 v_newPoint;",
        "varying float v_alpha;",
        "uniform int u_coordMode;",
        exprCode,
        "void main() {",
        (randSeed?"__randSeed = a_position;":""),
        "   x = a_position.x;",
        "   y = -a_position.y;",
        this.glslRectToPolar(coordMode),
        "   alpha = 0.5;",
        "   perPixel();",
        "   v_alpha = alpha;",
        this.glslPolarToRect(coordMode),
        "   v_newPoint = vec2(x,-y);",
        "   setPosition(a_position);",
        "}"
    ];

    var fragmentShader = [
        "varying vec2 v_newPoint;",
        "varying float v_alpha;",
        this.glslFilter(bFilter, compat),
        "void main() {",
        "   setFragColor(vec4(filter(v_newPoint), "+(blend?"v_alpha":"1.0")+"));",
        "}"
    ];

    DMovProgram.super.constructor.call(this, gl, {
        blendMode: blend?Webvs.ALPHA:Webvs.REPLACE,
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

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that swizzles the color component
function ChannelShift(gl, main, parent, opts) {
    ChannelShift.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(ChannelShift, {
    name: "ChannelShift",
    menu: "Trans"
});

var Channels = {
    "RGB": 0,
    "RBG": 1,
    "BRG": 2,
    "BGR": 3,
    "GBR": 4,
    "GRB": 5
};
ChannelShift.Channels = Channels;

Webvs.defineClass(ChannelShift, Webvs.Component, {
    defaultOptions: {
        channel: "RGB",
        onBeatRandom: false
    },

    onChange: {
        channel: "updateChannel"
    },

    init: function() {
        this.program = new ChannelShiftProgram(this.gl);
        this.updateChannel();
    },

    draw: function() {
        if(this.opts.onBeatRandom && this.main.analyser.beat) {
            this.channel = Math.floor(Math.random() * ChannelShift.channels.length);
        }
        this.program.run(this.parent.fm, null, this.channel);
    },

    destroy: function() {
        ChannelShift.super.destroy.call(this);
        this.program.destroy();
    },

    updateChannel: function() {
        this.channel = Webvs.getEnumValue(this.opts.channel, Channels);
    }
});

function ChannelShiftProgram(gl) {
    ChannelShiftProgram.super.constructor.call(this, gl, {
        swapFrame: true,
        fragmentShader: [
            "uniform int u_channel;",
            "void main() {",
            "   vec3 color = getSrcColor().rgb;",

            _.flatMap(_.keys(Channels), function(channel) {
                return [
                    "if(u_channel == "+Channels[channel]+") {",
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

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A Component that applies a unique color tone
function UniqueTone(gl, main, parent, opts) {
    UniqueTone.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(UniqueTone, {
    name: "UniqueTone",
    menu: "Trans"
});

Webvs.defineClass(UniqueTone, Webvs.Component, {
    defaultOptions: {
        color: "#ffffff",
        invert: false,
        blendMode: "REPLACE"
    },

    onChange: {
        color: "updateColor",
        blendMode: "updateProgram"
    },

    init: function() {
        this.updateColor();
        this.updateProgram();
    },

    draw: function() {
        this.program.run(this.parent.fm, null, this.tone, this.opts.invert);
    },

    destroy: function() {
        UniqueTone.super.destroy.call(this);
        this.program.destroy();
    },

    updateColor: function() {
        this.tone = Webvs.parseColorNorm(this.opts.color);
    },

    updateProgram: function() {
        var blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
        var program = new UniqueToneProgram(this.gl, blendMode);
        if(this.program) {
            this.program.cleanup();
        }
        this.program = program;
    }
});

function UniqueToneProgram(gl, blendMode) {
    UniqueToneProgram.super.constructor.call(this, gl, {
        blendMode: blendMode,
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
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function Invert(gl, main, parent, opts) {
    Invert.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(Invert, {
    name: "Invert",
    menu: "Trans"
});

Webvs.defineClass(Invert, Webvs.Component, {
    defaultOptions: {},
    init: function() {
        this.program = new InvertProgram(this.gl);
    },

    draw: function() {
        this.program.run(this.parent.fm, null);
    },

    destroy: function() {
        Invert.super.destroy.call(this);
        this.program.destroy();
    }
});

function InvertProgram(gl) {
    InvertProgram.super.constructor.call(this, gl, {
        swapFrame: true,
        fragmentShader: [
            "void main() {",
            "   setFragColor(vec4(1,1,1,1)-getSrcColor());",
            "}"
        ]
    });
}
Webvs.InvertProgram = Webvs.defineClass(InvertProgram, Webvs.QuadBoxProgram);

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function Mosaic(gl, main, parent, opts) {
    Mosaic.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(Mosaic, {
    name: "Mosaic",
    menu: "Trans"
});

Webvs.defineClass(Mosaic, Webvs.Component, {
    defaultOptions: {
        blendMode: "REPLACE",
        squareSize: 0.5,
        onBeatSizeChange: false,
        onBeatSquareSize: 1,
        onBeatSizeDuration: 10
    },

    onChange: {
        blendMode: "updateProgram"
    },

    init: function() {
        this.frameCount = 0;
        this.size = this.opts.squareSize;
        this.updateProgram();
    },

    draw: function() {
        if(this.opts.onBeatSizeChange && this.main.analyser.beat) {
            this.size = this.opts.onBeatSquareSize;
            this.frameCount = this.opts.onBeatSizeDuration;
        }

        if(this.size !== 0) {
            var sizeX = 1/Math.floor(this.size*(this.gl.drawingBufferWidth-1)+1);
            var sizeY = 1/Math.floor(this.size*(this.gl.drawingBufferHeight-1)+1);
            this.program.run(this.parent.fm, null, sizeX, sizeY);
        }

        if(this.frameCount > 0) {
            this.frameCount--;
            if(this.frameCount === 0) {
                this.size = this.opts.squareSize;
            } else {
                var incr = Math.abs(this.opts.squareSize-this.opts.onBeatSquareSize)/
                           this.opts.onBeatSizeDuration;
                this.size += incr * (this.opts.onBeatSquareSize>this.opts.squareSize?-1:1);
            }
        }
    },

    destroy: function() {
        Mosaic.super.destroy.call(this);
        this.program.destroy();
    },

    updateProgram: function() {
        var blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
        var program = new Webvs.MosaicProgram(this.gl, blendMode);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    }
});

function MosaicProgram(gl, blendMode) {
    MosaicProgram.super.constructor.call(this, gl, {
        swapFrame: true,
        blendMode: blendMode,
        fragmentShader: [
            "uniform vec2 u_size;",
            "void main() {",
            "    vec2 samplePos = u_size * ( floor(v_position/u_size) + vec2(0.5,0.5) );",
            "    setFragColor(getSrcColorAtPos(samplePos));",
            "}"
        ]
    });
}
Webvs.MosaicProgram = Webvs.defineClass(MosaicProgram, Webvs.QuadBoxProgram, {
    draw: function(sizeX, sizeY) {
        this.setUniform("u_size", "2f", sizeX, sizeY);
        MosaicProgram.super.draw.call(this);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that mirror between quandrants
function Mirror(gl, main, parent, opts) {
    Mirror.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(Mirror, {
    name: "Mirror",
    menu: "Trans"
});

Webvs.defineClass(Mirror, Webvs.Component, {
    defaultOptions: {
        onBeatRandom: false,
        topToBottom: true,
        bottomToTop: false,
        leftToRight: false,
        rightToLeft: false,
        smoothTransition: false,
        transitionDuration: 4
    },
    
    onChange: {
        topToBottom: "updateMap",
        bottomToTop: "updateMap",
        leftToRight: "updateMap",
        rightToLeft: "updateMap"
    },

    init: function() {
        this.program = new MirrorProgram(this.gl);
        this.animFrameCount = 0;
        this.mix = [
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [2, 0, 0, 0],
            [3, 0, 0, 0]
        ];
        this.mixDelta = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];
        this.updateMap();
    },
    
    draw: function() {
        if(this.opts.onBeatRandom && this.main.analyser.beat) {
            this._setQuadrantMap(true);
        }

        this.program.run(this.parent.fm, null, this._inTransition(), this.mix);

        if(this._inTransition()) {
            this.animFrameCount--;
            if(this.animFrameCount === 0) {
                this._setMix(true);
            } else {
                for(var i = 0;i < 4;i++) {
                    for(var j = 0;j < 4;j++) {
                        this.mix[i][j] += this.mixDelta[i][j];
                    }
                }
            }
        }
    },
    
    updateMap: function(random) {
        this._setQuadrantMap(false);
    },

    _inTransition: function() {
        return (this.opts.smoothTransition && this.animFrameCount !== 0);
    },

    _setQuadrantMap: function(random) {
        var map = [0, 1, 2, 3];
        var mirrorOpts = this.opts;
        if(random) {
            var randVal = Math.floor(Math.random()*16);
            mirrorOpts = {
                topToBottom: (randVal & 1) && this.opts.topToBottom,
                bottomToTop: (randVal & 2) && this.opts.bottomToTop,
                leftToRight: (randVal & 4) && this.opts.leftToRight,
                rightToLeft: (randVal & 8) && this.opts.rightToLeft
            };
        }
        if(mirrorOpts.topToBottom) {
            map[2] = map[0]; map[3] = map[1];
        }
        if(mirrorOpts.bottomToTop) {
            map[0] = map[2]; map[1] = map[3];
        }
        if(mirrorOpts.leftToRight) {
            map[1] = map[0]; map[3] = map[2];
        }
        if(mirrorOpts.rightToLeft) {
            map[0] = map[1]; map[2] = map[3];
        }
        this.map = map;

        this._setMix(false);
    },

    _setMix: function(noTransition) {
        var i, j;
        if(this.opts.smoothTransition && !noTransition) {
            // set mix vectors to second format if we are not already
            // in the middle of a transition
            if(this.animFrameCount === 0) {
                for(i = 0;i < 4;i++) {
                    var quad = this.mix[i][0];
                    this.mix[i][0] = 0;
                    this.mix[i][quad] = 1;
                }
            }

            // calculate the mix delta values
            for(i = 0;i < 4;i++) {
                for(j = 0;j < 4;j++) {
                    var endValue = (j  == this.map[i])?1:0;
                    this.mixDelta[i][j] = (endValue - this.mix[i][j])/this.opts.transitionDuration;
                }
            }

            this.animFrameCount = this.opts.transitionDuration;
        } else {
            // set mix value to first format
            for(i = 0;i < 4;i++) {
                this.mix[i][0] = this.map[i];
                for(j = 1;j < 4;j++) {
                    this.mix[i][j] = 0;
                }
            }
        }
    }
});

// Working:
// The program accepts a mode and 4 mix vectors, one for each of the 4 quadrants.
// The mode decides between two scenarios Case 1. a simple
// mapping ie. one quadrant is copied over to another.
// In this case the first value of each vec4 will contain the
// id of the quadrant from where the pixels will be copied
// Case 2. This is used during transition animation. Here, the
// final color of pixels in each quadrant is a weighted mix
// of colors of corresponding mirrored points in all quadrants.
// Each of the vec4 contains a mix weight for each 4 quadrants. As
// the animation proceeds, one of the 4 in the vec4 becomes 1 while others
// become 0. This two mode allows to make fewer texture sampling when
// not doing transition animation.
//
// The quadrant ids are as follows
//       |
//    0  |  1
//  -----------
//    2  |  3
//       |
function MirrorProgram(gl) {
    MirrorProgram.super.constructor.call(this, gl, {
        swapFrame: true,
        fragmentShader: [
            "uniform int u_mode;",
            "uniform vec4 u_mix0;",
            "uniform vec4 u_mix1;",
            "uniform vec4 u_mix2;",
            "uniform vec4 u_mix3;",

            "#define getQuadrant(pos) ( (pos.x<0.5) ? (pos.y<0.5?2:0) : (pos.y<0.5?3:1) )",
            "#define check(a,b, c,d,e,f) ( ((a==c || a==d) && (b==e || b==f)) || ((a==e || a==f) && (b==c || b==d)) )",
            "#define xFlip(qa, qb) (check(qa,qb, 0,2, 1,3)?-1:1)",
            "#define yFlip(qa, qb) (check(qa,qb, 0,1, 2,3)?-1:1)",
            "#define mirrorPos(pos,qa,qb) ((pos-vec2(0.5,0.5))*vec2(xFlip(qa,qb),yFlip(qa,qb))+vec2(0.5,0.5))",
            "#define getMirrorColor(pos,qa,qb) (getSrcColorAtPos(mirrorPos(pos,qa,qb)))",

            "void main() {",
            "    int quadrant = getQuadrant(v_position);",
            "    vec4 mix;",
            "    if(quadrant == 0)      { mix = u_mix0; }",
            "    else if(quadrant == 1) { mix = u_mix1; }",
            "    else if(quadrant == 2) { mix = u_mix2; }",
            "    else if(quadrant == 3) { mix = u_mix3; }",
            "    if(u_mode == 0) {",
            "        int otherQuadrant = int(mix.x);",
            "        setFragColor(getMirrorColor(v_position, quadrant, otherQuadrant));",
            "    } else {",
            "        vec4 c0 = getMirrorColor(v_position, quadrant, 0);",
            "        vec4 c1 = getMirrorColor(v_position, quadrant, 1);",
            "        vec4 c2 = getMirrorColor(v_position, quadrant, 2);",
            "        vec4 c3 = getMirrorColor(v_position, quadrant, 3);",

            "        setFragColor(vec4(",
            "            dot(vec4(c0.r,c1.r,c2.r,c3.r), mix),",
            "            dot(vec4(c0.g,c1.g,c2.g,c3.g), mix),",
            "            dot(vec4(c0.b,c1.b,c2.b,c3.b), mix),",
            "            1.0",
            "        ));",
            "    }",
            "}"
        ]
    });
}
Webvs.MirrorProgram = Webvs.defineClass(MirrorProgram, Webvs.QuadBoxProgram, {
    draw: function(transition, mix) {
        this.setUniform("u_mode", "1i", transition?1:0);
        for(var i = 0;i < 4;i++) {
            this.setUniform.apply(this, ["u_mix"+i, "4f"].concat(mix[i]));
        }
        MirrorProgram.super.draw.call(this);
    }
});

    
})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A generic scope, that can draw points or lines based on user code
function SuperScope(gl, main, parent, opts) {
    SuperScope.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(SuperScope, {
    name: "SuperScope",
    menu: "Render"
});

var DrawModes = {
    "LINES": 1,
    "DOTS": 2
};
SuperScope.DrawModes = DrawModes;

Webvs.defineClass(SuperScope, Webvs.Component, {
    defaultOptions: {
        code: {
            init: "n=800",
            perFrame: "t=t-0.05",
            onBeat: "",
            perPoint: "d=i+v*0.2; r=t+i*$PI*4; x=cos(r)*d; y=sin(r)*d"
        },
        blendMode: "REPLACE",
        channel: "CENTER",
        source: "SPECTRUM",
        drawMode: "LINES",
        thickness: 1,
        clone: 1,
        colors: ["#ffffff"],
        cycleSpeed: 0.01
    },

    onChange: {
        code: ["updateCode", "updateClones"],
        colors: "updateColors",
        cycleSpeed: "updateSpeed",
        clone: "updateClones",
        channel: "updateChannel",
        thickness: "updateThickness",
        blendMode: "updateProgram",
        drawMode: "updateDrawMode",
        source: "updateSource",
    },

    init: function() {
        this.updateDrawMode();
        this.updateSource();
        this.updateProgram();
        this.updateCode();
        this.updateClones();
        this.updateSpeed();
        this.updateColors();
        this.updateChannel();
        this.updateThickness();
        this.listenTo(this.main, "resize", this.handleResize);
    },

    draw: function() {
        var color = this._makeColor();
        _.each(this.code, function(code) {
            this.drawScope(code, color, !this.inited);
        }, this);
        this.inited = true;
    },

    destroy: function() {
        SuperScope.super.destroy.call(this);
        this.program.destroy();
    },

    /**
     * renders the scope
     * @memberof Webvs.SuperScope#
     */
    drawScope: function(code, color, runInit) {
        var gl = this.gl;

        code.red = color[0];
        code.green = color[1];
        code.blue = color[2];

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
        var data;
        if(this.source == Webvs.Source.SPECTRUM) {
            data = this.main.analyser.getSpectrum(this.channel);
        } else {
            data = this.main.analyser.getWaveform(this.channel);
        }
        var dots = this.drawMode == DrawModes.DOTS;
        var bucketSize = data.length/nPoints;
        var pbi = 0;
        var cdi = 0;

        var bufferSize, thickX, thickY;
        var lastX, lastY, lastR, lastG, lastB;
        if(this.veryThick) {
            bufferSize = (dots?(nPoints*6):(nPoints*6-6));
            thickX = this.opts.thickness/this.gl.drawingBufferWidth;
            thickY = this.opts.thickness/this.gl.drawingBufferHeight;
        } else {
            bufferSize = (dots?nPoints:(nPoints*2-2));
        }

        var pointBufferData = new Float32Array(bufferSize * 2);
        var colorData = new Float32Array(bufferSize * 3);
        for(var i = 0;i < nPoints;i++) {
            var value = 0;
            var size = 0;
            var j;
            for(j = Math.floor(i*bucketSize);j < (i+1)*bucketSize;j++,size++) {
                value += data[j];
            }
            value = value/size;

            var pos = i/((nPoints > 1)?(nPoints-1):1);
            code.i = pos;
            code.v = value;
            code.perPoint();
            code.y *= -1;
            if(this.veryThick) {
                if(dots) {
                    // just a box at current point
                    pointBufferData[pbi++] = code.x-thickX;
                    pointBufferData[pbi++] = code.y-thickY;

                    pointBufferData[pbi++] = code.x+thickX;
                    pointBufferData[pbi++] = code.y-thickY;

                    pointBufferData[pbi++] = code.x-thickX;
                    pointBufferData[pbi++] = code.y+thickY;

                    pointBufferData[pbi++] = code.x+thickX;
                    pointBufferData[pbi++] = code.y-thickY;

                    pointBufferData[pbi++] = code.x-thickX;
                    pointBufferData[pbi++] = code.y+thickY;

                    pointBufferData[pbi++] = code.x+thickX;
                    pointBufferData[pbi++] = code.y+thickY;

                    for(j = 0;j < 6;j++) {
                        colorData[cdi++] = code.red;
                        colorData[cdi++] = code.green;
                        colorData[cdi++] = code.blue;
                    }
                } else {
                    if(i !== 0) {
                        var xdiff = Math.abs(lastX-code.x);
                        var ydiff = Math.abs(lastY-code.y);
                        var xoff = (xdiff <= ydiff)?thickX:0;
                        var yoff = (xdiff >  ydiff)?thickY:0;

                        // a rectangle from last point to the current point
                        pointBufferData[pbi++] = lastX+xoff;
                        pointBufferData[pbi++] = lastY+yoff;

                        pointBufferData[pbi++] = code.x+xoff;
                        pointBufferData[pbi++] = code.y+yoff;

                        pointBufferData[pbi++] = lastX-xoff;
                        pointBufferData[pbi++] = lastY-yoff;

                        pointBufferData[pbi++] = code.x+xoff;
                        pointBufferData[pbi++] = code.y+yoff;

                        pointBufferData[pbi++] = lastX-xoff;
                        pointBufferData[pbi++] = lastY-yoff;

                        pointBufferData[pbi++] = code.x-xoff;
                        pointBufferData[pbi++] = code.y-yoff;

                        for(j = 0;j < 6;j++) {
                            colorData[cdi++] = code.red;
                            colorData[cdi++] = code.green;
                            colorData[cdi++] = code.blue;
                        }
                    }
                    lastX = code.x;
                    lastY = code.y;
                    lastR = code.red;
                    lastG = code.green;
                    lastB = code.blue;
                }
            } else {
                if(dots) {
                    // just a point at the current point
                    pointBufferData[pbi++] = code.x;
                    pointBufferData[pbi++] = code.y;

                    colorData[cdi++] = code.red;
                    colorData[cdi++] = code.green;
                    colorData[cdi++] = code.blue;
                } else {
                    if(i !== 0) {
                        // lines from last point to current point
                        pointBufferData[pbi++] = lastX;
                        pointBufferData[pbi++] = lastY;

                        pointBufferData[pbi++] = code.x;
                        pointBufferData[pbi++] = code.y;

                        for(j = 0;j < 2;j++) {
                            // use current color for both points because
                            // we dont want color interpolation between points
                            colorData[cdi++] = code.red;
                            colorData[cdi++] = code.green;
                            colorData[cdi++] = code.blue;
                        }
                    }
                    lastX = code.x;
                    lastY = code.y;
                    lastR = code.red;
                    lastG = code.green;
                    lastB = code.blue;
                }
            }
        }

        this.program.run(this.parent.fm, null, pointBufferData, colorData, dots, this.veryThick?1:this.opts.thickness, this.veryThick);
    },

    updateProgram: function() {
        var blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
        var program = new SuperScopeShader(this.gl, blendMode);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    },

    updateCode: function() {
        var code = Webvs.compileExpr(this.opts.code, ["init", "onBeat", "perFrame", "perPoint"]).codeInst;
        code.n = 100;
        code.setup(this.main, this);
        this.inited = false;
        this.code = [code];
    },

    updateClones: function() {
        this.code = Webvs.CodeInstance.clone(this.code, this.opts.clone);
    },

    updateColors: function() {
        this.colors = _.map(this.opts.colors, Webvs.parseColorNorm);
        this.curColorId = 0;
    },

    updateSpeed: function() {
        var oldMaxStep = this.maxStep;
        this.maxStep = Math.floor(1/this.opts.cycleSpeed);
        if(this.curStep) {
            // curStep adjustment when speed changes
            this.curStep = Math.floor((this.curStep/oldMaxStep)*this.maxStep);
        } else {
            this.curStep = 0;
        }
    },

    updateChannel: function() {
        this.channel = Webvs.getEnumValue(this.opts.channel, Webvs.Channels);
    },

    updateSource: function() {
        this.source = Webvs.getEnumValue(this.opts.source, Webvs.Source);
    },

    updateDrawMode: function() {
        this.drawMode = Webvs.getEnumValue(this.opts.drawMode, DrawModes);
    },

    updateThickness: function() {
        var range;
        if(this.drawMode == DrawModes.DOTS) {
            range = this.gl.getParameter(this.gl.ALIASED_POINT_SIZE_RANGE);
        } else {
            range = this.gl.getParameter(this.gl.ALIASED_LINE_WIDTH_RANGE);
        }
        if(this.opts.thickness < range[0] || this.opts.thickness > range[1]) {
            this.veryThick = true;
        } else {
            this.veryThick = false;
        }
    },

    _makeColor: function() {
        if(this.colors.length == 1) {
            return this.colors[0];
        } else {
            var color = [];
            var currentColor = this.colors[this.curColorId];
            var nextColor = this.colors[(this.curColorId+1)%this.colors.length];
            var mix = this.curStep/this.maxStep;
            for(var i = 0;i < 3;i++) {
                color[i] = currentColor[i]*(1-mix) + nextColor[i]*mix;
            }
            this.curStep = (this.curStep+1)%this.maxStep;
            if(this.curStep === 0) {
                this.curColorId = (this.curColorId+1)%this.colors.length;
            }
            return color;
        }
    },

    handleResize: function() {
        _.each(this.code, function(code) {
            code.updateDimVars(this.gl);
        }, this);
    }
});

function SuperScopeShader(gl, blendMode) {
    SuperScopeShader.super.constructor.call(this, gl, {
        copyOnSwap: true,
        blendMode: blendMode,
        vertexShader: [
            "attribute vec2 a_position;",
            "attribute vec3 a_color;",
            "varying vec3 v_color;",
            "uniform float u_pointSize;",
            "void main() {",
            "   gl_PointSize = u_pointSize;",
            "   setPosition(a_position);",
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
    draw: function(points, colors, dots, thickness, triangles) {
        var gl = this.gl;

        this.setUniform("u_pointSize", "1f", thickness);
        this.setVertexAttribArray("a_position", points, 2, gl.FLOAT, false, 0, 0);
        this.setVertexAttribArray("a_color", colors, 3, gl.FLOAT, false, 0, 0);

        var prevLineWidth;
        if(!dots) {
            prevLineWidth = gl.getParameter(gl.LINE_WIDTH);
            gl.lineWidth(thickness);
        }

        var mode;
        if(triangles) {
            mode = gl.TRIANGLES;
        } else if(dots) {
            mode = gl.POINTS;
        } else {
            mode = gl.LINES;
        }
        gl.drawArrays(mode, 0, points.length/2);

        if(!dots) {
            gl.lineWidth(prevLineWidth);
        }
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A SuperScope like component that places images at points.
function Texer(gl, main, parent, opts) {
    Texer.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(Texer, {
    name: "Texer",
    menu: "Render"
});

Webvs.defineClass(Texer, Webvs.Component, {
    defaultOptions: {
        code: {
            init: "",
            onBeat: "",
            perFrame: "",
            perPoint: ""
        },
        imageSrc: "avsres_texer_circle_edgeonly_19x19.bmp",
        source: "SPECTRUM",
        resizing: false,
        wrapAround: false,
        clone: 1,
        colorFiltering: true
    },

    onChange: {
        code: "updateCode",
        clone: "updateClone",
        imageSrc: "updateImage",
        source: "updateSource"
    },

    init: function() {
        this.program = new TexerProgram(this.gl);
        this.updateCode();
        this.updateClone();
        this.updateImage();
        this.updateSource();
        this.listenTo(this.main, "resize", this.handleResize);
    },

    draw: function() {
        _.each(this.code, function(code) {
            this._drawScope(code, !this.inited);
        }, this);
        this.inited = true;
    },

    destroy: function() {
        Texer.super.destroy.call(this);
        this.program.destroy();
        this.gl.deleteTexture(this.texture);
    },

    updateCode: function() {
        var code = Webvs.compileExpr(this.opts.code, ["init", "onBeat", "perFrame", "perPoint"]).codeInst;
        code.n = 100;
        code.setup(this.main, this);
        this.inited = false;
        this.code = [code];
    },

    updateClone: function() {
        this.code = Webvs.CodeInstance.clone(this.code, this.opts.clone);
    },

    updateImage: function() {
        var gl = this.gl;
        this.main.rsrcMan.getImage(
            this.opts.imageSrc,
            function(image) {
                this.imagewidth = image.width;
                this.imageHeight = image.height;
                if(!this.texture) {
                    this.texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                }
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            },
            null,
            this
        );
    },

    updateSource: function() {
        this.source = Webvs.getEnumValue(this.opts.source, Webvs.Source);
    },

    _drawScope: function(code, runInit) {
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
        var data;
        if(this.source == Webvs.Source.SPECTRUM) {
            data = this.main.analyser.getSpectrum();
        } else {
            data = this.main.analyser.getWaveform();
        }
        var bucketSize = data.length/nPoints;

        var vertexData = [];
        var texVertexData = [];
        var vertexIndices = [];
        var colorData = this.opts.colorFiltering?[]:null;
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

        var imageSizex = (this.imagewidth/this.gl.drawingBufferWidth)*2;
        var imageSizey = (this.imageHeight/this.gl.drawingBufferHeight)*2;

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
            if(this.opts.resizing) {
                sizex *= code.sizex;
                sizey *= code.sizey;
            }
            var cornx = code.x-sizex/2;
            var corny = (-code.y)-sizey/2;
            
            addRect(cornx, corny, sizex, sizey, code.red, code.green, code.blue);
            if(this.opts.wrapAround) {
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

    handleResize: function() {
        this.code.updateDimVars(this.gl);
    }
});

function TexerProgram(gl) {
    TexerProgram.super.constructor.call(this, gl, {
        copyOnSwap: true,
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
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A particle that moves around depending on beat changes
function MovingParticle(gl, main, parent, opts) {
    MovingParticle.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(MovingParticle, {
    name: "MovingParticle",
    menu: "Render"
});

Webvs.defineClass(MovingParticle, Webvs.Component, {
    defaultOptions: {
        color: "#FFFFFF",
        distance: 0.7,
        particleSize: 10,
        onBeatSizeChange: false,
        onBeatParticleSize: 10,
        blendMode: "REPLACE"
    },

    onChange: {
        color: "updateColor",
        blendMode: "updateProgram"
    },

    init: function() {
        this.centerX = 0;
        this.centerY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.posX = 0;
        this.posY = 0;

        this._computeGeometry();
        this.updateProgram();
        this.updateColor();
    },

    _computeGeometry: function() {
        if(Webvs.MovingParticle.circleGeometry) {
            return;
        }
        var pointCount = 100;
        var points = new Float32Array((pointCount+2)*2);
        var pbi = 0;
        points[pbi++] = 0; // center
        points[pbi++] = 0;
        for(var i = 0;i < pointCount;i++) {
            points[pbi++] = Math.sin(i*2*Math.PI/pointCount);
            points[pbi++] = Math.cos(i*2*Math.PI/pointCount);
        }
        points[pbi++] = points[2]; // repeat last point again
        points[pbi++] = points[3];
        Webvs.MovingParticle.circleGeometry = points;
    },

    draw: function() {
        if(this.main.analyser.beat) {
            this.centerX = (Math.random()*2-1)*0.3;
            this.centerY = (Math.random()*2-1)*0.3;
        }

        this.velocityX -= 0.004*(this.posX-this.centerX);
        this.velocityY -= 0.004*(this.posY-this.centerY);

        this.posX += this.velocityX;
        this.posY += this.velocityY;

        this.velocityX *= 0.991;
        this.velocityY *= 0.991;
        
        var x = this.posX*this.opts.distance;
        var y = this.posY*this.opts.distance;

        var scaleX, scaleY;
        if(this.opts.onBeatSizeChange && this.main.analyser.beat) {
            scaleX = this.opts.onBeatParticleSize;
            scaleY = this.opts.onBeatParticleSize;
        } else {
            scaleX = this.opts.particleSize;
            scaleY = this.opts.particleSize;
        }
        scaleX = 2*scaleX/this.gl.drawingBufferWidth;
        scaleY = 2*scaleY/this.gl.drawingBufferHeight;

        this.program.run(this.parent.fm, null, Webvs.MovingParticle.circleGeometry,
                         scaleX, scaleY, x, y, this.color);
    },

    updateProgram: function() {
        var blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
        var program = new MovingParticleShader(this.gl, blendMode);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    },

    updateColor: function() {
        this.color = Webvs.parseColorNorm(this.opts.color);
    },

    destroy: function() {
        MovingParticle.super.destroy.call(this);
        this.program.destroy();
    }
});

function MovingParticleShader(gl, blendMode) {
    MovingParticleShader.super.constructor.call(this, gl, {
        copyOnSwap: true,
        blendMode: blendMode,
        vertexShader: [
            "attribute vec2 a_point;",
            "uniform vec2 u_position;",
            "uniform vec2 u_scale;",
            "void main() {",
            "   setPosition((a_point*u_scale)+u_position);",
            "}"
        ],
        fragmentShader: [
            "uniform vec3 u_color;",
            "void main() {",
            "   setFragColor(vec4(u_color, 1));",
            "}"
        ]
    });
}
Webvs.MovingParticleShader = Webvs.defineClass(MovingParticleShader, Webvs.ShaderProgram, {
    draw: function(points, scaleX, scaleY, x, y, color) {
        this.setUniform("u_scale", "2f", scaleX, scaleY);
        this.setUniform("u_position", "2f", x, y);
        this.setUniform.apply(this, ["u_color", "3f"].concat(color));
        this.setVertexAttribArray("a_point", points);
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, points.length/2);
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that clears the screen
function ClearScreen(gl, main, parent, opts) {
    ClearScreen.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(ClearScreen, {
    name: "ClearScreen",
    menu: "Render"
});

Webvs.defineClass(ClearScreen, Webvs.Component, {
    defaultOptions: {
        beatCount: 0,
        color: "#000000",
        blendMode: "REPLACE"
    },

    onChange: {
        color: "updateColor",
        blendMode: "updateProgram"
    },

    init: function() {
        this.prevBeat = false;
        this.beatCount = 0;

        this.updateColor();
        this.updateProgram();
    },

    draw: function() {
        var clear = false;
        if(this.opts.beatCount === 0) {
            clear = true;
        } else {
            if(this.main.analyser.beat && !this.prevBeat) {
                this.beatCount++;
                if(this.beatCount >= this.opts.beatCount) {
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

    destroy: function() {
        ClearScreen.super.destroy.call(this);
        this.program.destroy();
    },

    updateColor: function() {
        this.color = Webvs.parseColorNorm(this.opts.color);
    },

    updateProgram: function() {
        var blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
        var program = new Webvs.ClearScreenProgram(this.gl, blendMode);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    }
});

})(Webvs);

/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A component that renders an image onto the screen
function Picture(gl, main, parent, opts) {
    Picture.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(Picture, {
    name: "Picture",
    menu: "Render"
});

Webvs.defineClass(Picture, Webvs.Component, {
    defaultOptions: {
        src: "avsres_texer_circle_edgeonly_19x19.bmp",
        x: 0,
        y: 0
    },

    onChange: {
        src: "updateImage"
    },

    init: function() {
        this.program = new Webvs.PictureProgram(this.gl);
        this.updateImage();
    },

    draw: function() {
        this.program.run(this.parent.fm, null, 
                         this.opts.x, this.opts.y,
                         this.texture, this.width, this.height);
    },

    destroy: function() {
        Picture.super.destroy.call(this);
        this.program.destroy();
        this.gl.deleteTexture(this.texture);
    },

    updateImage: function() {
        var gl = this.gl;
        this.main.rsrcMan.getImage(
            this.opts.src, 
            function(image) {
                this.width = image.width;
                this.height = image.height;
                if(!this.texture) {
                    this.texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                }
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            },
            null,
            this
        );
    }
});

function PictureProgram(gl) {
    PictureProgram.super.constructor.call(this, gl, {
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
