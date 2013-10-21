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
     * @memberof Webvs.Promise
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
     * @memberof Webvs.Promise
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
    SUBTRACTIVE2: 6
};
_.extend(Webvs, Webvs.blendModes);

})(window);

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
     * @memberof Webvs.AnalyserAdapter
     */
    beat: false,

    /**
     * returns whether song is being played or not.
     * @abstract
     * @returns {boolean}
     * @memberof Webvs.AnalyserAdapter
     */
    isPlaying: function() {return false;},

    /**
     * Returns array of waveform values
     * @abstract
     * @returns {Float32Array}
     * @memberof Webvs.AnalyserAdapter
     */
    getWaveForm: function() {return new Float32Array(0);},

    /**
     * Returns array of spectrum values
     * @abstract
     * @returns {Float32Array}
     * @memberof Webvs.AnalyserAdapter
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
     * @memberof Webvs.DancerAdapter
     */
    isPlaying: function() {
        return this.dancer.isPlaying();
    },

    /**
     * returns array of waveform values
     * @returns {Float32Array}
     * @memberof Webvs.DancerAdapter
     */
    getWaveform: function() {
        return this.dancer.getWaveform();
    },

    /**
     * Returns array of spectrum values
     * @returns {Float32Array}
     * @memberof Webvs.DancerAdapter
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
    if(options.showStat) {
        var stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.right = '5px';
        stats.domElement.style.bottom = '5px';
        document.body.appendChild(stats.domElement);
        this.stats = stats;
    }
    this._initGl();
}
Webvs.Main = Webvs.defineClass(Main, Object, {
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
     * @memberof Webvs.Main
     */
    loadPreset: function(preset) {
        var newRoot = new Webvs.EffectList(preset);
        this.stop();
        this.preset = preset;
        if(this.rootComponent) {
            this.rootComponent.destroy();
        }
        this.rootComponent = newRoot;
    },

    /**
     * Reset all the components. Call this when canvas dimensions changes
     * @memberof Webvs.Main
     */
    resetCanvas: function() {
        this.stop();
        if(this.rootComponent) {
            this.rootComponent.destroy();
            this.rootComponent = null;
        }
        this._initGl();
        if(this.preset) {
            this.rootComponent = new EffectList(this.preset);
        }
    },

    /**
     * Starts the animation
     * @memberof Webvs.Main
     */
    start: function() {
        if(!this.rootComponent) {
            return; // no preset loaded yet. cannot start!
        }

        this.registerBank = {};
        this.bootTime = (new Date()).getTime();
        var rootComponent = this.rootComponent;
        var promise = rootComponent.init(this.gl, this);

        var that = this;
        var drawFrame = function() {
            if(that.analyser.isPlaying()) {
                rootComponent.update();
            }
            that.animReqId = requestAnimationFrame(drawFrame);
        };

        // wrap drawframe in stats collection if required
        if(this.stats) {
            var oldDrawFrame = drawFrame;
            drawFrame = function() {
                that.stats.begin();
                oldDrawFrame.call(this, arguments);
                that.stats.end();
            };
        }

        // start rendering when the promise is  done
        promise.onResolve(function() {
            that.animReqId = requestAnimationFrame(drawFrame);
        });
    },

    /**
     * Stops the animation
     * @memberof Webvs.Main
     */
    stop: function() {
        if(typeof this.animReqId !== "undefined") {
            cancelAnimationFrame(this.animReqId);
        }
    }
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
 */
function Component() {}
Webvs.Component = Webvs.defineClass(Component, Object, {
    /**
     * String name of the component class. Used to generate
     * id strings.
     * @memberof Webgl.Component
     */
    componentName: "Component",

    /**
     * Initialize component. Called once before animation starts.
     * Override and implement initialization code
     * @abstract
     * @param {webglcontext} gl - webgl context
     * @param {Webvs.Main} main - container main object for this component
     * @param {Webvs.Component} - parent component
     * @memberof Webvs.Component
     */
    init: function(gl, main, parent) {
        this.gl = gl;
        this.main = main;
        this.parent = parent;
    },

    /**
     * Render a frame. Called once for every frame,
     * Override and implement rendering code
     * @abstract
     * @memberof Webvs.Component
     */
    update: function() {},

    /**
     * Release any Webgl resources. Called during
     * reinitialization. Override and implement cleanup code
     * @abstract
     * @memberof Webvs.Component
     */
    destroy: function() {},

    /**
     * Generates a printable id for this component
     * @returns {string} printable name generated from the parent hierarchy
     * @memberof Webvs.Component
     */
    getIdString: function() {
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
 * Effectlist is a component that can contain other components. Its also used as the root
 * component in Webvs.Main
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
    Webvs.checkRequiredOptions(options, ["components"]);
    options = _.defaults(options, {
        output: "REPLACE",
        input: "IGNORE",
        clearFrame: false,
        enableOnBeat: false,
        enableOnBeatFor: 1
    });

    this._constructComponent(options.components);
    this.output = options.output=="IGNORE"?-1:Webvs.blendModes[options.output];
    this.input = options.input=="IGNORE"?-1:Webvs.blendModes[options.input];
    this.clearFrame = options.clearFrame;
    this.enableOnBeat = options.enableOnBeat;
    this.enableOnBeatFor = options.enableOnBeatFor;
    this.first = true;
    this._frameCounter = 0;

    EffectList.super.constructor.call(this);
}
Webvs.EffectList = Webvs.defineClass(EffectList, Webvs.Component, {
    componentName: "EffectList",

    _constructComponent: function(optList) {
        var components = [];
        var that = this;
        // construct components from JSON
        _.each(optList, function(componentOptions, i) {
            if(typeof componentOptions.enabled === "boolean" && !componentOptions.enabled) {
                return;
            }
            var type = componentOptions.type;
            var cloneCount = typeof componentOptions.clone === "undefined"?1:componentOptions.clone;
            _.times(cloneCount, function(cloneId) {
                var component = new Webvs[type](componentOptions);
                component.id = i;
                component.cloneId = cloneId;
                components.push(component);
            });
        });
        this.components = components;
    },

    /**
     * Initializes the effect list
     * @memberof Webvs.EffectList
     */
    init: function(gl, main, parent) {
        EffectList.super.init.call(this, gl, main, parent);

        // create a framebuffer manager for this effect list
        this.fm = new Webvs.FrameBufferManager(main.canvas.width, main.canvas.height, gl, main.copier);

        // initialize all the sub components
        var components = this.components;
        var initPromises = [];
        for(var i = 0;i < components.length;i++) {
            var res = components[i].init(gl, main, this);
            if(res) {
                initPromises.push(res);
            }
        }

        return Webvs.joinPromises(initPromises);
    },

    /**
     * Renders a frame of the effect list, by running
     * all the subcomponents.
     * @memberof Webvs.EffectList
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

        // set rendertarget to internal framebuffer
        this.fm.setRenderTarget();

        // clear frame
        if(this.clearFrame || this.first) {
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
        var components = this.components;
        for(var i = 0;i < components.length;i++) {
            components[i].update();
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
     * @memberof Webgl.EffectList
     */
    destroy: function() {
        EffectList.super.destroy.call(this);

        // destory all the sub-components
        for(i = 0;i < this.components.length;i++) {
            this.components[i].destroyComponent();
        }

        // destroy the framebuffer manager
        this.fm.destroy();
    }
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
       when swapFrame is set to true
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
        Webvs.SUBTRACTIVE2
    ],

    // the blending formulas to be used inside shaders
    blendEqs: _.object([
        [Webvs.REPLACE, "color"],
        [Webvs.MAXIMUM, "max(color, texture2D(u_srcTexture, v_position))"],
        [Webvs.AVERAGE, "(color+texture2D(u_srcTexture, v_position))/2.0"],
        [Webvs.ADDITIVE, "color+texture2D(u_srcTexture, v_position)"],
        [Webvs.SUBTRACTIVE1, "texture2D(u_srcTexture, v_position)-color"],
        [Webvs.SUBTRACTIVE2, "color-texture2D(u_srcTexture, v_position)"]
    ]),

    /**
     * initializes and compiles the shaders
     * @memberof Webvs.ShaderProgram
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
     * @memberof Webvs.ShaderProgram
     */
    setOutputBlendMode: function(mode) {
        this.outputBlendMode = mode;
    },

    /**
     * Runs this shader program
     * @param {Webvs.FrameBufferManager} fm - frame manager. pass null, if no fm is required
     * @param {Webvs.blendModes} outputBlendMode - overrides the blendmode. pass null to use default
     * @param {...any} extraParams - remaining parameters are passed to the draw function
     * @memberof Webvs.ShaderProgram
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
     * @memberof Webvs.ShaderProgram
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
            Webvs.logShaderError(this.fragmentSrc, gl.getShaderInfoLog(shader));
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
     * @memberof Webvs.ShaderProgram
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
     * @memberof Webvs.ShaderProgram
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
     * @memberof Webvs.ShaderProgram
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
     * @memberof Webvs.ShaderProgram
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

    /**
     * destroys webgl resources consumed by this program.
     * call in component destroy
     * @memberof Webvs.ShaderProgram
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
 * and switches between them, when requested by different
 * shader programs. Its used in EffectLists to compose rendering
 * of the different {@link Webvs.Component}
 *
 * @param {number} width - the width of the textures to be initialized
 * @param {number} height - the height of the textures to be initialized
 * @param {WebGLRenderingContext} gl - the webgl context to be used
 * @param {Webvs.CopyProgram} copier - an instance of a CopyProgram that should be used
 *                                     when a frame copyOver is required
 * @constructor
 * @memberof Webvs
 */
function FrameBufferManager(width, height, gl, copier, texCount) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.copier = copier;
    this.texCount = texCount || 2;
    this._initFrameBuffers();
}
Webvs.FrameBufferManager = Webvs.defineClass(FrameBufferManager, Object, {
    _initFrameBuffers: function() {
        var gl = this.gl;

        var framebuffer = gl.createFramebuffer();
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

        this.framebuffer = framebuffer;
        this.frameAttachments = attachments;
        this.currAttachment = 0;
    },

    /**
     * Saves the current render target and sets this
     * as the render target
     * @memberof Webvs.FrameBufferManager
     */
    setRenderTarget: function() {
        var gl = this.gl;
        this.inputFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.width, this.height);
        this._setFBAttachment();
    },

    /**
     * Restores the render target previously saved with
     * a {@link Webvs.FrameBufferManager.setRenderTarget} call
     * @memberof Webvs.FrameBufferManager
     */
    restoreRenderTarget: function() {
        var gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.inputFrameBuffer);
        gl.viewport(0, 0, this.width, this.height);
    },

    /**
     * Returns the texture that is currently being used
     * @returns {WebGLTexture}
     * @memberof Webvs.FrameBufferManager
     */
    getCurrentTexture: function() {
        return this.frameAttachments[this.currAttachment].texture;
    },

    /**
     * Copies the previous texture into the current texture
     * @memberof Webvs.FrameBufferManager
     */
    copyOver: function() {
        var prevTexture = this.frameAttachments[Math.abs(this.currAttachment-1)%this.texCount].texture;
        this.copier.run(null, null, prevTexture);
    },

    /**
     * Swaps the current texture
     * @memberof Webvs.FrameBufferManager
     */
    swapAttachment : function() {
        this.currAttachment = (this.currAttachment + 1) % this.texCount;
        this._setFBAttachment();
    },

    /**
     * cleans up all webgl resources
     * @memberof Webvs.FrameBufferManager
     */
    destroy: function() {
        for(var i = 0;i < this.texCount;i++) {
            gl.deleteRenderbuffer(this.frameAttachments[i].renderbuffer);
            gl.deleteTexture(this.frameAttachments[i].texture);
        }
        gl.deleteFramebuffer(this.framebuffer);
    },


    _setFBAttachment: function() {
        var attachment = this.frameAttachments[this.currAttachment];
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
        
        var result0, result1, result2, result3, result4, result5, result6;
        var pos0, pos1, pos2;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        result0 = parse_statement();
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result2 = [];
            pos2 = clone(pos);
            if (input.charCodeAt(pos.offset) === 59) {
              result3 = ";";
              advance(pos, 1);
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("\";\"");
              }
            }
            if (result3 !== null) {
              result4 = parse___();
              if (result4 !== null) {
                result5 = parse_statement();
                if (result5 !== null) {
                  result6 = parse___();
                  if (result6 !== null) {
                    result3 = [result3, result4, result5, result6];
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
            } else {
              result3 = null;
              pos = clone(pos2);
            }
            while (result3 !== null) {
              result2.push(result3);
              pos2 = clone(pos);
              if (input.charCodeAt(pos.offset) === 59) {
                result3 = ";";
                advance(pos, 1);
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\";\"");
                }
              }
              if (result3 !== null) {
                result4 = parse___();
                if (result4 !== null) {
                  result5 = parse_statement();
                  if (result5 !== null) {
                    result6 = parse___();
                    if (result6 !== null) {
                      result3 = [result3, result4, result5, result6];
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
              } else {
                result3 = null;
                pos = clone(pos2);
              }
            }
            if (result2 !== null) {
              if (input.charCodeAt(pos.offset) === 59) {
                result3 = ";";
                advance(pos, 1);
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\";\"");
                }
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
          result0 = (function(offset, line, column, p) {
            var stmts = [p[0]];
            stmts = stmts.concat(_.map(p[2], function(pp) {
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
     * @memberof Webvs.CodeInstance
     */
    rand: function(max) { 
        return Math.floor(Math.random() * max) + 1;
    },

    /**
     * avs expression gettime function
     * @memberof Webvs.CodeInstance
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
     * @memberof Webvs.CodeInstance
     */
    getosc: function(band, width, channel) {
        var osc = this._analyser.getWaveform();
        var pos = Math.floor((band - width/2)*osc.length);
        var end = Math.floor((band + width/2)*osc.length);

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
     * @memberof Webvs.CodeInstance
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
     * @memberof Webvs.CodeInstance
     */
    setup: function(main, parent) {
        this._registerBank = main.registerBank;
        this._bootTime = main.bootTime;
        this._analyser = main.analyser;

        this.w = main.canvas.width;
        this.h = main.canvas.height;
        this.cid = parent.cloneId;

        // clear all used registers
        _.each(this._registerUsages, function(name) {
            if(!_.has(main.registerBank, name)) {
                main.registerBank[name] = 0;
            }
        });
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
 * AVS expression parser and code generator.
 * Generates JS and GLSL code from avs expressions
 * @param {object.<string, string>} codeSrc - object containing avs expression code string
 * @param {Array.<string>} externalVars - list of variables that will be supplied externally.
 * @memberof Webvs
 * @constructor
 */
function ExprCodeGenerator(codeSrc, externalVars) {
    this.codeSrc = codeSrc;
    this.externalVars = externalVars?externalVars:[];
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
                if(_.isArray(codeSrc)) {
                    codeSrc = codeSrc.join("\n");
                }
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
     * @memberof Webvs.ExprCodeGenerator
     */
    generateCode: function(jsFuncs, glslFuncs, treatAsNonUniform) {
        var inst = new Webvs.CodeInstance();
        var that = this;
        var glsl = [];

        _.each(this.instanceVars, function(ivar) {
            // clear instance variables in code instance
            inst[ivar] = 0;

            // create declarations for instance variables in glsl
            var prefix = "";
            if(!_.contains(treatAsNonUniform, ivar)) {
                prefix = "uniform ";
            }
            glsl.push(prefix + "float " + ivar + ";");
        });

        var jsFuncList = _.intersection(_.keys(this.codeAst), jsFuncs);
        var missingJsFuncList = _.difference(jsFuncs, jsFuncList);

        // generate javascript functions and assign to code instance
        _.each(jsFuncList, function(name) {
            var ast = that.codeAst[name];
            var codeString = that._generateJs(ast);
            inst[name] = new Function(codeString);
        });
        // add noops for missing expressions
        _.each(missingJsFuncList, function(name) {
            inst[name] = Webvs.noop;
        });

        var glslFuncList = _.intersection(_.keys(this.codeAst), glslFuncs);
        var missingGlslFuncList = _.difference(glslFuncs, glslFuncList);
        var glsFuncUsages = _.uniq(
            _.flatMap(glslFuncList, function(name) { return that.funcUsages[name]; })
        );

        // include required functions in glsl
        _.each(glsFuncUsages, function(usage) {
            var code = that.glslFuncCode[usage];
            if(!code) {
                return;
            }
            glsl.push(code);
        });
        var preCompute = []; // list of precomputed bindings
        var generatedGlslFuncs = [];
        // generate glsl functions
        _.each(glslFuncList, function(name) {
            var ast = that.codeAst[name];
            var codeString = that._generateGlsl(ast, preCompute);
            generatedGlslFuncs.push("void " + name + "() {");
            generatedGlslFuncs.push(codeString);
            generatedGlslFuncs.push("}");
        });
        // add the uniform declarations for precomputed functions
        glsl = glsl.concat(_.map(preCompute, function(item) {
            return "uniform float " + item[1] + ";";
        }));
        glsl = glsl.concat(generatedGlslFuncs);
        inst._preCompute = preCompute;

        // generate noops for missing functions
        _.each(missingGlslFuncList, function(name) {
            glsl.push("void " + name + "() {}");
        });

        if(_.contains(glslFuncList, "rand")) {
            inst.hasRandom = true;
        }
        if(_.contains(glslFuncList, "gettime")) {
            inst.hasGettime = true;
        }
        inst._treatAsNonUniform = treatAsNonUniform;
        inst._registerUsages = this.registerUsages;

        return [inst, glsl.join("")];
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

    jsMathFuncs: ["sin", "cos", "abs", "tan", "asin", "acos", "atan", "log", "pow", "sqrt", "floor", "ceil"],

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
        var that = this;

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
                    var args = _.map(ast.args, function(arg) {return that._generateGlsl(arg, preCompute);}).join(",");
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
            var stmts = _.map(ast.statements, function(stmt) {return that._generateGlsl(stmt, preCompute);});
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
        var that = this;

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
                    var args = _.map(ast.args, function(arg) {return that._generateJs(arg);}).join(",");
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
            var stmts = _.map(ast.statements, function(stmt) {return that._generateJs(stmt);});
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
        var that = this;

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
               that._getVars(arg, vars, funcUsages, regUsages);
            });
        }
        else if(ast instanceof Webvs.AstAssignment) {
            this._getVars(ast.lhs, vars, funcUsages, regUsages);
            this._getVars(ast.expr, vars, funcUsages, regUsages);
        }
        else if(ast instanceof Webvs.AstProgram) {
            _.each(ast.statements, function(stmt) {
                that._getVars(stmt, vars, funcUsages, regUsages);
            });
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
	var codeGen = new Webvs.ExprCodeGenerator(options.code, ["b", "w", "h"]);
    var genResult = codeGen.generateCode(["init", "onBeat", "perFrame"], [], []);
    this.code = genResult[0];
    this.inited = false;

    GlobalVar.super.constructor.call(this);
}
Webvs.GlobalVar = Webvs.defineClass(GlobalVar, Webvs.Component, {
    /**
     * initializes the globalvar component
     * @memberof Webvs.GlobalVar
     */
	init: function(gl, main, parent) {
		GlobalVar.super.init.call(this, gl, main, parent);

        this.code.setup(main, this);
	},

    /**
     * Runs the code
     * @memberof Webvs.GlobalVar
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
    BufferSave.super.constructor.call(this);
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
     * @memberof Webvs.BufferSave
     */
    init: function(gl, main, parent) {
        BufferSave.super.init.call(this, gl, main, parent);

        // create frame buffer manager
        if(!main.registerBank[this._bufferId]) {
            var fm = new Webvs.FrameBufferManager(main.canvas.width, main.canvas.height, gl, main.copier, 1);
            main.registerBank[this._bufferId] = fm;
        }
    },

    /**
     * Saves or Renders the current frame
     * @memberof Webvs.BufferSave
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
     * @memberof Webgl.BufferSave
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

    FadeOut.super.constructor.call(this);
}
Webvs.FadeOut = Webvs.defineClass(FadeOut, Webvs.Component, {
    componentName: "FadeOut",

    /**
     * initializes the FadeOut component
     * @memberof Webvs.FadeOut
     */
    init: function(gl, main, parent) {
        FadeOut.super.init.call(this, gl, main, parent);
        this.program.init(gl);
    },

    /**
     * fades the screen
     * @memberof Webvs.FadeOut
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
     * @memberof Webvs.FadeOut
     */
    destroy: function() {
        FadeOut.super.destroyComponent.call(this);
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

    Convolution.super.constructor.call(this);
}
Webvs.Convolution = Webvs.defineClass(Convolution, Webvs.Component, {
    componentName: "Convolution",

    /**
     * initializes the Convolution component
     * @method
     * @memberof Webvs.Convolution
     */
    init: function(gl, main, parent) {
        Convolution.super.init.call(this, gl, main, parent);
        this.program.init(gl);
    },

    /**
     * applies the Convolution matrix
     * @method
     * @memberof Webvs.Convolution
     */
    update: function() {
        this.program.run(this.parent.fm, null);
    },

    /**
     * releases resources
     * @memberof Webvs.Convolution
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
            colorSumEq.push("pos = v_position + onePixel * vec2("+(i-mid)+","+(j-mid)+");");
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
            "   vec2 onePixel = vec2(1.0, 1.0)/u_resolution;",
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

    this.program = new Webvs.ColorMapProgram(options.key, Webvs.blendModes[options.output]);

    ColorMap.super.constructor.call(this);
}
Webvs.ColorMap = Webvs.defineClass(ColorMap, Webvs.Component, {
    mapCycleModes: {
        SINGLE: 1,
        ONBEATRANDOM: 2,
        ONBEATSEQUENTIAL: 3
    },

    /**
     * initializes the ColorMap component
     * @memberof Webvs.ColorMap
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
     * @memberof Webvs.ColorMap
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
     * @memberof Webvs.ColorMap
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

        // add a cap entries at the ends
        var first = _.first(map);
        if(first.index !== 0) {
            map.splice(0, 0, {color:first.color, index:0});
        }
        var last = _.last(map);
        if(last.index !== 255) {
            map.push({color:last.color, index:255});
        }

        map = _.map(map, function(mapItem) {
            var color = Webvs.parseColor(mapItem.color);
            return {color:color, index:mapItem.index};
        });

        // lerp intermediate values
        var colorMap = new Uint8Array(256*4);
        var cmi = 0;
        var pairs = _.zip(_.first(map, map.length-1), _.last(map, map.length-1));
        _.each(pairs, function(pair, i) {
            var first = pair[0];
            var second = pair[1];
            var steps = second.index - first.index;
            var colorStep = [
                (second.color[0] - first.color[0])/steps,
                (second.color[1] - first.color[1])/steps,
                (second.color[2] - first.color[2])/steps
            ];
            _.times(steps, function(i) {
                colorMap[cmi++] = (first.color[0] + colorStep[0]*i);
                colorMap[cmi++] = (first.color[1] + colorStep[1]*i);
                colorMap[cmi++] = (first.color[2] + colorStep[2]*i);
                colorMap[cmi++] = 255;
            });
        });
        colorMap[cmi++] = last.color[0];
        colorMap[cmi++] = last.color[1];
        colorMap[cmi++] = last.color[2];
        colorMap[cmi++] = 255;

        // put the color values into a 256x1 texture
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, colorMap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
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
}
Webvs.ColorClip = Webvs.defineClass(ColorClip, Webvs.Component, {
    modes: ["BELOW", "ABOVE", "NEAR"],
    componentName: "ChannelShift",

    /**
     * initializes the ColorClip component
     * @memberof Webvs.ColorClip
     */
    init: function(gl, main, parent) {
        ColorClip.super.init.call(this, gl, main, parent);

        this.program.init(gl);
    },

    /**
     * clips the colors
     * @memberof Webvs.ColorClip
     */
    update: function() {
        this.program.run(this.parent.fm, null, this.mode, this.color, this.outColor, this.level);
    },

    /**
     * releases resources
     * @memberof Webvs.ColorClip
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
    var codeGen = new Webvs.ExprCodeGenerator(codeSrc, ["x", "y", "r", "d", "b", "w", "h"]);
    var genResult = codeGen.generateCode(["init", "onBeat", "perFrame"], ["perPixel"], ["x", "y", "d", "r"]);
    this.code = genResult[0];
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
                                               genResult[1]);
    } else {
        this.program = new Webvs.DMovProgram(this.coordMode, this.bFilter,
                                             this.compat, this.code.hasRandom,
                                             genResult[1]);
    }

    DynamicMovement.super.constructor.call(this);
}
Webvs.DynamicMovement = Webvs.defineClass(DynamicMovement, Webvs.Component, {
    componentName: "DynamicMovement",

    /**
     * initializes the DynamicMovement component
     * @memberof Webvs.DynamicMovement
     */
    init: function(gl, main, parent) {
        DynamicMovement.super.init.call(this, gl, main, parent);

        this.program.init(gl);

        this.code.setup(main, parent);

        // calculate grid vertices
        if(!this.noGrid) {
            var nGridW = (this.gridW/this.main.canvas.width)*2;
            var nGridH = (this.gridH/this.main.canvas.height)*2;
            var gridCountAcross = Math.ceil(this.main.canvas.width/this.gridW);
            var gridCountDown = Math.ceil(this.main.canvas.height/this.gridH);
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
     * @memberof Webvs.DynamicMovement
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
     * @memberof Webvs.DynamicMovement
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
                "x = d*sin(r);",
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

                "   vec3 tl = getSrcColorAtPos(corn).rgb;",
                "   vec3 tr = getSrcColorAtPos(corn + vec2(texel.x, 0)).rgb;",
                "   vec3 bl = getSrcColorAtPos(corn + vec2(0, texel.y)).rgb;",
                "   vec3 br = getSrcColorAtPos(corn + texel).rgb;",

                "   float xp = floor(fract(coord.x/texel.x)*255.0);",
                "   float yp = floor(fract(coord.y/texel.y)*255.0);",

                "   #define g_blendtable(i, j) floor(((i)/255.0)*(j))",

                "   float a1 = g_blendtable(255.0-xp, 255.0-yp);",
                "   float a2 = g_blendtable(xp,       255.0-yp);",
                "   float a3 = g_blendtable(255.0-xp, yp);",
                "   float a4 = g_blendtable(xp,       yp);",

                "   float r = (floor(a1*tl.r) + floor(a2*tr.r) + floor(a3*bl.r) + floor(a4*br.r))/255.0;",
                "   float g = (floor(a1*tl.g) + floor(a2*tr.g) + floor(a3*bl.g) + floor(a4*br.g))/255.0;",
                "   float b = (floor(a1*tl.b) + floor(a2*tr.b) + floor(a3*bl.b) + floor(a4*br.b))/255.0;",
                "   return vec3(r, g, b);",
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

    ChannelShift.super.constructor.call(this);
}
Webvs.ChannelShift = Webvs.defineClass(ChannelShift, Webvs.Component, {
    componentName: "ChannelShift",

    /**
     * initializes the ChannelShift component
     * @memberof Webvs.ChannelShift
     */
    init: function(gl, main, parent) {
        ChannelShift.super.init.call(this, gl, main, parent);

        this.program.init(gl);
    },

    /**
     * shifts the colors
     * @memberof Webvs.ChannelShift
     */
    update: function() {
        if(this.onBeatRandom && this.main.analyser.beat) {
            this.channel = Math.floor(Math.random() * channels.length);
        }
        this.program.run(this.parent.fm, null, this.channel);
    },

    /**
     * releases resources
     * @memberof Webvs.ChannelShift
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
 * A generic scope, that can draw points or lines based on user code
 *
 * #### Code variables
 *
 * The following variables are available in the code
 *
 * + n (default: 100) - the number of points.
 * + i - 0-1 normalized loop counter
 * + v - the value of the superscope at current position
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
    var codeGen = new Webvs.ExprCodeGenerator(codeSrc, ["n", "v", "i", "x", "y", "b", "w", "h", "red", "green", "blue", "cid"]);
    var genResult = codeGen.generateCode(["init", "onBeat", "perFrame", "perPoint"], [], []);
    this.code = genResult[0];
    this.code.n = 100;

    this.spectrum = options.source == "SPECTRUM";
    this.dots = options.drawMode == "DOTS";

    this.colors = _.map(options.colors, Webvs.parseColorNorm);
    this.currentColor = this.colors[0];
    this.maxStep = 100;

    this.step = this.maxStep; // so that we compute steps, the first time
    this.colorId = 0;
    this.colorStep = [0,0,0];

    this.thickness = options.thickness?options.thickness:1;

    this.inited = false;

    this.program = new SuperScopeShader();

    SuperScope.super.constructor.call(this);
}
Webvs.SuperScope = Webvs.defineClass(SuperScope, Webvs.Component, {
    componentName: "SuperScope",

    /**
     * initializes the SuperScope component
     * @memberof Webvs.SuperScope
     */
    init: function(gl, main, parent) {
        SuperScope.super.init.call(this, gl, main, parent);
        this.program.init(gl);
        this.code.setup(main, this);
    },

    /**
     * renders the scope
     * @memberof Webvs.SuperScope
     */
    update: function() {
        var gl = this.gl;
        var code = this.code;

        this._stepColor();
        code.red = this.currentColor[0];
        code.green = this.currentColor[1];
        code.blue = this.currentColor[2];

        if(!this.inited) {
            code.init();
            this.inited = true;
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

            var pos = i/(nPoints-1);
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
     * @memberof Webvs.SuperScope
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
                this.currentColor = curColor;
            } else {
                for(i = 0;i < 3;i++) {
                    this.currentColor[i] += this.colorStep[i];
                }
                this.step++;
            }
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

    ClearScreen.super.constructor.call(this);
}
Webvs.ClearScreen = Webvs.defineClass(ClearScreen, Webvs.Component, {
    componentName: "ClearScreen",

    /**
     * initializes the ClearScreen component
     * @memberof Webvs.ClearScreen
     */
    init: function(gl, main, parent) {
        ClearScreen.super.init.call(this, gl, main, parent);
        this.program.init(gl);
    },

    /**
     * clears the screen
     * @memberof Webvs.ClearScreen
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
     * @memberof Webvs.ClearScreen
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
    Picture.super.constructor.call(this, options);
}
Webvs.Picture = Webvs.defineClass(Picture, Webvs.Component, {
    /**
     * initializes the ClearScreen component
     * @memberof Webvs.Picture
     */
    init: function(gl, main, parent) {
        Picture.super.init.call(this, gl, main, parent);

        this.program.init(gl);

        var _this = this;
        var image = new Image();
        image.src = this.src;
        var promise = new Webvs.Promise();
        image.onload = function() {
            _this.width = image.width;
            _this.height = image.height;
            _this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, _this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            promise.resolve();
        };

        return promise;
    },

    /**
     * renders the image
     * @memberof Webvs.Picture
     */
    update: function() {
        this.program.run(this.parent.fm, null, this.x, this.y, this.texture, this.width, this.height);
    },

    /**
     * releases resources
     * @memberof Webvs.Picture
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
