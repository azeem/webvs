module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 141);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
var flow_1 = __webpack_require__(117);
var map_1 = __webpack_require__(13);
var partialRight_1 = __webpack_require__(124);
var takeRight_1 = __webpack_require__(83);
/**
 * A No-Op function
 */
// tslint:disable-next-line:no-empty
function noop() { }
exports.noop = noop;
/**
 * Checks if an object contains the required properties. Throws an error
 * for missing options
 * @param options the options to be checked
 * @param requiredOptions set of required options
 */
function checkRequiredOptions(options, requiredOptions) {
    for (var _i = 0, requiredOptions_1 = requiredOptions; _i < requiredOptions_1.length; _i++) {
        var optionName = requiredOptions_1[_i];
        if (!(optionName in options)) {
            throw new Error("Required option " + optionName + " not found");
        }
    }
}
exports.checkRequiredOptions = checkRequiredOptions;
/**
 * Returns a floating point value representation of a number
 * embeddable in glsl shader code
 * @param val value to be converted
 */
function glslFloatRepr(val) {
    return val + (parseFloat(val) % 1 === 0 ? ".0" : "");
}
exports.glslFloatRepr = glslFloatRepr;
/**
 * Checks whether the argument is a Color or not
 * @param color color to be checked
 */
function isColor(color) {
    return Array.isArray(color) && color.length === 3;
}
/**
 * Parse css color string #RRGGBB or rgb(r, g, b)
 * @param color the color value to be parsed
 */
function parseColor(color) {
    if (isColor(color)) {
        return color;
    }
    else {
        color = color.toLowerCase();
        var match = color.match(/^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/);
        if (match) {
            return flow_1["default"]([
                partialRight_1["default"](takeRight_1["default"], 3),
                partialRight_1["default"](map_1["default"], function (channel) {
                    return parseInt(channel, 16);
                }),
            ])(match);
        }
        match = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
        if (match) {
            return flow_1["default"]([
                partialRight_1["default"](takeRight_1["default"], 3),
                partialRight_1["default"](map_1["default"], function (channel) {
                    return Math.min(parseInt(channel, 10), 255);
                }),
            ])(match);
        }
    }
    throw new Error("Invalid Color Format");
}
exports.parseColor = parseColor;
/**
 * Parse css color string and return normalizes Color value
 * @param color the color value to be parsed
 */
function parseColorNorm(color) {
    return map_1["default"](parseColor(color), function (value) { return value / 255; });
}
exports.parseColorNorm = parseColorNorm;
/**
 * Parses shader error message and displays readable information
 * @param src source of the shader
 * @param error error message
 */
function logShaderError(src, error) {
    var lines = src.split("\n");
    var ndigits = lines.length.toString().length;
    var errorPosMatch = error.match(/(\d+):(\d+)/);
    var errorPos;
    if (errorPosMatch) {
        errorPos = [parseInt(errorPosMatch[1], 10), parseInt(errorPosMatch[2], 10)];
    }
    var numberedLines = map_1["default"](lines, function (line, index) {
        var i;
        var lineNumber = (index + 1) + "";
        for (i = 0; i < (ndigits - lineNumber.length); i++) {
            lineNumber = "0" + lineNumber;
        }
        var errorIndicator = "";
        if (errorPos && errorPos[1] === index + 1) {
            var indent = "";
            for (i = 0; i < errorPos[0] + ndigits + 2; i++) {
                indent += " ";
            }
            errorIndicator = "\n" + indent + "^\n" + indent + error;
        }
        return lineNumber + ": " + line + errorIndicator;
    }).join("\n");
    // tslint:disable-next-line:no-console
    console.log("Shader Error : \n" + numberedLines);
}
exports.logShaderError = logShaderError;
/**
 * Blend Modes
 */
var BlendMode;
(function (BlendMode) {
    BlendMode[BlendMode["REPLACE"] = 1] = "REPLACE";
    BlendMode[BlendMode["MAXIMUM"] = 2] = "MAXIMUM";
    BlendMode[BlendMode["AVERAGE"] = 3] = "AVERAGE";
    BlendMode[BlendMode["ADDITIVE"] = 4] = "ADDITIVE";
    BlendMode[BlendMode["SUBTRACTIVE1"] = 5] = "SUBTRACTIVE1";
    BlendMode[BlendMode["SUBTRACTIVE2"] = 6] = "SUBTRACTIVE2";
    BlendMode[BlendMode["MULTIPLY"] = 7] = "MULTIPLY";
    BlendMode[BlendMode["MULTIPLY2"] = 8] = "MULTIPLY2";
    BlendMode[BlendMode["ADJUSTABLE"] = 9] = "ADJUSTABLE";
    BlendMode[BlendMode["ALPHA"] = 10] = "ALPHA";
})(BlendMode = exports.BlendMode || (exports.BlendMode = {}));
/**
 * Channels
 */
var Channels;
(function (Channels) {
    Channels[Channels["CENTER"] = 0] = "CENTER";
    Channels[Channels["LEFT"] = 1] = "LEFT";
    Channels[Channels["RIGHT"] = 2] = "RIGHT";
})(Channels = exports.Channels || (exports.Channels = {}));
/**
 * Source
 */
var Source;
(function (Source) {
    Source[Source["SPECTRUM"] = 1] = "SPECTRUM";
    Source[Source["WAVEFORM"] = 2] = "WAVEFORM";
})(Source = exports.Source || (exports.Source = {}));
/**
 * Returns a random string of given length
 * @param count number of characters
 * @param chars character set to choose from
 */
function randString(count, chars) {
    var randStr = [];
    chars = chars || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < count; i++) {
        randStr.push(chars.charAt(Math.floor(Math.random() * chars.length)));
    }
    return randStr.join("");
}
exports.randString = randString;
/**
 * WebGL data types
 */
var WebGLVarType;
(function (WebGLVarType) {
    WebGLVarType["TEXTURE2D"] = "texture2D";
    WebGLVarType["_1F"] = "1f";
    WebGLVarType["_2F"] = "2f";
    WebGLVarType["_3F"] = "3f";
    WebGLVarType["_4F"] = "4f";
    WebGLVarType["_1I"] = "1i";
    WebGLVarType["_2I"] = "2i";
    WebGLVarType["_3I"] = "3i";
    WebGLVarType["_4I"] = "4i";
    WebGLVarType["_1FV"] = "1fv";
    WebGLVarType["_2FV"] = "2fv";
    WebGLVarType["_3FV"] = "3fv";
    WebGLVarType["_4FV"] = "4fv";
    WebGLVarType["_1IV"] = "1iv";
    WebGLVarType["_2IV"] = "2iv";
    WebGLVarType["_3IV"] = "3iv";
    WebGLVarType["_4IV"] = "4iv";
})(WebGLVarType = exports.WebGLVarType || (exports.WebGLVarType = {}));
function isTypedArray(array) {
    return (array instanceof Int8Array ||
        array instanceof Uint8Array ||
        array instanceof Uint8ClampedArray ||
        array instanceof Int16Array ||
        array instanceof Uint16Array ||
        array instanceof Int32Array ||
        array instanceof Uint32Array ||
        array instanceof Float32Array ||
        array instanceof Float64Array);
}
exports.isTypedArray = isTypedArray;
/**
 * Clamp number between range
 * @param num number to clamp
 * @param min min value of the range
 * @param max max value of the range
 */
function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}
exports.clamp = clamp;
/**
 * Returns the value of property given its (dot separated) path in an object
 * @param obj object with the property
 * @param name name of the property
 */
function getProperty(obj, name) {
    if (typeof name === "string") {
        name = name.split(".");
    }
    var value = obj[name.shift()];
    if (value) {
        if (name.length > 0) {
            return getProperty(value, name);
        }
        else {
            return value;
        }
    }
}
exports.getProperty = getProperty;
/**
 * Sets a property, given its (dot separated) path in an object
 * @param obj the object in which the property is to be set
 * @param name name of the property
 * @param value value of the property
 */
function setProperty(obj, name, value) {
    if (typeof name === "string") {
        name = name.split(".");
    }
    var propertyName = name.shift();
    if (name.length === 0) {
        obj[propertyName] = value;
    }
    else {
        setProperty(obj[propertyName], name, value);
    }
}
exports.setProperty = setProperty;
/**
 * flattens array of strings to single string
 * @param value string or list of strings to be flattened
 * @param sep seprator to flatten the strings with
 */
function flatString(value, sep) {
    if (sep === void 0) { sep = "\n"; }
    if (typeof (value) === "string") {
        return value;
    }
    else {
        return value.join(sep);
    }
}
exports.flatString = flatString;


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/* harmony default export */ __webpack_exports__["default"] = (isArray);


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var clone_1 = __webpack_require__(47);
var defaults_1 = __webpack_require__(24);
var flatten_1 = __webpack_require__(38);
var isEqual_1 = __webpack_require__(108);
var isUndefined_1 = __webpack_require__(110);
var omit_1 = __webpack_require__(219);
var uniqueId_1 = __webpack_require__(224);
var Model_1 = __webpack_require__(76);
/**
 * Base class for all Components.
 *
 * Webvs renders visualizations by layering different Components or effects
 * one after the other. Each Component type will have a different rendering
 * behaviour which can be configured through the component options. Some
 * components may have sub components, in which case the rendering of all
 * the subcomponents is modified/controlled in some manner by the parent.
 * eg. [[EffectList]], which renders a set of components into a separate
 * buffer which is then blended back into the main render.
 *
 * Options on components can be modified with a [[Model.set]] call. This
 * allows Components to respond to changes in options in real-time.
 * Eg: Changing colors, Code etc. This feature can be used to build
 * Live-Edit User Interfaces for presets development.
 */
var Component = /** @class */ (function (_super) {
    __extends(Component, _super);
    /**
     * Constructs new Component. Components are usually instantated by a [[Container]] component
     * or [[Main]] in the case of the root [[EffectList]].
     * @param main the main object that manages this component
     * @param parent the parent that manages this component
     * @param options the initial options for this component
     */
    function Component(main, parent, options) {
        var _this = _super.call(this) || this;
        _this.main = main;
        _this.parent = parent;
        _this.id = options.id; // TODO: check for id uniqueness
        if (!_this.id) {
            _this.id = uniqueId_1["default"](_this.constructor.componentName + "_");
        }
        _this.enabled = isUndefined_1["default"](options.enabled) ? true : options.enabled;
        _this.opts = omit_1["default"](options, ["id", "enabled"]);
        var defaultOptions = _this.constructor.defaultOptions;
        if (defaultOptions) {
            _this.opts = defaults_1["default"](_this.opts, defaultOptions);
        }
        _this.init();
        return _this;
    }
    /**
     * Returns the name of the component
     */
    Component.getComponentName = function () {
        return this.componentName;
    };
    /**
     * Returns a string tag that categorizes the component. e.g. trans, render
     */
    Component.getComponentTag = function () {
        return this.componentTag;
    };
    /**
     * Returns whether this component is enabled or not
     */
    Component.prototype.isEnabled = function () {
        return this.enabled;
    };
    /**
     * Returns the id of this component
     */
    Component.prototype.getId = function () {
        return this.id;
    };
    /**
     * Returns the last error. That raised an `error:*` event
     */
    Component.prototype.getLastError = function () {
        return this.lastError;
    };
    /**
     * Destroys and cleansup resources. Please override to
     * cleanup component specific resources.
     */
    Component.prototype.destroy = function () {
        this.stopListening();
    };
    /**
     * Sets the parent of this component
     * @param newParent the new parent of this component
     */
    Component.prototype.setParent = function (newParent) {
        this.parent = newParent;
    };
    /**
     * Returns the JSON representation of the component options.
     *
     * This value if passed into constructor will instantiate a component
     * that behaves the same as this component.
     */
    Component.prototype.toJSON = function () {
        var opts = clone_1["default"](this.opts);
        opts.id = this.id;
        opts.type = this.constructor.componentName;
        opts.enabled = this.enabled;
        return opts;
    };
    /**
     * returns a component options given name
     */
    Component.prototype.get = function (name) {
        if (name === "enabled") {
            return this.enabled;
        }
        else if (name === "id") {
            return this.id;
        }
        else {
            return this.opts[name];
        }
    };
    /**
     * Returns a `/` path to the component from the root.
     */
    Component.prototype.getPath = function () {
        if (!isUndefined_1["default"](this.parent) && !isUndefined_1["default"](this.id)) {
            return this.parent.getPath() + "/" + this.constructor.componentName + "#" + this.id;
        }
        else {
            return this.constructor.componentName + "#Main";
        }
    };
    Component.prototype.setAttribute = function (key, value, options) {
        var oldValue = this.get(key);
        if (key === "type" || isEqual_1["default"](value, oldValue)) {
            return false;
        }
        // set the property
        if (key === "enabled") {
            this.enabled = value;
        }
        else if (key === "id") {
            this.id = value;
        }
        else {
            this.opts[key] = value;
        }
        // call all onchange handlers
        // we just call these manually here no need to
        // go through event triggers
        var optUpdateHandlers = this.constructor.optUpdateHandlers;
        if (optUpdateHandlers) {
            try {
                var onChange = flatten_1["default"]([
                    optUpdateHandlers[key] || [],
                    optUpdateHandlers["*"] || [],
                ]);
                for (var _i = 0, onChange_1 = onChange; _i < onChange_1.length; _i++) {
                    var onChangeHandler = onChange_1[_i];
                    this[onChangeHandler].call(this, value, key, oldValue);
                }
            }
            catch (e) {
                // restore old value in case any of the onChange handlers fail
                if (key === "enabled") {
                    this.enabled = oldValue;
                }
                else if (key === "id") {
                    this.id = oldValue;
                }
                else {
                    this.opts[key] = oldValue;
                }
                this.lastError = e;
                this.emit("error:" + key, this, value, options, e);
            }
        }
        return true;
    };
    /**
     * Name of the component.
     */
    Component.componentName = "Component";
    /**
     * A string tag that categorizes the component. e.g. trans, render
     */
    Component.componentTag = "";
    /**
     * Map from option name to handler methods. The handler methods are
     * called in order when on an option is updated with a [[Model.set]] call.
     * This allows component to respond to option changes live. e.g. In a Live-Edit
     * User Interface for preset development.
     */
    Component.optUpdateHandlers = null;
    /**
     * Default options for this component
     */
    Component.defaultOptions = {};
    return Component;
}(Model_1["default"]));
exports["default"] = Component;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
var defaults_1 = __webpack_require__(24);
var each_1 = __webpack_require__(12);
var indexOf_1 = __webpack_require__(277);
var utils_1 = __webpack_require__(0);
var Buffer_1 = __webpack_require__(29);
var geometries_1 = __webpack_require__(85);
/**
 * ShaderProgram is an abstraction for Shaders Programs that provides,
 * blended output, easier variable bindings and other nice features.
 */
var ShaderProgram = /** @class */ (function () {
    /**
     * Creates a new shader and compiles the source
     * @param rctx the rendering context under which the shader program will be created
     * @param opts shader options
     */
    function ShaderProgram(rctx, opts) {
        var _this = this;
        opts = defaults_1["default"](opts, {
            blendMode: utils_1.BlendMode.REPLACE,
            blendValue: 0.5,
            copyOnSwap: false,
            dynamicBlend: false,
            swapFrame: false
        });
        var vsrc = ["\n            precision mediump float;\n            varying vec2 v_position;\n            uniform vec2 u_resolution;\n            uniform sampler2D u_srcTexture;\n\n            #define PI " + Math.PI + "\n            #define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))\n            #define setPosition(pos) (v_position = (((pos)+1.0)/2.0),gl_Position = vec4((pos), 0, 1))\n        "];
        var fsrc = ["\n            precision mediump float;\n            varying vec2 v_position;\n            uniform vec2 u_resolution;\n            uniform sampler2D u_srcTexture;\n\n            #define PI " + Math.PI + "\n            #define getSrcColorAtPos(pos) (texture2D(u_srcTexture, pos))\n            #define getSrcColor() (texture2D(u_srcTexture, v_position))\n        "];
        this.rctx = rctx;
        this.swapFrame = opts.swapFrame;
        this.copyOnSwap = opts.copyOnSwap;
        this.blendValue = opts.blendValue;
        this.blendMode = opts.blendMode;
        this.dynamicBlend = opts.dynamicBlend;
        if (this.dynamicBlend) {
            fsrc.push("\n                uniform int u_blendMode;\n                void setFragColor(vec4 color) {\n            ");
            each_1["default"](ShaderProgram.shaderBlendEq, function (eq, mode) {
                fsrc.push("\n                    if(u_blendMode == " + mode + ") {\n                        gl_FragColor = (" + eq + ");\n                    } else\n                ");
            });
            fsrc.push("\n                    {\n                        gl_FragColor = color;\n                    }\n                }\n            ");
        }
        else {
            if (this._isShaderBlend(this.blendMode)) {
                var eq = ShaderProgram.shaderBlendEq[this.blendMode];
                fsrc.push("#define setFragColor(color) (gl_FragColor = (" + eq + "))");
            }
            else {
                fsrc.push("#define setFragColor(color) (gl_FragColor = color)");
            }
        }
        this.drawHook = opts.drawHook;
        this.vertexSrc = vsrc.join("\n") + "\n";
        if (opts.vertexShader) {
            this.vertexSrc += utils_1.flatString(opts.vertexShader);
        }
        else {
            this.vertexSrc += "\n                attribute vec2 a_position;\n                void main() {\n                   setPosition(a_position);\n                }\n            ";
            var oldDrawHook_1 = this.drawHook;
            this.drawHook = function (values, gl, shader) {
                if (oldDrawHook_1) {
                    oldDrawHook_1(values, gl, shader);
                }
                _this.setAttrib("a_position", geometries_1.squareGeometry(_this.rctx));
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            };
        }
        this.fragmentSrc = fsrc.join("\n") + "\n" + utils_1.flatString(opts.fragmentShader);
        this.locations = {};
        this.textureVars = [];
        this.enabledAttribs = [];
        this.bindings = opts.bindings || {};
        this._compile();
    }
    /**
     * Runs the shader program
     * @param tsm the texture set in which the rendering will be made
     * @param values an object containing values for variables specified in the bindings
     * @param blendMode the blendMode for this render
     * @param blendValue blendValue when blendMode is `ADJUSTABLE`
     */
    ShaderProgram.prototype.run = function (tsm, values, blendMode, blendValue) {
        if (blendMode === void 0) { blendMode = null; }
        if (blendValue === void 0) { blendValue = null; }
        var gl = this.rctx.getGl();
        var oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        gl.useProgram(this.program);
        if (blendMode && !this.dynamicBlend) {
            throw new Error("Cannot set blendmode at runtime. Use dynamicBlend");
        }
        blendMode = blendMode || this.blendMode;
        blendValue = typeof (blendValue) === "number" ? blendValue : this.blendValue;
        if (tsm) {
            this.setUniform("u_resolution", utils_1.WebGLVarType._2F, gl.drawingBufferWidth, gl.drawingBufferHeight);
            if (this.swapFrame || this._isShaderBlend(blendMode)) {
                this.setUniform("u_srcTexture", utils_1.WebGLVarType.TEXTURE2D, tsm.getCurrentTexture());
                tsm.switchTexture();
                if (this.copyOnSwap) {
                    tsm.copyOver();
                }
            }
            else if (this.dynamicBlend) {
                this.setUniform("u_srcTexture", utils_1.WebGLVarType.TEXTURE2D, null);
            }
        }
        if (this.dynamicBlend) {
            this.setUniform("u_blendMode", utils_1.WebGLVarType._1I, blendMode);
        }
        this._setGlBlendMode(blendMode, blendValue);
        this.draw(values);
        // disable all enabled attributes
        while (this.enabledAttribs.length) {
            gl.disableVertexAttribArray(this.enabledAttribs.shift());
        }
        gl.disable(gl.BLEND);
        gl.useProgram(oldProgram);
    };
    /**
     * Returns the location of a uniform or attribute.
     *
     * Locations are cached
     * @param name name of the variable
     * @param attrib if true then name is assumed to be an attribute
     */
    ShaderProgram.prototype.getLocation = function (name, attrib) {
        if (attrib === void 0) { attrib = false; }
        var location = this.locations[name];
        if (typeof location === "undefined") {
            var gl = this.rctx.getGl();
            if (attrib) {
                location = gl.getAttribLocation(this.program, name);
            }
            else {
                location = gl.getUniformLocation(this.program, name);
            }
            this.locations[name] = location;
        }
        return location;
    };
    /**
     * Returns the index of a texture. Assigns id if not already assigned.
     * @param name name of the texture
     */
    ShaderProgram.prototype.getTextureId = function (name) {
        var id = indexOf_1["default"](this.textureVars, name);
        if (id === -1) {
            this.textureVars.push(name);
            id = this.textureVars.length - 1;
        }
        return id;
    };
    /**
     * Binds value of a uniform variable in this program.
     * @param name name of the uniforma variable
     * @param type type of the value
     * @param values value(s) to be bound
     */
    ShaderProgram.prototype.setUniform = function (name, type) {
        var values = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            values[_i - 2] = arguments[_i];
        }
        var location = this.getLocation(name);
        var gl = this.rctx.getGl();
        switch (type) {
            case "texture2D":
                var id = this.getTextureId(name);
                gl.activeTexture(gl["TEXTURE" + id]);
                gl.bindTexture(gl.TEXTURE_2D, values[0]);
                gl.uniform1i(location, id);
                break;
            case "1f":
            case "2f":
            case "3f":
            case "4f":
            case "1i":
            case "2i":
            case "3i":
            case "4i":
                gl["uniform" + type].apply(gl, [location].concat(values));
                break;
            case "1fv":
            case "2fv":
            case "3fv":
            case "4fv":
            case "1iv":
            case "2iv":
            case "3iv":
            case "4iv":
                var value = values[0];
                if (!(value instanceof Float32Array)) {
                    value = new Float32Array(value);
                }
                gl["uniform" + type].call(gl, location, value);
                break;
        }
    };
    /**
     * Binds given buffer as the `ELEMENT_ARRAY_BUFFER`
     * @param buffer buffer to be bound as index
     */
    ShaderProgram.prototype.setIndex = function (buffer) {
        var gl = this.rctx.getGl();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.getGlBuffer());
    };
    /**
     * Binds an attribute buffer and sets up vertex pointer
     * @param name name of the attribute
     * @param buffer buffer to be bound
     * @param size size of values
     * @param type type of values
     * @param normalized enables normalization for integers
     * @param stride array value stride
     * @param offset offset of first value
     */
    ShaderProgram.prototype.setAttrib = function (name, buffer, size, type, normalized, stride, offset) {
        if (size === void 0) { size = 2; }
        if (type === void 0) { type = this.rctx.getGl().FLOAT; }
        if (normalized === void 0) { normalized = false; }
        if (stride === void 0) { stride = 0; }
        if (offset === void 0) { offset = 0; }
        var gl = this.rctx.getGl();
        var location = this.getLocation(name, true);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.getGlBuffer());
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
        gl.enableVertexAttribArray(location);
        this.enabledAttribs.push(location);
    };
    ShaderProgram.prototype.disableAttrib = function (name) {
        var location = this.getLocation(name, true);
        this.rctx.getGl().disableVertexAttribArray(location);
    };
    /**
     * Destroys all webgl resources
     */
    ShaderProgram.prototype.destroy = function () {
        var gl = this.rctx.getGl();
        gl.deleteProgram(this.program);
        gl.deleteShader(this.vertex);
        gl.deleteShader(this.fragment);
    };
    ShaderProgram.prototype._isShaderBlend = function (mode) {
        return (mode in ShaderProgram.shaderBlendEq);
    };
    ShaderProgram.prototype._compile = function () {
        var gl = this.rctx.getGl();
        var vertex = this._compileShader(this.vertexSrc, gl.VERTEX_SHADER);
        var fragment = this._compileShader(this.fragmentSrc, gl.FRAGMENT_SHADER);
        var program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error("Program link Error: " + gl.getProgramInfoLog(program));
        }
        this.vertex = vertex;
        this.fragment = fragment;
        this.program = program;
    };
    ShaderProgram.prototype._compileShader = function (shaderSrc, type) {
        var gl = this.rctx.getGl();
        var shader = gl.createShader(type);
        gl.shaderSource(shader, shaderSrc);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            utils_1.logShaderError(shaderSrc, gl.getShaderInfoLog(shader));
            throw new Error("Shader compilation Error: " + gl.getShaderInfoLog(shader));
        }
        return shader;
    };
    ShaderProgram.prototype.draw = function (values) {
        var errorIfNotBuffer = function (value, valueName) {
            if (value instanceof Buffer_1["default"]) {
                return value;
            }
            else {
                throw new Error("Value \"" + valueName + "\" should be a Buffer");
            }
        };
        // bind variables
        var isElements = false;
        var drawMode = null;
        var drawCount = null;
        for (var bindingType in this.bindings) {
            if (bindingType === "index") {
                var defn = this.bindings[bindingType];
                var valueName = defn.valueName;
                var value = values[valueName];
                var indexBuffer = errorIfNotBuffer(value, valueName);
                this.setIndex(indexBuffer);
                if (defn.drawMode) {
                    drawCount = indexBuffer.getLength();
                    drawMode = defn.drawMode;
                    isElements = true;
                }
            }
            else {
                for (var valueName in this.bindings[bindingType]) {
                    if (!this.bindings[bindingType].hasOwnProperty(valueName)) {
                        continue;
                    }
                    var value = values[valueName];
                    if (bindingType === "attribs") {
                        var defn = this.bindings[bindingType][valueName];
                        if (!value) {
                            this.disableAttrib(defn.name);
                        }
                        else {
                            var attribBuffer = errorIfNotBuffer(value, valueName);
                            this.setAttrib(defn.name, attribBuffer, defn.size, defn.valueType, defn.normalized, defn.stride, defn.offset);
                            if (defn.drawMode) {
                                drawCount = attribBuffer.getLength() / (defn.size || 2);
                                drawMode = defn.drawMode;
                            }
                        }
                    }
                    else if (bindingType === "uniforms") {
                        var defn = this.bindings[bindingType][valueName];
                        this.setUniform(defn.name, defn.valueType, value);
                    }
                }
            }
        }
        var gl = this.rctx.getGl();
        var drawHandled = false;
        if (this.drawHook) {
            drawHandled = !this.drawHook(values, gl, this);
        }
        if (!drawHandled) {
            if (drawMode !== null) {
                if (isElements) {
                    gl.drawElements(drawMode, drawCount, gl.UNSIGNED_SHORT, 0);
                }
                else {
                    gl.drawArrays(drawMode, 0, drawCount);
                }
            }
            else {
                throw new Error("Draw unhandled and no bindings containing drawMode.");
            }
        }
    };
    ShaderProgram.prototype._setGlBlendMode = function (mode, blendValue) {
        var gl = this.rctx.getGl();
        switch (mode) {
            case utils_1.BlendMode.ADDITIVE:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case utils_1.BlendMode.SUBTRACTIVE1:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
                break;
            case utils_1.BlendMode.SUBTRACTIVE2:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_SUBTRACT);
                break;
            case utils_1.BlendMode.ALPHA:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case utils_1.BlendMode.MULTIPLY2:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.DST_COLOR, gl.ZERO);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case utils_1.BlendMode.ADJUSTABLE:
                gl.enable(gl.BLEND);
                gl.blendColor(0, 0, 0, blendValue);
                gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            case utils_1.BlendMode.AVERAGE:
                gl.enable(gl.BLEND);
                gl.blendColor(0.5, 0.5, 0.5, 1);
                gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);
                gl.blendEquation(gl.FUNC_ADD);
                break;
            // shader blending cases
            case utils_1.BlendMode.REPLACE:
            case utils_1.BlendMode.MULTIPLY:
            case utils_1.BlendMode.MAXIMUM:
                gl.disable(gl.BLEND);
                break;
            default:
                throw new Error("Unknown blend mode " + mode + " in shader");
        }
    };
    // these are blend modes not supported with gl.BLEND
    // and the formula to be used inside shader
    ShaderProgram.shaderBlendEq = (_a = {},
        _a[utils_1.BlendMode.MAXIMUM] = "max(color, texture2D(u_srcTexture, v_position))",
        _a[utils_1.BlendMode.MULTIPLY] = "clamp(color * texture2D(u_srcTexture, v_position) * 256.0, 0.0, 1.0)",
        _a);
    return ShaderProgram;
}());
exports["default"] = ShaderProgram;
var _a;


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__freeGlobal_js__ = __webpack_require__(87);


/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = __WEBPACK_IMPORTED_MODULE_0__freeGlobal_js__["a" /* default */] || freeSelf || Function('return this')();

/* harmony default export */ __webpack_exports__["a"] = (root);


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/* harmony default export */ __webpack_exports__["a"] = (isObjectLike);


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/* harmony default export */ __webpack_exports__["a"] = (isObject);


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (arrayMap);


/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Symbol_js__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getRawTag_js__ = __webpack_require__(155);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__objectToString_js__ = __webpack_require__(156);




/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */].toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? Object(__WEBPACK_IMPORTED_MODULE_1__getRawTag_js__["a" /* default */])(value)
    : Object(__WEBPACK_IMPORTED_MODULE_2__objectToString_js__["a" /* default */])(value);
}

/* harmony default export */ __webpack_exports__["a"] = (baseGetTag);


/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__identity_js__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__overRest_js__ = __webpack_require__(101);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__setToString_js__ = __webpack_require__(69);




/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return Object(__WEBPACK_IMPORTED_MODULE_2__setToString_js__["a" /* default */])(Object(__WEBPACK_IMPORTED_MODULE_1__overRest_js__["a" /* default */])(func, start, __WEBPACK_IMPORTED_MODULE_0__identity_js__["a" /* default */]), func + '');
}

/* harmony default export */ __webpack_exports__["a"] = (baseRest);


/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseIsNative_js__ = __webpack_require__(153);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getValue_js__ = __webpack_require__(159);



/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = Object(__WEBPACK_IMPORTED_MODULE_1__getValue_js__["a" /* default */])(object, key);
  return Object(__WEBPACK_IMPORTED_MODULE_0__baseIsNative_js__["a" /* default */])(value) ? value : undefined;
}

/* harmony default export */ __webpack_exports__["a"] = (getNative);


/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayLikeKeys_js__ = __webpack_require__(91);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseKeys_js__ = __webpack_require__(176);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isArrayLike_js__ = __webpack_require__(17);




/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return Object(__WEBPACK_IMPORTED_MODULE_2__isArrayLike_js__["a" /* default */])(object) ? Object(__WEBPACK_IMPORTED_MODULE_0__arrayLikeKeys_js__["a" /* default */])(object) : Object(__WEBPACK_IMPORTED_MODULE_1__baseKeys_js__["a" /* default */])(object);
}

/* harmony default export */ __webpack_exports__["default"] = (keys);


/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__forEach_js__ = __webpack_require__(244);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return __WEBPACK_IMPORTED_MODULE_0__forEach_js__["a"]; });



/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayMap_js__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseIteratee_js__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__baseMap_js__ = __webpack_require__(123);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isArray_js__ = __webpack_require__(1);





/**
 * Creates an array of values by running each element in `collection` thru
 * `iteratee`. The iteratee is invoked with three arguments:
 * (value, index|key, collection).
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
 *
 * The guarded methods are:
 * `ary`, `chunk`, `curry`, `curryRight`, `drop`, `dropRight`, `every`,
 * `fill`, `invert`, `parseInt`, `random`, `range`, `rangeRight`, `repeat`,
 * `sampleSize`, `slice`, `some`, `sortBy`, `split`, `take`, `takeRight`,
 * `template`, `trim`, `trimEnd`, `trimStart`, and `words`
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 * @example
 *
 * function square(n) {
 *   return n * n;
 * }
 *
 * _.map([4, 8], square);
 * // => [16, 64]
 *
 * _.map({ 'a': 4, 'b': 8 }, square);
 * // => [16, 64] (iteration order is not guaranteed)
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // The `_.property` iteratee shorthand.
 * _.map(users, 'user');
 * // => ['barney', 'fred']
 */
function map(collection, iteratee) {
  var func = Object(__WEBPACK_IMPORTED_MODULE_3__isArray_js__["default"])(collection) ? __WEBPACK_IMPORTED_MODULE_0__arrayMap_js__["a" /* default */] : __WEBPACK_IMPORTED_MODULE_2__baseMap_js__["a" /* default */];
  return func(collection, Object(__WEBPACK_IMPORTED_MODULE_1__baseIteratee_js__["a" /* default */])(iteratee, 3));
}

/* harmony default export */ __webpack_exports__["default"] = (map);


/***/ }),
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__root_js__ = __webpack_require__(4);


/** Built-in value references. */
var Symbol = __WEBPACK_IMPORTED_MODULE_0__root_js__["a" /* default */].Symbol;

/* harmony default export */ __webpack_exports__["a"] = (Symbol);


/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__assignValue_js__ = __webpack_require__(53);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseAssignValue_js__ = __webpack_require__(89);



/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      Object(__WEBPACK_IMPORTED_MODULE_1__baseAssignValue_js__["a" /* default */])(object, key, newValue);
    } else {
      Object(__WEBPACK_IMPORTED_MODULE_0__assignValue_js__["a" /* default */])(object, key, newValue);
    }
  }
  return object;
}

/* harmony default export */ __webpack_exports__["a"] = (copyObject);


/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

/* harmony default export */ __webpack_exports__["a"] = (baseUnary);


/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isFunction_js__ = __webpack_require__(50);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isLength_js__ = __webpack_require__(58);



/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && Object(__WEBPACK_IMPORTED_MODULE_1__isLength_js__["a" /* default */])(value.length) && !Object(__WEBPACK_IMPORTED_MODULE_0__isFunction_js__["default"])(value);
}

/* harmony default export */ __webpack_exports__["a"] = (isArrayLike);


/***/ }),
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

/* harmony default export */ __webpack_exports__["a"] = (identity);


/***/ }),
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isArray_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isKey_js__ = __webpack_require__(71);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__stringToPath_js__ = __webpack_require__(200);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__toString_js__ = __webpack_require__(105);





/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value, object) {
  if (Object(__WEBPACK_IMPORTED_MODULE_0__isArray_js__["default"])(value)) {
    return value;
  }
  return Object(__WEBPACK_IMPORTED_MODULE_1__isKey_js__["a" /* default */])(value, object) ? [value] : Object(__WEBPACK_IMPORTED_MODULE_2__stringToPath_js__["a" /* default */])(Object(__WEBPACK_IMPORTED_MODULE_3__toString_js__["a" /* default */])(value));
}

/* harmony default export */ __webpack_exports__["a"] = (castPath);


/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isSymbol_js__ = __webpack_require__(25);


/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || Object(__WEBPACK_IMPORTED_MODULE_0__isSymbol_js__["a" /* default */])(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/* harmony default export */ __webpack_exports__["a"] = (toKey);


/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__toFinite_js__ = __webpack_require__(262);


/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */
function toInteger(value) {
  var result = Object(__WEBPACK_IMPORTED_MODULE_0__toFinite_js__["a" /* default */])(value),
      remainder = result % 1;

  return result === result ? (remainder ? result - remainder : result) : 0;
}

/* harmony default export */ __webpack_exports__["a"] = (toInteger);


/***/ }),
/* 22 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/* harmony default export */ __webpack_exports__["a"] = (eq);


/***/ }),
/* 23 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;

  return !!length &&
    (type == 'number' ||
      (type != 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
}

/* harmony default export */ __webpack_exports__["a"] = (isIndex);


/***/ }),
/* 24 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseRest_js__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__eq_js__ = __webpack_require__(22);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isIterateeCall_js__ = __webpack_require__(70);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__keysIn_js__ = __webpack_require__(34);





/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Assigns own and inherited enumerable string keyed properties of source
 * objects to the destination object for all destination properties that
 * resolve to `undefined`. Source objects are applied from left to right.
 * Once a property is set, additional values of the same property are ignored.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.defaultsDeep
 * @example
 *
 * _.defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
 * // => { 'a': 1, 'b': 2 }
 */
var defaults = Object(__WEBPACK_IMPORTED_MODULE_0__baseRest_js__["a" /* default */])(function(object, sources) {
  object = Object(object);

  var index = -1;
  var length = sources.length;
  var guard = length > 2 ? sources[2] : undefined;

  if (guard && Object(__WEBPACK_IMPORTED_MODULE_2__isIterateeCall_js__["a" /* default */])(sources[0], sources[1], guard)) {
    length = 1;
  }

  while (++index < length) {
    var source = sources[index];
    var props = Object(__WEBPACK_IMPORTED_MODULE_3__keysIn_js__["a" /* default */])(source);
    var propsIndex = -1;
    var propsLength = props.length;

    while (++propsIndex < propsLength) {
      var key = props[propsIndex];
      var value = object[key];

      if (value === undefined ||
          (Object(__WEBPACK_IMPORTED_MODULE_1__eq_js__["a" /* default */])(value, objectProto[key]) && !hasOwnProperty.call(object, key))) {
        object[key] = source[key];
      }
    }
  }

  return object;
});

/* harmony default export */ __webpack_exports__["default"] = (defaults);


/***/ }),
/* 25 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__ = __webpack_require__(5);



/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (Object(__WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__["a" /* default */])(value) && Object(__WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__["a" /* default */])(value) == symbolTag);
}

/* harmony default export */ __webpack_exports__["a"] = (isSymbol);


/***/ }),
/* 26 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayPush_js__ = __webpack_require__(64);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isFlattenable_js__ = __webpack_require__(206);



/**
 * The base implementation of `_.flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {number} depth The maximum recursion depth.
 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1,
      length = array.length;

  predicate || (predicate = __WEBPACK_IMPORTED_MODULE_1__isFlattenable_js__["a" /* default */]);
  result || (result = []);

  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        Object(__WEBPACK_IMPORTED_MODULE_0__arrayPush_js__["a" /* default */])(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (baseFlatten);


/***/ }),
/* 27 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseMatches_js__ = __webpack_require__(232);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseMatchesProperty_js__ = __webpack_require__(235);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__identity_js__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isArray_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__property_js__ = __webpack_require__(237);






/**
 * The base implementation of `_.iteratee`.
 *
 * @private
 * @param {*} [value=_.identity] The value to convert to an iteratee.
 * @returns {Function} Returns the iteratee.
 */
function baseIteratee(value) {
  // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
  // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
  if (typeof value == 'function') {
    return value;
  }
  if (value == null) {
    return __WEBPACK_IMPORTED_MODULE_2__identity_js__["a" /* default */];
  }
  if (typeof value == 'object') {
    return Object(__WEBPACK_IMPORTED_MODULE_3__isArray_js__["default"])(value)
      ? Object(__WEBPACK_IMPORTED_MODULE_1__baseMatchesProperty_js__["a" /* default */])(value[0], value[1])
      : Object(__WEBPACK_IMPORTED_MODULE_0__baseMatches_js__["a" /* default */])(value);
  }
  return Object(__WEBPACK_IMPORTED_MODULE_4__property_js__["a" /* default */])(value);
}

/* harmony default export */ __webpack_exports__["a"] = (baseIteratee);


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
var difference_1 = __webpack_require__(239);
var each_1 = __webpack_require__(12);
var flatten_1 = __webpack_require__(38);
var flow_1 = __webpack_require__(117);
var intersection_1 = __webpack_require__(249);
var isArray_1 = __webpack_require__(1);
var isEqual_1 = __webpack_require__(108);
var isNumber_1 = __webpack_require__(122);
var keys_1 = __webpack_require__(11);
var map_1 = __webpack_require__(13);
var partialRight_1 = __webpack_require__(124);
var pick_1 = __webpack_require__(103);
var takeRight_1 = __webpack_require__(83);
var union_1 = __webpack_require__(264);
var uniq_1 = __webpack_require__(133);
var values_1 = __webpack_require__(266);
var utils_1 = __webpack_require__(0);
var Ast = __webpack_require__(134);
var CodeInstance_1 = __webpack_require__(84);
var ExprGrammar_pegjs_1 = __webpack_require__(273);
function compileExpr(codeSrc, jsFuncs, glslFuncs, nonUniforms) {
    if (jsFuncs === void 0) { jsFuncs = []; }
    if (glslFuncs === void 0) { glslFuncs = []; }
    if (nonUniforms === void 0) { nonUniforms = []; }
    var codeStrings = {};
    for (var name_1 in codeSrc) {
        if (!codeSrc.hasOwnProperty(name_1)) {
            continue;
        }
        var codeString = codeSrc[name_1];
        if (isArray_1["default"](codeString)) {
            codeString = codeString.join("\n");
        }
        codeString.trim();
        if (codeString.length === 0) {
            continue;
        }
        codeStrings[name_1] = codeString;
    }
    // 1) Parse the code
    var codeAst = parseCode(codeStrings);
    // 2) Process the AST
    var tables = processAst(codeAst, jsFuncs, glslFuncs, nonUniforms);
    // 3) Generate code
    var codeInst = generateJs(codeAst, tables, jsFuncs);
    var glslCode = generateGlsl(codeAst, tables, glslFuncs);
    return { codeInst: codeInst, glslCode: glslCode };
}
exports["default"] = compileExpr;
function parseCode(codeSrc) {
    var codeAst = {}; // abstract syntax tree
    for (var name_2 in codeSrc) {
        if (!codeSrc.hasOwnProperty(name_2)) {
            continue;
        }
        try {
            codeAst[name_2] = ExprGrammar_pegjs_1.parse(codeSrc[name_2]);
        }
        catch (e) {
            throw new Error("Error parsing " + name_2 + " (" + e.line + ":" + e.column + ")" + " : " + e);
        }
    }
    return codeAst;
}
function isStaticExprList(exprs) {
    return exprs.every(function (expr) {
        return expr instanceof Ast.PrimaryExpr;
    });
}
function processAst(codeAst, jsFuncs, glslFuncs, extraNonUniforms) {
    var funcCall = {};
    var variable = {};
    var register = {};
    var preCompute = {};
    var preComputeCounter = 0;
    var processNode = function (ast, name) {
        if (ast instanceof Ast.Program) {
            for (var _i = 0, _a = ast.statements; _i < _a.length; _i++) {
                var statement = _a[_i];
                processNode(statement, name);
            }
        }
        else if (ast instanceof Ast.BinaryExpr) {
            processNode(ast.leftOperand, name);
            processNode(ast.rightOperand, name);
        }
        else if (ast instanceof Ast.UnaryExpr) {
            processNode(ast.operand, name);
        }
        else if (ast instanceof Ast.FuncCall) {
            checkFunc(ast);
            // if its a precomputable function to be generated in glsl
            // then build a table entry
            if (glslFuncs.indexOf(name) >= 0 && glslPreComputeFuncs.indexOf(ast.funcName) >= 0) {
                var args = ast.args;
                if (!isStaticExprList(args)) {
                    throw new Error("Non Pre-Computable arguments for " + ast.funcName + " in shader code, use variables or constants");
                }
                var entry = [ast.funcName].concat(map_1["default"](args, function (arg) { return arg.value; }));
                var uniformName = void 0;
                for (var key in preCompute) {
                    if (isEqual_1["default"](preCompute[key], entry)) {
                        uniformName = key;
                        break;
                    }
                }
                if (!uniformName) {
                    uniformName = "__PC_" + ast.funcName + "_" + preComputeCounter++;
                    preCompute[uniformName] = entry;
                }
                ast.preComputeUniformName = uniformName;
            }
            funcCall[name].push(ast.funcName);
            for (var _b = 0, _c = ast.args; _b < _c.length; _b++) {
                var arg = _c[_b];
                processNode(arg, name);
            }
        }
        else if (ast instanceof Ast.Assignment) {
            processNode(ast.lhs, name);
            processNode(ast.expr, name);
        }
        else if (ast instanceof Ast.PrimaryExpr && ast.type === "ID") {
            variable[name].push(ast.value);
        }
        else if (ast instanceof Ast.PrimaryExpr && ast.type === "REG") {
            register[name].push(ast.value);
        }
    };
    for (var name_3 in codeAst) {
        if (!codeAst.hasOwnProperty(name_3)) {
            continue;
        }
        funcCall[name_3] = [];
        variable[name_3] = [];
        register[name_3] = [];
        processNode(codeAst[name_3], name_3);
        funcCall[name_3] = uniq_1["default"](funcCall[name_3]);
        variable[name_3] = uniq_1["default"](variable[name_3]);
        register[name_3] = uniq_1["default"](register[name_3]);
    }
    var jsVars = flow_1["default"]([partialRight_1["default"](pick_1["default"], jsFuncs), values_1["default"], flatten_1["default"], uniq_1["default"]])(variable);
    var glslVars = flow_1["default"]([partialRight_1["default"](pick_1["default"], glslFuncs), values_1["default"], flatten_1["default"], uniq_1["default"]])(variable);
    var nonUniforms = flow_1["default"]([partialRight_1["default"](difference_1["default"], jsVars), partialRight_1["default"](union_1["default"], extraNonUniforms), uniq_1["default"]])(glslVars);
    var uniforms = intersection_1["default"](glslVars, jsVars);
    var glslUsedFuncs = flow_1["default"]([partialRight_1["default"](pick_1["default"], glslFuncs), values_1["default"], flatten_1["default"], uniq_1["default"]])(funcCall);
    var glslRegisters = flow_1["default"]([partialRight_1["default"](pick_1["default"], glslFuncs), values_1["default"], flatten_1["default"], uniq_1["default"]])(register);
    return {
        glslRegisters: glslRegisters, glslUsedFuncs: glslUsedFuncs, glslVars: glslVars, jsVars: jsVars, nonUniforms: nonUniforms, preCompute: preCompute, register: register, uniforms: uniforms
    };
}
function generateJs(codeAst, tables, jsFuncs) {
    var generateNode = function (ast) {
        if (ast instanceof Ast.BinaryExpr) {
            return "(" + generateNode(ast.leftOperand) + ast.operator + generateNode(ast.rightOperand) + ")";
        }
        if (ast instanceof Ast.UnaryExpr) {
            return "(" + ast.operator + generateNode(ast.operand) + ")";
        }
        if (ast instanceof Ast.FuncCall) {
            switch (ast.funcName) {
                case "above":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        ">",
                        generateNode(ast.args[1]),
                        "?1:0)",
                    ].join("");
                case "below":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "<",
                        generateNode(ast.args[1]),
                        "?1:0)",
                    ].join("");
                case "equal":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "==",
                        generateNode(ast.args[1]),
                        "?1:0)",
                    ].join("");
                case "if":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "!==0?",
                        generateNode(ast.args[1]),
                        ":",
                        generateNode(ast.args[2]),
                        ")",
                    ].join("");
                case "select":
                    var code_1 = ["((function() {"];
                    code_1.push("switch(" + generateNode(ast.args[0]) + ") {");
                    each_1["default"](takeRight_1["default"](ast.args, ast.args.length - 1), function (arg, i) {
                        code_1.push("case " + i + ": return " + generateNode(arg) + ";");
                    });
                    code_1.push("default : throw new Error('Unknown selector value in select');");
                    code_1.push("}}).call(this))");
                    return code_1.join("");
                case "sqr":
                    return "(Math.pow((" + generateNode(ast.args[0]) + "),2))";
                case "band":
                    return "(((" + generateNode(ast.args[0]) + ")&&(" + generateNode(ast.args[1]) + "))?1:0)";
                case "bor":
                    return "(((" + generateNode(ast.args[0]) + ")||(" + generateNode(ast.args[1]) + "))?1:0)";
                case "bnot":
                    return "((!(" + generateNode(ast.args[0]) + "))?1:0)";
                case "invsqrt":
                    return "(1/Math.sqrt(" + generateNode(ast.args[0]) + "))";
                case "atan2":
                    return "(Math.atan((" + generateNode(ast.args[0]) + ")/(" + generateNode(ast.args[1]) + ")))";
                default:
                    var prefix = void 0;
                    var args = map_1["default"](ast.args, function (arg) { return generateNode(arg); }).join(",");
                    if (jsMathFuncs.indexOf(ast.funcName) >= 0) {
                        prefix = "Math.";
                    }
                    else {
                        prefix = "this.";
                    }
                    return "(" + prefix + ast.funcName + "(" + args + "))";
            }
        }
        if (ast instanceof Ast.Assignment) {
            return generateNode(ast.lhs) + "=" + generateNode(ast.expr);
        }
        if (ast instanceof Ast.Program) {
            var stmts = map_1["default"](ast.statements, function (stmt) { return generateNode(stmt); });
            return stmts.join(";\n");
        }
        if (ast instanceof Ast.PrimaryExpr && ast.type === "VALUE") {
            return ast.value.toString();
        }
        if (ast instanceof Ast.PrimaryExpr && ast.type === "CONST") {
            return translateConstants(ast.value).toString();
        }
        if (ast instanceof Ast.PrimaryExpr && ast.type === "ID") {
            return "this." + ast.value;
        }
        if (ast instanceof Ast.PrimaryExpr && ast.type === "REG") {
            return "this.registerBank[\"" + ast.value + "\"]";
        }
    };
    var registerUsages = flow_1["default"]([values_1["default"], flatten_1["default"], uniq_1["default"]])(tables.register);
    var hasRandom = tables.glslUsedFuncs.indexOf("rand") >= 0;
    var codeInst = new CodeInstance_1["default"](registerUsages, tables.glslRegisters, hasRandom, tables.uniforms, tables.preCompute);
    // clear all variables
    for (var _i = 0, _a = tables.jsVars; _i < _a.length; _i++) {
        var jsVar = _a[_i];
        codeInst[jsVar] = 0;
    }
    // generate code
    for (var _b = 0, jsFuncs_1 = jsFuncs; _b < jsFuncs_1.length; _b++) {
        var name_4 = jsFuncs_1[_b];
        var ast = codeAst[name_4];
        if (ast) {
            var jsCodeString = generateNode(ast);
            codeInst[name_4] = new Function(jsCodeString);
        }
        else {
            codeInst[name_4] = utils_1.noop;
        }
    }
    return codeInst;
}
function generateGlsl(codeAst, tables, glslFuncs) {
    var generateNode = function (ast) {
        if (ast instanceof Ast.BinaryExpr) {
            return "(" + generateNode(ast.leftOperand) + ast.operator + generateNode(ast.rightOperand) + ")";
        }
        if (ast instanceof Ast.UnaryExpr) {
            return "(" + ast.operator + generateNode(ast.operand) + ")";
        }
        if (ast instanceof Ast.FuncCall) {
            if (ast.preComputeUniformName) {
                return "(" + ast.preComputeUniformName + ")";
            }
            switch (ast.funcName) {
                case "above":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        ">",
                        generateNode(ast.args[1]),
                        "?1.0:0.0)",
                    ].join("");
                case "below":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "<",
                        generateNode(ast.args[1]),
                        "?1.0:0.0)",
                    ].join("");
                case "equal":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "==",
                        generateNode(ast.args[1]),
                        "?1.0:0.0)",
                    ].join("");
                case "if":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "!=0.0?",
                        generateNode(ast.args[1]),
                        ":",
                        generateNode(ast.args[2]),
                        ")",
                    ].join("");
                case "select": {
                    var selectExpr_1 = generateNode(ast.args[0]);
                    var generateSelect_1 = function (args, i) {
                        if (args.length === 1) {
                            return generateNode(args[0]);
                        }
                        else {
                            return [
                                "((" + selectExpr_1 + " === " + i + ")?",
                                "(" + generateNode(args[0]) + "):",
                                "(" + generateSelect_1(takeRight_1["default"](args, args.length - 1), i + 1) + "))",
                            ].join("");
                        }
                    };
                    return generateSelect_1(takeRight_1["default"](ast.args, ast.args.length - 1), 0);
                }
                case "sqr":
                    return "(pow((" + generateNode(ast.args[0]) + "), 2))";
                case "band":
                    return "(float((" + generateNode(ast.args[0]) + ")&&(" + generateNode(ast.args[1]) + ")))";
                case "bor":
                    return "(float((" + generateNode(ast.args[0]) + ")||(" + generateNode(ast.args[1]) + ")))";
                case "bnot":
                    return "(float(!(" + generateNode(ast.args[0]) + ")))";
                case "invsqrt":
                    return "(1/sqrt(" + generateNode(ast.args[0]) + "))";
                case "atan2":
                    return "(atan((" + generateNode(ast.args[0]) + "),(" + generateNode(ast.args[1]) + "))";
                default: {
                    var args = map_1["default"](ast.args, function (arg) { return generateNode(arg); }).join(",");
                    return "(" + ast.funcName + "(" + args + "))";
                }
            }
        }
        if (ast instanceof Ast.Assignment) {
            return generateNode(ast.lhs) + "=" + generateNode(ast.expr);
        }
        if (ast instanceof Ast.Program) {
            var stmts = map_1["default"](ast.statements, function (stmt) { return generateNode(stmt); });
            return stmts.join(";\n") + ";";
        }
        if (ast instanceof Ast.PrimaryExpr && ast.type === "VALUE") {
            return utils_1.glslFloatRepr(ast.value);
        }
        if (ast instanceof Ast.PrimaryExpr && ast.type === "CONST") {
            return translateConstants(ast.value).toString();
        }
        if (ast instanceof Ast.PrimaryExpr && (ast.type === "ID" || ast.type === "REG")) {
            return ast.value;
        }
    };
    var glslCode = [];
    // glsl variable declarations
    glslCode = glslCode.concat(map_1["default"](tables.nonUniforms, function (name) {
        return "float " + name + " = 0.0;";
    }));
    glslCode = glslCode.concat(map_1["default"](tables.uniforms, function (name) {
        return "uniform float " + name + ";";
    }));
    // include required functions in glsl
    glslCode = glslCode.concat(flow_1["default"]([
        partialRight_1["default"](map_1["default"], function (name) {
            return ((name in glslFuncCode) ? (glslFuncCode[name]) : []);
        }),
        flatten_1["default"],
    ])(tables.glslUsedFuncs));
    // declarations for precomputed functions
    glslCode = glslCode.concat(flow_1["default"]([
        keys_1["default"],
        partialRight_1["default"](map_1["default"], function (name) {
            return "uniform float " + name + ";";
        }),
    ])(tables.preCompute));
    // add the functions
    for (var _i = 0, glslFuncs_1 = glslFuncs; _i < glslFuncs_1.length; _i++) {
        var name_5 = glslFuncs_1[_i];
        var ast = codeAst[name_5];
        if (ast) {
            var codeString = generateNode(ast);
            glslCode.push("void " + name_5 + "() {");
            glslCode.push(codeString);
            glslCode.push("}");
        }
        else {
            glslCode.push("void " + name_5 + "() {}");
        }
    }
    return glslCode.join("\n");
}
var funcArgLengths = {
    above: 2,
    abs: 1,
    acos: 1,
    asin: 1,
    atan: 1,
    atan2: 2,
    band: 2,
    below: 2,
    bnot: 1,
    bor: 2,
    ceil: 1,
    cos: 1,
    equal: 2,
    floor: 1,
    getosc: 3,
    gettime: 1,
    "if": 3,
    invsqrt: 1,
    log: 1,
    max: 2,
    min: 2,
    pow: 2,
    rand: 1,
    select: {
        min: 2
    },
    sin: 1,
    sqr: 1,
    sqrt: 1,
    tan: 1
};
var jsMathFuncs = [
    "min", "max", "sin", "cos", "abs", "tan", "asin", "acos",
    "atan", "log", "pow", "sqrt", "floor", "ceil",
];
var glslPreComputeFuncs = ["getosc", "gettime"];
var glslFuncCode = {
    rand: [
        "uniform vec2 __randStep;",
        "vec2 __randSeed;",
        "float rand(float max) {",
        "   __randSeed += __randStep;",
        "   float val = fract(sin(dot(__randSeed.xy ,vec2(12.9898,78.233))) * 43758.5453);",
        "   return (floor(val*max)+1);",
        "}",
    ].join("\n")
};
function checkFunc(ast) {
    var requiredArgLength = funcArgLengths[ast.funcName];
    if (requiredArgLength === undefined) {
        throw Error("Unknown function " + ast.funcName);
    }
    if (isNumber_1["default"](requiredArgLength)) {
        if (ast.args.length !== requiredArgLength) {
            throw Error(ast.funcName + " accepts " + requiredArgLength + " arguments");
        }
    }
    else if (requiredArgLength.min) {
        if (ast.args.length < requiredArgLength.min) {
            throw Error(ast.funcName + " accepts atleast " + requiredArgLength.min + " arguments");
        }
    }
}
function translateConstants(value) {
    switch (value) {
        case "pi": return Math.PI;
        case "e": return Math.E;
        case "phi": return 1.6180339887;
        default: throw new Error("Unknown constant " + value);
    }
}


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
var utils_1 = __webpack_require__(0);
/**
 * Buffer is a wrapper around WebGLBuffer with type and size information.
 */
var Buffer = /** @class */ (function () {
    /**
     * Creates new Buffer
     *
     * @param rctx the rendering context in which the buffer should be created
     * @param isElemArray if true then a `gl.ELEMENT_ARRAY_BUFFER` is created else a `gl.ARRAY_BUFFER`
     * @param data the data to be stored in the buffer
     */
    function Buffer(rctx, isElemArray, data) {
        if (isElemArray === void 0) { isElemArray = false; }
        var gl = rctx.getGl();
        this.type = isElemArray ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
        this.rctx = rctx;
        this.glBuffer = gl.createBuffer();
        this.length = 0;
        if (data) {
            this.setData(data);
        }
    }
    /**
     * Sets the data stored in the buffer
     *
     * @param array the data to be stored in the buffer
     */
    Buffer.prototype.setData = function (array) {
        if (!utils_1.isTypedArray(array)) {
            array = new Float32Array(array);
        }
        var gl = this.rctx.getGl();
        this.length = array.length;
        gl.bindBuffer(this.type, this.glBuffer);
        gl.bufferData(this.type, array, gl.STATIC_DRAW);
    };
    /**
     * Returns the WebGLBuffer for this Buffer
     */
    Buffer.prototype.getGlBuffer = function () {
        return this.glBuffer;
    };
    /**
     * Returns the length of the data
     */
    Buffer.prototype.getLength = function () {
        return this.length;
    };
    /**
     * Destroys the buffer
     */
    Buffer.prototype.destroy = function () {
        this.rctx.getGl().deleteBuffer(this.glBuffer);
    };
    return Buffer;
}());
exports["default"] = Buffer;


/***/ }),
/* 30 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__listCacheClear_js__ = __webpack_require__(143);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__listCacheDelete_js__ = __webpack_require__(144);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__listCacheGet_js__ = __webpack_require__(145);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__listCacheHas_js__ = __webpack_require__(146);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__listCacheSet_js__ = __webpack_require__(147);






/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = __WEBPACK_IMPORTED_MODULE_0__listCacheClear_js__["a" /* default */];
ListCache.prototype['delete'] = __WEBPACK_IMPORTED_MODULE_1__listCacheDelete_js__["a" /* default */];
ListCache.prototype.get = __WEBPACK_IMPORTED_MODULE_2__listCacheGet_js__["a" /* default */];
ListCache.prototype.has = __WEBPACK_IMPORTED_MODULE_3__listCacheHas_js__["a" /* default */];
ListCache.prototype.set = __WEBPACK_IMPORTED_MODULE_4__listCacheSet_js__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (ListCache);


/***/ }),
/* 31 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__eq_js__ = __webpack_require__(22);


/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (Object(__WEBPACK_IMPORTED_MODULE_0__eq_js__["a" /* default */])(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/* harmony default export */ __webpack_exports__["a"] = (assocIndexOf);


/***/ }),
/* 32 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getNative_js__ = __webpack_require__(10);


/* Built-in method references that are verified to be native. */
var nativeCreate = Object(__WEBPACK_IMPORTED_MODULE_0__getNative_js__["a" /* default */])(Object, 'create');

/* harmony default export */ __webpack_exports__["a"] = (nativeCreate);


/***/ }),
/* 33 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isKeyable_js__ = __webpack_require__(168);


/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return Object(__WEBPACK_IMPORTED_MODULE_0__isKeyable_js__["a" /* default */])(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/* harmony default export */ __webpack_exports__["a"] = (getMapData);


/***/ }),
/* 34 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayLikeKeys_js__ = __webpack_require__(91);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseKeysIn_js__ = __webpack_require__(179);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isArrayLike_js__ = __webpack_require__(17);




/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  return Object(__WEBPACK_IMPORTED_MODULE_2__isArrayLike_js__["a" /* default */])(object) ? Object(__WEBPACK_IMPORTED_MODULE_0__arrayLikeKeys_js__["a" /* default */])(object, true) : Object(__WEBPACK_IMPORTED_MODULE_1__baseKeysIn_js__["a" /* default */])(object);
}

/* harmony default export */ __webpack_exports__["a"] = (keysIn);


/***/ }),
/* 35 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__DataView_js__ = __webpack_require__(184);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Map_js__ = __webpack_require__(49);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Promise_js__ = __webpack_require__(185);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__Set_js__ = __webpack_require__(98);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__WeakMap_js__ = __webpack_require__(99);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__baseGetTag_js__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__toSource_js__ = __webpack_require__(88);








/** `Object#toString` result references. */
var mapTag = '[object Map]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    setTag = '[object Set]',
    weakMapTag = '[object WeakMap]';

var dataViewTag = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = Object(__WEBPACK_IMPORTED_MODULE_6__toSource_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_0__DataView_js__["a" /* default */]),
    mapCtorString = Object(__WEBPACK_IMPORTED_MODULE_6__toSource_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_1__Map_js__["a" /* default */]),
    promiseCtorString = Object(__WEBPACK_IMPORTED_MODULE_6__toSource_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_2__Promise_js__["a" /* default */]),
    setCtorString = Object(__WEBPACK_IMPORTED_MODULE_6__toSource_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_3__Set_js__["a" /* default */]),
    weakMapCtorString = Object(__WEBPACK_IMPORTED_MODULE_6__toSource_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_4__WeakMap_js__["a" /* default */]);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = __WEBPACK_IMPORTED_MODULE_5__baseGetTag_js__["a" /* default */];

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((__WEBPACK_IMPORTED_MODULE_0__DataView_js__["a" /* default */] && getTag(new __WEBPACK_IMPORTED_MODULE_0__DataView_js__["a" /* default */](new ArrayBuffer(1))) != dataViewTag) ||
    (__WEBPACK_IMPORTED_MODULE_1__Map_js__["a" /* default */] && getTag(new __WEBPACK_IMPORTED_MODULE_1__Map_js__["a" /* default */]) != mapTag) ||
    (__WEBPACK_IMPORTED_MODULE_2__Promise_js__["a" /* default */] && getTag(__WEBPACK_IMPORTED_MODULE_2__Promise_js__["a" /* default */].resolve()) != promiseTag) ||
    (__WEBPACK_IMPORTED_MODULE_3__Set_js__["a" /* default */] && getTag(new __WEBPACK_IMPORTED_MODULE_3__Set_js__["a" /* default */]) != setTag) ||
    (__WEBPACK_IMPORTED_MODULE_4__WeakMap_js__["a" /* default */] && getTag(new __WEBPACK_IMPORTED_MODULE_4__WeakMap_js__["a" /* default */]) != weakMapTag)) {
  getTag = function(value) {
    var result = Object(__WEBPACK_IMPORTED_MODULE_5__baseGetTag_js__["a" /* default */])(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? Object(__WEBPACK_IMPORTED_MODULE_6__toSource_js__["a" /* default */])(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

/* harmony default export */ __webpack_exports__["a"] = (getTag);


/***/ }),
/* 36 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isObject_js__ = __webpack_require__(6);


/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!Object(__WEBPACK_IMPORTED_MODULE_0__isObject_js__["a" /* default */])(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object;
    object.prototype = undefined;
    return result;
  };
}());

/* harmony default export */ __webpack_exports__["a"] = (baseCreate);


/***/ }),
/* 37 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__castPath_js__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__toKey_js__ = __webpack_require__(20);



/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = Object(__WEBPACK_IMPORTED_MODULE_0__castPath_js__["a" /* default */])(path, object);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[Object(__WEBPACK_IMPORTED_MODULE_1__toKey_js__["a" /* default */])(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

/* harmony default export */ __webpack_exports__["a"] = (baseGet);


/***/ }),
/* 38 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseFlatten_js__ = __webpack_require__(26);


/**
 * Flattens `array` a single level deep.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to flatten.
 * @returns {Array} Returns the new flattened array.
 * @example
 *
 * _.flatten([1, [2, [3, [4]], 5]]);
 * // => [1, 2, [3, [4]], 5]
 */
function flatten(array) {
  var length = array == null ? 0 : array.length;
  return length ? Object(__WEBPACK_IMPORTED_MODULE_0__baseFlatten_js__["a" /* default */])(array, 1) : [];
}

/* harmony default export */ __webpack_exports__["default"] = (flatten);


/***/ }),
/* 39 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__MapCache_js__ = __webpack_require__(51);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__setCacheAdd_js__ = __webpack_require__(213);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__setCacheHas_js__ = __webpack_require__(214);




/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new __WEBPACK_IMPORTED_MODULE_0__MapCache_js__["a" /* default */];
  while (++index < length) {
    this.add(values[index]);
  }
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = __WEBPACK_IMPORTED_MODULE_1__setCacheAdd_js__["a" /* default */];
SetCache.prototype.has = __WEBPACK_IMPORTED_MODULE_2__setCacheHas_js__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (SetCache);


/***/ }),
/* 40 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

/* harmony default export */ __webpack_exports__["a"] = (cacheHas);


/***/ }),
/* 41 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (baseSlice);


/***/ }),
/* 42 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseForOwn_js__ = __webpack_require__(228);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__createBaseEach_js__ = __webpack_require__(231);



/**
 * The base implementation of `_.forEach` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 */
var baseEach = Object(__WEBPACK_IMPORTED_MODULE_1__createBaseEach_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_0__baseForOwn_js__["a" /* default */]);

/* harmony default export */ __webpack_exports__["a"] = (baseEach);


/***/ }),
/* 43 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseIndexOf_js__ = __webpack_require__(115);


/**
 * A specialized version of `_.includes` for arrays without support for
 * specifying an index to search from.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludes(array, value) {
  var length = array == null ? 0 : array.length;
  return !!length && Object(__WEBPACK_IMPORTED_MODULE_0__baseIndexOf_js__["a" /* default */])(array, value, 0) > -1;
}

/* harmony default export */ __webpack_exports__["a"] = (arrayIncludes);


/***/ }),
/* 44 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isArrayLike_js__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__ = __webpack_require__(5);



/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return Object(__WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__["a" /* default */])(value) && Object(__WEBPACK_IMPORTED_MODULE_0__isArrayLike_js__["a" /* default */])(value);
}

/* harmony default export */ __webpack_exports__["a"] = (isArrayLikeObject);


/***/ }),
/* 45 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseCreate_js__ = __webpack_require__(36);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isObject_js__ = __webpack_require__(6);



/**
 * Creates a function that produces an instance of `Ctor` regardless of
 * whether it was invoked as part of a `new` expression or by `call` or `apply`.
 *
 * @private
 * @param {Function} Ctor The constructor to wrap.
 * @returns {Function} Returns the new wrapped function.
 */
function createCtor(Ctor) {
  return function() {
    // Use a `switch` statement to work with class constructors. See
    // http://ecma-international.org/ecma-262/7.0/#sec-ecmascript-function-objects-call-thisargument-argumentslist
    // for more details.
    var args = arguments;
    switch (args.length) {
      case 0: return new Ctor;
      case 1: return new Ctor(args[0]);
      case 2: return new Ctor(args[0], args[1]);
      case 3: return new Ctor(args[0], args[1], args[2]);
      case 4: return new Ctor(args[0], args[1], args[2], args[3]);
      case 5: return new Ctor(args[0], args[1], args[2], args[3], args[4]);
      case 6: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
      case 7: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
    }
    var thisBinding = Object(__WEBPACK_IMPORTED_MODULE_0__baseCreate_js__["a" /* default */])(Ctor.prototype),
        result = Ctor.apply(thisBinding, args);

    // Mimic the constructor's `return` behavior.
    // See https://es5.github.io/#x13.2.2 for more details.
    return Object(__WEBPACK_IMPORTED_MODULE_1__isObject_js__["a" /* default */])(result) ? result : thisBinding;
  };
}

/* harmony default export */ __webpack_exports__["a"] = (createCtor);


/***/ }),
/* 46 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used as the internal argument placeholder. */
var PLACEHOLDER = '__lodash_placeholder__';

/**
 * Replaces all `placeholder` elements in `array` with an internal placeholder
 * and returns an array of their indexes.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {*} placeholder The placeholder to replace.
 * @returns {Array} Returns the new array of placeholder indexes.
 */
function replaceHolders(array, placeholder) {
  var index = -1,
      length = array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (value === placeholder || value === PLACEHOLDER) {
      array[index] = PLACEHOLDER;
      result[resIndex++] = index;
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (replaceHolders);


/***/ }),
/* 47 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseClone_js__ = __webpack_require__(86);


/** Used to compose bitmasks for cloning. */
var CLONE_SYMBOLS_FLAG = 4;

/**
 * Creates a shallow clone of `value`.
 *
 * **Note:** This method is loosely based on the
 * [structured clone algorithm](https://mdn.io/Structured_clone_algorithm)
 * and supports cloning arrays, array buffers, booleans, date objects, maps,
 * numbers, `Object` objects, regexes, sets, strings, symbols, and typed
 * arrays. The own enumerable properties of `arguments` objects are cloned
 * as plain objects. An empty object is returned for uncloneable values such
 * as error objects, functions, DOM nodes, and WeakMaps.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to clone.
 * @returns {*} Returns the cloned value.
 * @see _.cloneDeep
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var shallow = _.clone(objects);
 * console.log(shallow[0] === objects[0]);
 * // => true
 */
function clone(value) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__baseClone_js__["a" /* default */])(value, CLONE_SYMBOLS_FLAG);
}

/* harmony default export */ __webpack_exports__["default"] = (clone);


/***/ }),
/* 48 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ListCache_js__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__stackClear_js__ = __webpack_require__(148);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__stackDelete_js__ = __webpack_require__(149);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__stackGet_js__ = __webpack_require__(150);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__stackHas_js__ = __webpack_require__(151);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__stackSet_js__ = __webpack_require__(152);







/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new __WEBPACK_IMPORTED_MODULE_0__ListCache_js__["a" /* default */](entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = __WEBPACK_IMPORTED_MODULE_1__stackClear_js__["a" /* default */];
Stack.prototype['delete'] = __WEBPACK_IMPORTED_MODULE_2__stackDelete_js__["a" /* default */];
Stack.prototype.get = __WEBPACK_IMPORTED_MODULE_3__stackGet_js__["a" /* default */];
Stack.prototype.has = __WEBPACK_IMPORTED_MODULE_4__stackHas_js__["a" /* default */];
Stack.prototype.set = __WEBPACK_IMPORTED_MODULE_5__stackSet_js__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (Stack);


/***/ }),
/* 49 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getNative_js__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__root_js__ = __webpack_require__(4);



/* Built-in method references that are verified to be native. */
var Map = Object(__WEBPACK_IMPORTED_MODULE_0__getNative_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_1__root_js__["a" /* default */], 'Map');

/* harmony default export */ __webpack_exports__["a"] = (Map);


/***/ }),
/* 50 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isObject_js__ = __webpack_require__(6);



/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!Object(__WEBPACK_IMPORTED_MODULE_1__isObject_js__["a" /* default */])(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = Object(__WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__["a" /* default */])(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

/* harmony default export */ __webpack_exports__["default"] = (isFunction);


/***/ }),
/* 51 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__mapCacheClear_js__ = __webpack_require__(160);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__mapCacheDelete_js__ = __webpack_require__(167);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__mapCacheGet_js__ = __webpack_require__(169);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__mapCacheHas_js__ = __webpack_require__(170);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__mapCacheSet_js__ = __webpack_require__(171);






/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = __WEBPACK_IMPORTED_MODULE_0__mapCacheClear_js__["a" /* default */];
MapCache.prototype['delete'] = __WEBPACK_IMPORTED_MODULE_1__mapCacheDelete_js__["a" /* default */];
MapCache.prototype.get = __WEBPACK_IMPORTED_MODULE_2__mapCacheGet_js__["a" /* default */];
MapCache.prototype.has = __WEBPACK_IMPORTED_MODULE_3__mapCacheHas_js__["a" /* default */];
MapCache.prototype.set = __WEBPACK_IMPORTED_MODULE_4__mapCacheSet_js__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (MapCache);


/***/ }),
/* 52 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

/* harmony default export */ __webpack_exports__["a"] = (arrayEach);


/***/ }),
/* 53 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseAssignValue_js__ = __webpack_require__(89);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__eq_js__ = __webpack_require__(22);



/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty.call(object, key) && Object(__WEBPACK_IMPORTED_MODULE_1__eq_js__["a" /* default */])(objValue, value)) ||
      (value === undefined && !(key in object))) {
    Object(__WEBPACK_IMPORTED_MODULE_0__baseAssignValue_js__["a" /* default */])(object, key, value);
  }
}

/* harmony default export */ __webpack_exports__["a"] = (assignValue);


/***/ }),
/* 54 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (baseTimes);


/***/ }),
/* 55 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseIsArguments_js__ = __webpack_require__(173);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__ = __webpack_require__(5);



/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = Object(__WEBPACK_IMPORTED_MODULE_0__baseIsArguments_js__["a" /* default */])(function() { return arguments; }()) ? __WEBPACK_IMPORTED_MODULE_0__baseIsArguments_js__["a" /* default */] : function(value) {
  return Object(__WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__["a" /* default */])(value) && hasOwnProperty.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

/* harmony default export */ __webpack_exports__["a"] = (isArguments);


/***/ }),
/* 56 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__root_js__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__stubFalse_js__ = __webpack_require__(174);



/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? __WEBPACK_IMPORTED_MODULE_0__root_js__["a" /* default */].Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || __WEBPACK_IMPORTED_MODULE_1__stubFalse_js__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (isBuffer);

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(57)(module)))

/***/ }),
/* 57 */
/***/ (function(module, exports) {

module.exports = function(originalModule) {
	if(!originalModule.webpackPolyfill) {
		var module = Object.create(originalModule);
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		Object.defineProperty(module, "exports", {
			enumerable: true,
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 58 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/* harmony default export */ __webpack_exports__["a"] = (isLength);


/***/ }),
/* 59 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__freeGlobal_js__ = __webpack_require__(87);


/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && __WEBPACK_IMPORTED_MODULE_0__freeGlobal_js__["a" /* default */].process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

/* harmony default export */ __webpack_exports__["a"] = (nodeUtil);

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(57)(module)))

/***/ }),
/* 60 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

/* harmony default export */ __webpack_exports__["a"] = (isPrototype);


/***/ }),
/* 61 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

/* harmony default export */ __webpack_exports__["a"] = (copyArray);


/***/ }),
/* 62 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayFilter_js__ = __webpack_require__(63);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__stubArray_js__ = __webpack_require__(94);



/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? __WEBPACK_IMPORTED_MODULE_1__stubArray_js__["a" /* default */] : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return Object(__WEBPACK_IMPORTED_MODULE_0__arrayFilter_js__["a" /* default */])(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};

/* harmony default export */ __webpack_exports__["a"] = (getSymbols);


/***/ }),
/* 63 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (arrayFilter);


/***/ }),
/* 64 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/* harmony default export */ __webpack_exports__["a"] = (arrayPush);


/***/ }),
/* 65 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__overArg_js__ = __webpack_require__(93);


/** Built-in value references. */
var getPrototype = Object(__WEBPACK_IMPORTED_MODULE_0__overArg_js__["a" /* default */])(Object.getPrototypeOf, Object);

/* harmony default export */ __webpack_exports__["a"] = (getPrototype);


/***/ }),
/* 66 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGetAllKeys_js__ = __webpack_require__(97);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getSymbolsIn_js__ = __webpack_require__(95);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__keysIn_js__ = __webpack_require__(34);




/**
 * Creates an array of own and inherited enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeysIn(object) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__baseGetAllKeys_js__["a" /* default */])(object, __WEBPACK_IMPORTED_MODULE_2__keysIn_js__["a" /* default */], __WEBPACK_IMPORTED_MODULE_1__getSymbolsIn_js__["a" /* default */]);
}

/* harmony default export */ __webpack_exports__["a"] = (getAllKeysIn);


/***/ }),
/* 67 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Uint8Array_js__ = __webpack_require__(100);


/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new __WEBPACK_IMPORTED_MODULE_0__Uint8Array_js__["a" /* default */](result).set(new __WEBPACK_IMPORTED_MODULE_0__Uint8Array_js__["a" /* default */](arrayBuffer));
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (cloneArrayBuffer);


/***/ }),
/* 68 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

/* harmony default export */ __webpack_exports__["a"] = (apply);


/***/ }),
/* 69 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseSetToString_js__ = __webpack_require__(197);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__shortOut_js__ = __webpack_require__(102);



/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = Object(__WEBPACK_IMPORTED_MODULE_1__shortOut_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_0__baseSetToString_js__["a" /* default */]);

/* harmony default export */ __webpack_exports__["a"] = (setToString);


/***/ }),
/* 70 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__eq_js__ = __webpack_require__(22);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isArrayLike_js__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isIndex_js__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isObject_js__ = __webpack_require__(6);





/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!Object(__WEBPACK_IMPORTED_MODULE_3__isObject_js__["a" /* default */])(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (Object(__WEBPACK_IMPORTED_MODULE_1__isArrayLike_js__["a" /* default */])(object) && Object(__WEBPACK_IMPORTED_MODULE_2__isIndex_js__["a" /* default */])(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return Object(__WEBPACK_IMPORTED_MODULE_0__eq_js__["a" /* default */])(object[index], value);
  }
  return false;
}

/* harmony default export */ __webpack_exports__["a"] = (isIterateeCall);


/***/ }),
/* 71 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isArray_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isSymbol_js__ = __webpack_require__(25);



/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (Object(__WEBPACK_IMPORTED_MODULE_0__isArray_js__["default"])(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || Object(__WEBPACK_IMPORTED_MODULE_1__isSymbol_js__["a" /* default */])(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

/* harmony default export */ __webpack_exports__["a"] = (isKey);


/***/ }),
/* 72 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__flatten_js__ = __webpack_require__(38);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__overRest_js__ = __webpack_require__(101);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__setToString_js__ = __webpack_require__(69);




/**
 * A specialized version of `baseRest` which flattens the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @returns {Function} Returns the new function.
 */
function flatRest(func) {
  return Object(__WEBPACK_IMPORTED_MODULE_2__setToString_js__["a" /* default */])(Object(__WEBPACK_IMPORTED_MODULE_1__overRest_js__["a" /* default */])(func, undefined, __WEBPACK_IMPORTED_MODULE_0__flatten_js__["default"]), func + '');
}

/* harmony default export */ __webpack_exports__["a"] = (flatRest);


/***/ }),
/* 73 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isArray_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isObjectLike_js__ = __webpack_require__(5);




/** `Object#toString` result references. */
var stringTag = '[object String]';

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a string, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' ||
    (!Object(__WEBPACK_IMPORTED_MODULE_1__isArray_js__["default"])(value) && Object(__WEBPACK_IMPORTED_MODULE_2__isObjectLike_js__["a" /* default */])(value) && Object(__WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__["a" /* default */])(value) == stringTag);
}

/* harmony default export */ __webpack_exports__["default"] = (isString);


/***/ }),
/* 74 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseIsEqualDeep_js__ = __webpack_require__(212);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__ = __webpack_require__(5);



/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!Object(__WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__["a" /* default */])(value) && !Object(__WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__["a" /* default */])(other))) {
    return value !== value && other !== other;
  }
  return Object(__WEBPACK_IMPORTED_MODULE_0__baseIsEqualDeep_js__["a" /* default */])(value, other, bitmask, customizer, baseIsEqual, stack);
}

/* harmony default export */ __webpack_exports__["a"] = (baseIsEqual);


/***/ }),
/* 75 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (setToArray);


/***/ }),
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var EventEmitter = __webpack_require__(225);
var filter_1 = __webpack_require__(226);
/**
 * Model is a base for Model-Like objects.
 *
 * Model provides some event-model and general attribute management
 * facilities. Model basically provides getter, setter methods for
 * attributes and an event subscription system to notify of attribute
 * changes or other custom events. Model is used mainly by Components
 * to model component options and thus allow editors to treat each
 * component as a Data Model object to drive user interface.
 */
var Model = /** @class */ (function (_super) {
    __extends(Model, _super);
    function Model() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.subscriptions = [];
        return _this;
    }
    /**
     * Safely set an attribute(s).
     *
     * If the attribute set succeeds, a `change:[attribute name]` event is fired.
     * `change:[attribute name]` event handler receives `this` object, the new `value`
     * and `options` as arguments.
     *
     * Additionally a `change` event is also fired when all changes succeed. The `change`
     * event receives `this` object and the `options` as arguments.
     *
     * @param key the name of the attribute or map of values
     * @param value the new value of the attribute
     * @param options this object is sent down to the event handlers, useful to things down to your
     * handler. if `options.silent` is true then events are not fired.
     */
    Model.prototype.set = function (key, value, options) {
        var success;
        if (typeof (key) === "string") {
            options = options || {};
            var silent = typeof (options.silent) === "undefined" ? true : false;
            success = this.setAttribute(key, value, options);
            if (success && !silent) {
                this.emit("change:" + key, this, value, options);
                this.emit("change", this, options);
            }
        }
        else {
            // if map of key values are passed
            // then set each value separately
            options = value || {};
            var silent = typeof (options.silent) === "undefined" ? true : false;
            var keyValueMap = key;
            success = false;
            for (key in keyValueMap) {
                if (this.setAttribute(key, keyValueMap[key], options)) {
                    success = true;
                    if (!silent) {
                        this.emit("change:" + key, this, keyValueMap[key], options);
                    }
                }
            }
            if (success && !silent) {
                this.emit("change", this, options);
            }
        }
        return success;
    };
    /**
     * Add a listener to another EventEmitter.
     *
     * This provides an event subscription list facility. Allowing
     * subclasses to listen to other emitters and remove all or some listeners
     * with a single call to [[Model.stopListening]], later.
     *
     * @param emitter the event emitter to listen to
     * @param event the name of the event to listen to
     * @param callback the callback for the event handler
     */
    Model.prototype.listenTo = function (emitter, event, callback) {
        emitter.addListener(event, callback);
        this.subscriptions.push({ emitter: emitter, event: event, callback: callback });
    };
    /**
     * Removes to one or more listeners that were set earlier with calls to [[Model.listenTo]].
     *
     * Use the arguments to filter subscriptions. eg: `model.stopListening(em)` will remove all
     * listeners on emitter `em`. `model.stopListening(em, 'change')` will remove all listeners for
     * `change` event on emitter `em`.
     *
     * @param emitter the event emitter on which the listener was set
     * @param event the event to be removed
     * @param callback the callback to be removed
     */
    Model.prototype.stopListening = function (emitter, event, callback) {
        var subFilter = {};
        if (emitter) {
            subFilter.emitter = emitter;
        }
        if (event) {
            subFilter.event = event;
        }
        if (emitter) {
            subFilter.callback = callback;
        }
        var subs = filter_1["default"](this.subscriptions, subFilter);
        subs.forEach(function (sub) {
            sub.emitter.removeListener(sub.event, sub.callback);
        });
    };
    return Model;
}(EventEmitter));
exports["default"] = Model;


/***/ }),
/* 77 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * This function is like `arrayIncludes` except that it accepts a comparator.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @param {Function} comparator The comparator invoked per element.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludesWith(array, value, comparator) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (comparator(value, array[index])) {
      return true;
    }
  }
  return false;
}

/* harmony default export */ __webpack_exports__["a"] = (arrayIncludesWith);


/***/ }),
/* 78 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseCreate_js__ = __webpack_require__(36);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseLodash_js__ = __webpack_require__(79);



/**
 * The base constructor for creating `lodash` wrapper objects.
 *
 * @private
 * @param {*} value The value to wrap.
 * @param {boolean} [chainAll] Enable explicit method chain sequences.
 */
function LodashWrapper(value, chainAll) {
  this.__wrapped__ = value;
  this.__actions__ = [];
  this.__chain__ = !!chainAll;
  this.__index__ = 0;
  this.__values__ = undefined;
}

LodashWrapper.prototype = Object(__WEBPACK_IMPORTED_MODULE_0__baseCreate_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_1__baseLodash_js__["a" /* default */].prototype);
LodashWrapper.prototype.constructor = LodashWrapper;

/* harmony default export */ __webpack_exports__["a"] = (LodashWrapper);


/***/ }),
/* 79 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * The function whose prototype chain sequence wrappers inherit from.
 *
 * @private
 */
function baseLodash() {
  // No operation performed.
}

/* harmony default export */ __webpack_exports__["a"] = (baseLodash);


/***/ }),
/* 80 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__metaMap_js__ = __webpack_require__(118);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__noop_js__ = __webpack_require__(119);



/**
 * Gets metadata for `func`.
 *
 * @private
 * @param {Function} func The function to query.
 * @returns {*} Returns the metadata for `func`.
 */
var getData = !__WEBPACK_IMPORTED_MODULE_0__metaMap_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_1__noop_js__["a" /* default */] : function(func) {
  return __WEBPACK_IMPORTED_MODULE_0__metaMap_js__["a" /* default */].get(func);
};

/* harmony default export */ __webpack_exports__["a"] = (getData);


/***/ }),
/* 81 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseCreate_js__ = __webpack_require__(36);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseLodash_js__ = __webpack_require__(79);



/** Used as references for the maximum length and index of an array. */
var MAX_ARRAY_LENGTH = 4294967295;

/**
 * Creates a lazy wrapper object which wraps `value` to enable lazy evaluation.
 *
 * @private
 * @constructor
 * @param {*} value The value to wrap.
 */
function LazyWrapper(value) {
  this.__wrapped__ = value;
  this.__actions__ = [];
  this.__dir__ = 1;
  this.__filtered__ = false;
  this.__iteratees__ = [];
  this.__takeCount__ = MAX_ARRAY_LENGTH;
  this.__views__ = [];
}

// Ensure `LazyWrapper` is an instance of `baseLodash`.
LazyWrapper.prototype = Object(__WEBPACK_IMPORTED_MODULE_0__baseCreate_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_1__baseLodash_js__["a" /* default */].prototype);
LazyWrapper.prototype.constructor = LazyWrapper;

/* harmony default export */ __webpack_exports__["a"] = (LazyWrapper);


/***/ }),
/* 82 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Gets the argument placeholder value for `func`.
 *
 * @private
 * @param {Function} func The function to inspect.
 * @returns {*} Returns the placeholder value.
 */
function getHolder(func) {
  var object = func;
  return object.placeholder;
}

/* harmony default export */ __webpack_exports__["a"] = (getHolder);


/***/ }),
/* 83 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseSlice_js__ = __webpack_require__(41);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__toInteger_js__ = __webpack_require__(21);



/**
 * Creates a slice of `array` with `n` elements taken from the end.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Array
 * @param {Array} array The array to query.
 * @param {number} [n=1] The number of elements to take.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
 * @returns {Array} Returns the slice of `array`.
 * @example
 *
 * _.takeRight([1, 2, 3]);
 * // => [3]
 *
 * _.takeRight([1, 2, 3], 2);
 * // => [2, 3]
 *
 * _.takeRight([1, 2, 3], 5);
 * // => [1, 2, 3]
 *
 * _.takeRight([1, 2, 3], 0);
 * // => []
 */
function takeRight(array, n, guard) {
  var length = array == null ? 0 : array.length;
  if (!length) {
    return [];
  }
  n = (guard || n === undefined) ? 1 : Object(__WEBPACK_IMPORTED_MODULE_1__toInteger_js__["a" /* default */])(n);
  n = length - n;
  return Object(__WEBPACK_IMPORTED_MODULE_0__baseSlice_js__["a" /* default */])(array, n < 0 ? 0 : n, length);
}

/* harmony default export */ __webpack_exports__["default"] = (takeRight);


/***/ }),
/* 84 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
var drop_1 = __webpack_require__(268);
var each_1 = __webpack_require__(12);
var extend_1 = __webpack_require__(135);
var has_1 = __webpack_require__(271);
var isArray_1 = __webpack_require__(1);
var isFunction_1 = __webpack_require__(50);
var isString_1 = __webpack_require__(73);
var map_1 = __webpack_require__(13);
var take_1 = __webpack_require__(136);
var times_1 = __webpack_require__(137);
var utils_1 = __webpack_require__(0);
// An object that encapsulates the generated executable code
// and its state values. Also contains implementations of
// functions callable from expressions
var CodeInstance = /** @class */ (function () {
    function CodeInstance(registerUsages, glslRegisters, hasRandom, uniforms, preCompute) {
        this.registerUsages = registerUsages;
        this.glslRegisters = glslRegisters;
        this.hasRandom = hasRandom;
        this.uniforms = uniforms;
        this.preCompute = preCompute;
    }
    // creates an array of clones of code instances
    CodeInstance.clone = function (cloneOrClones, count) {
        var clones;
        if (!isArray_1["default"](cloneOrClones)) {
            cloneOrClones.cid = 0;
            clones = [cloneOrClones];
        }
        else {
            clones = cloneOrClones;
        }
        var clonesLength = clones.length;
        if (clonesLength < count) {
            times_1["default"](count - clonesLength, function (index) {
                var clone = Object.create(CodeInstance.prototype);
                extend_1["default"](clone, clones[0]);
                clone.cid = index + clonesLength;
                clones.push(clone);
            });
        }
        else if (clonesLength > count) {
            clones = take_1["default"](clones, count);
        }
        return clones;
    };
    // copies instance values from one code instance to another
    CodeInstance.copyValues = function (dest, src) {
        each_1["default"](src, function (value, name) {
            if (!isFunction_1["default"](value) && name.charAt(0) !== "_") {
                dest[name] = value;
            }
        });
    };
    // avs expression rand function
    CodeInstance.prototype.rand = function (max) {
        return Math.floor(Math.random() * max) + 1;
    };
    // avs expression gettime function
    CodeInstance.prototype.gettime = function (startTime) {
        switch (startTime) {
            case 0:
                var currentTime = (new Date()).getTime();
                return (currentTime - this.bootTime) / 1000;
            default: throw new Error("Invalid startTime mode for gettime call");
        }
    };
    // avs expression getosc function
    CodeInstance.prototype.getosc = function (band, width, channel) {
        var osc = this.analyser.getWaveform();
        var pos = Math.floor((band - width / 2) * (osc.length - 1));
        var end = Math.floor((band + width / 2) * (osc.length - 1));
        var sum = 0;
        for (var i = pos; i <= end; i++) {
            sum += osc[i];
        }
        return sum / (end - pos + 1);
    };
    // bind state values to uniforms
    CodeInstance.prototype.bindUniforms = function (program) {
        var _this = this;
        // bind all values
        each_1["default"](this.uniforms, function (name) {
            program.setUniform(name, utils_1.WebGLVarType._1F, _this[name]);
        });
        // bind registers
        each_1["default"](this.glslRegisters, function (name) {
            program.setUniform(name, utils_1.WebGLVarType._1F, _this.registerBank[name]);
        });
        // bind random step value if there are usages of random
        if (this.hasRandom) {
            var step = [Math.random() / 100, Math.random() / 100];
            program.setUniform("__randStep", utils_1.WebGLVarType._2FV, step);
        }
        // bind precomputed values
        each_1["default"](this.preCompute, function (entry, name) {
            var args = map_1["default"](drop_1["default"](entry), function (arg) {
                if (isString_1["default"](arg)) {
                    if (arg.substring(0, 5) === "__REG") {
                        return _this.registerBank[arg];
                    }
                    else {
                        return _this[arg];
                    }
                }
                else {
                    return arg;
                }
            });
            var result = _this[entry[0]].apply(_this, args);
            program.setUniform(name, utils_1.WebGLVarType._1F, result);
        });
    };
    // initializes this codeinstance
    CodeInstance.prototype.setup = function (main) {
        var _this = this;
        this.registerBank = main.getRegisterBank();
        this.bootTime = main.getBootTime();
        this.analyser = main.getAnalyser();
        this.updateDimVars(main.getRctx().getGl());
        // clear all used registers
        each_1["default"](this.registerUsages, function (name) {
            if (!has_1["default"](_this.registerBank, name)) {
                _this.registerBank[name] = 0;
            }
        });
    };
    CodeInstance.prototype.updateDimVars = function (gl) {
        this.w = gl.drawingBufferWidth;
        this.h = gl.drawingBufferHeight;
    };
    return CodeInstance;
}());
exports["default"] = CodeInstance;


/***/ }),
/* 85 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
var Buffer_1 = __webpack_require__(29);
/**
 * Returns a cached Buffer with points on a circle
 * @param rctx RenderingContext undef which the buffer will be created and cached
 * @param pointCount number of points in the geometry
 */
function circleGeometry(rctx, pointCount) {
    if (pointCount === void 0) { pointCount = 100; }
    var cacheKey = "CircleGeometry_" + pointCount;
    var buffer = rctx.getBuffer(cacheKey);
    if (buffer) {
        return buffer;
    }
    var points = new Float32Array((pointCount + 2) * 2);
    var pbi = 0;
    points[pbi++] = 0; // center
    points[pbi++] = 0;
    for (var i = 0; i < pointCount; i++) {
        points[pbi++] = Math.sin(i * 2 * Math.PI / pointCount);
        points[pbi++] = Math.cos(i * 2 * Math.PI / pointCount);
    }
    points[pbi++] = points[2]; // repeat last point again
    points[pbi++] = points[3];
    buffer = new Buffer_1["default"](rctx, false, points);
    rctx.cacheBuffer(cacheKey, buffer);
    return buffer;
}
exports.circleGeometry = circleGeometry;
/**
 * Returns a cached buffer with points on a square
 * @param rctx RenderingContext under which the buffer will be created and cached
 * @param positiveQuad if true then square will be in [0-1][0-1] range.
 */
function squareGeometry(rctx, positiveQuad) {
    if (positiveQuad === void 0) { positiveQuad = false; }
    var cacheKey = "SquareGeometry_" + positiveQuad;
    var buffer = rctx.getBuffer(cacheKey);
    if (buffer) {
        return buffer;
    }
    var points;
    if (positiveQuad) {
        points = [
            0, 0,
            0, 1,
            1, 1,
            0, 0,
            1, 1,
            1, 0,
        ];
    }
    else {
        points = [
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ];
    }
    buffer = new Buffer_1["default"](rctx, false, points);
    rctx.cacheBuffer(cacheKey, buffer);
    return buffer;
}
exports.squareGeometry = squareGeometry;


/***/ }),
/* 86 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Stack_js__ = __webpack_require__(48);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__arrayEach_js__ = __webpack_require__(52);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__assignValue_js__ = __webpack_require__(53);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__baseAssign_js__ = __webpack_require__(172);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__baseAssignIn_js__ = __webpack_require__(178);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__cloneBuffer_js__ = __webpack_require__(181);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__copyArray_js__ = __webpack_require__(61);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__copySymbols_js__ = __webpack_require__(182);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__copySymbolsIn_js__ = __webpack_require__(183);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__getAllKeys_js__ = __webpack_require__(96);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__getAllKeysIn_js__ = __webpack_require__(66);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__getTag_js__ = __webpack_require__(35);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__initCloneArray_js__ = __webpack_require__(186);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__initCloneByTag_js__ = __webpack_require__(187);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__initCloneObject_js__ = __webpack_require__(192);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__isArray_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_16__isBuffer_js__ = __webpack_require__(56);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_17__isMap_js__ = __webpack_require__(193);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_18__isObject_js__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_19__isSet_js__ = __webpack_require__(195);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_20__keys_js__ = __webpack_require__(11);






















/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1,
    CLONE_FLAT_FLAG = 2,
    CLONE_SYMBOLS_FLAG = 4;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] =
cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] =
cloneableTags[boolTag] = cloneableTags[dateTag] =
cloneableTags[float32Tag] = cloneableTags[float64Tag] =
cloneableTags[int8Tag] = cloneableTags[int16Tag] =
cloneableTags[int32Tag] = cloneableTags[mapTag] =
cloneableTags[numberTag] = cloneableTags[objectTag] =
cloneableTags[regexpTag] = cloneableTags[setTag] =
cloneableTags[stringTag] = cloneableTags[symbolTag] =
cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] =
cloneableTags[weakMapTag] = false;

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Deep clone
 *  2 - Flatten inherited properties
 *  4 - Clone symbols
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, bitmask, customizer, key, object, stack) {
  var result,
      isDeep = bitmask & CLONE_DEEP_FLAG,
      isFlat = bitmask & CLONE_FLAT_FLAG,
      isFull = bitmask & CLONE_SYMBOLS_FLAG;

  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!Object(__WEBPACK_IMPORTED_MODULE_18__isObject_js__["a" /* default */])(value)) {
    return value;
  }
  var isArr = Object(__WEBPACK_IMPORTED_MODULE_15__isArray_js__["default"])(value);
  if (isArr) {
    result = Object(__WEBPACK_IMPORTED_MODULE_12__initCloneArray_js__["a" /* default */])(value);
    if (!isDeep) {
      return Object(__WEBPACK_IMPORTED_MODULE_6__copyArray_js__["a" /* default */])(value, result);
    }
  } else {
    var tag = Object(__WEBPACK_IMPORTED_MODULE_11__getTag_js__["a" /* default */])(value),
        isFunc = tag == funcTag || tag == genTag;

    if (Object(__WEBPACK_IMPORTED_MODULE_16__isBuffer_js__["a" /* default */])(value)) {
      return Object(__WEBPACK_IMPORTED_MODULE_5__cloneBuffer_js__["a" /* default */])(value, isDeep);
    }
    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      result = (isFlat || isFunc) ? {} : Object(__WEBPACK_IMPORTED_MODULE_14__initCloneObject_js__["a" /* default */])(value);
      if (!isDeep) {
        return isFlat
          ? Object(__WEBPACK_IMPORTED_MODULE_8__copySymbolsIn_js__["a" /* default */])(value, Object(__WEBPACK_IMPORTED_MODULE_4__baseAssignIn_js__["a" /* default */])(result, value))
          : Object(__WEBPACK_IMPORTED_MODULE_7__copySymbols_js__["a" /* default */])(value, Object(__WEBPACK_IMPORTED_MODULE_3__baseAssign_js__["a" /* default */])(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = Object(__WEBPACK_IMPORTED_MODULE_13__initCloneByTag_js__["a" /* default */])(value, tag, isDeep);
    }
  }
  // Check for circular references and return its corresponding clone.
  stack || (stack = new __WEBPACK_IMPORTED_MODULE_0__Stack_js__["a" /* default */]);
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  if (Object(__WEBPACK_IMPORTED_MODULE_19__isSet_js__["a" /* default */])(value)) {
    value.forEach(function(subValue) {
      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
    });

    return result;
  }

  if (Object(__WEBPACK_IMPORTED_MODULE_17__isMap_js__["a" /* default */])(value)) {
    value.forEach(function(subValue, key) {
      result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
    });

    return result;
  }

  var keysFunc = isFull
    ? (isFlat ? __WEBPACK_IMPORTED_MODULE_10__getAllKeysIn_js__["a" /* default */] : __WEBPACK_IMPORTED_MODULE_9__getAllKeys_js__["a" /* default */])
    : (isFlat ? keysIn : __WEBPACK_IMPORTED_MODULE_20__keys_js__["default"]);

  var props = isArr ? undefined : keysFunc(value);
  Object(__WEBPACK_IMPORTED_MODULE_1__arrayEach_js__["a" /* default */])(props || value, function(subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    // Recursively populate clone (susceptible to call stack limits).
    Object(__WEBPACK_IMPORTED_MODULE_2__assignValue_js__["a" /* default */])(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
  });
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (baseClone);


/***/ }),
/* 87 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/* harmony default export */ __webpack_exports__["a"] = (freeGlobal);

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(154)))

/***/ }),
/* 88 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/* harmony default export */ __webpack_exports__["a"] = (toSource);


/***/ }),
/* 89 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__defineProperty_js__ = __webpack_require__(90);


/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && __WEBPACK_IMPORTED_MODULE_0__defineProperty_js__["a" /* default */]) {
    Object(__WEBPACK_IMPORTED_MODULE_0__defineProperty_js__["a" /* default */])(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

/* harmony default export */ __webpack_exports__["a"] = (baseAssignValue);


/***/ }),
/* 90 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getNative_js__ = __webpack_require__(10);


var defineProperty = (function() {
  try {
    var func = Object(__WEBPACK_IMPORTED_MODULE_0__getNative_js__["a" /* default */])(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

/* harmony default export */ __webpack_exports__["a"] = (defineProperty);


/***/ }),
/* 91 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseTimes_js__ = __webpack_require__(54);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isArguments_js__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isArray_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isBuffer_js__ = __webpack_require__(56);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__isIndex_js__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__isTypedArray_js__ = __webpack_require__(92);







/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = Object(__WEBPACK_IMPORTED_MODULE_2__isArray_js__["default"])(value),
      isArg = !isArr && Object(__WEBPACK_IMPORTED_MODULE_1__isArguments_js__["a" /* default */])(value),
      isBuff = !isArr && !isArg && Object(__WEBPACK_IMPORTED_MODULE_3__isBuffer_js__["a" /* default */])(value),
      isType = !isArr && !isArg && !isBuff && Object(__WEBPACK_IMPORTED_MODULE_5__isTypedArray_js__["a" /* default */])(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? Object(__WEBPACK_IMPORTED_MODULE_0__baseTimes_js__["a" /* default */])(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           Object(__WEBPACK_IMPORTED_MODULE_4__isIndex_js__["a" /* default */])(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (arrayLikeKeys);


/***/ }),
/* 92 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseIsTypedArray_js__ = __webpack_require__(175);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseUnary_js__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__nodeUtil_js__ = __webpack_require__(59);




/* Node.js helper references. */
var nodeIsTypedArray = __WEBPACK_IMPORTED_MODULE_2__nodeUtil_js__["a" /* default */] && __WEBPACK_IMPORTED_MODULE_2__nodeUtil_js__["a" /* default */].isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? Object(__WEBPACK_IMPORTED_MODULE_1__baseUnary_js__["a" /* default */])(nodeIsTypedArray) : __WEBPACK_IMPORTED_MODULE_0__baseIsTypedArray_js__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (isTypedArray);


/***/ }),
/* 93 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/* harmony default export */ __webpack_exports__["a"] = (overArg);


/***/ }),
/* 94 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

/* harmony default export */ __webpack_exports__["a"] = (stubArray);


/***/ }),
/* 95 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayPush_js__ = __webpack_require__(64);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getPrototype_js__ = __webpack_require__(65);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__getSymbols_js__ = __webpack_require__(62);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__stubArray_js__ = __webpack_require__(94);





/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own and inherited enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbolsIn = !nativeGetSymbols ? __WEBPACK_IMPORTED_MODULE_3__stubArray_js__["a" /* default */] : function(object) {
  var result = [];
  while (object) {
    Object(__WEBPACK_IMPORTED_MODULE_0__arrayPush_js__["a" /* default */])(result, Object(__WEBPACK_IMPORTED_MODULE_2__getSymbols_js__["a" /* default */])(object));
    object = Object(__WEBPACK_IMPORTED_MODULE_1__getPrototype_js__["a" /* default */])(object);
  }
  return result;
};

/* harmony default export */ __webpack_exports__["a"] = (getSymbolsIn);


/***/ }),
/* 96 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGetAllKeys_js__ = __webpack_require__(97);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getSymbols_js__ = __webpack_require__(62);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__keys_js__ = __webpack_require__(11);




/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__baseGetAllKeys_js__["a" /* default */])(object, __WEBPACK_IMPORTED_MODULE_2__keys_js__["default"], __WEBPACK_IMPORTED_MODULE_1__getSymbols_js__["a" /* default */]);
}

/* harmony default export */ __webpack_exports__["a"] = (getAllKeys);


/***/ }),
/* 97 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayPush_js__ = __webpack_require__(64);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isArray_js__ = __webpack_require__(1);



/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return Object(__WEBPACK_IMPORTED_MODULE_1__isArray_js__["default"])(object) ? result : Object(__WEBPACK_IMPORTED_MODULE_0__arrayPush_js__["a" /* default */])(result, symbolsFunc(object));
}

/* harmony default export */ __webpack_exports__["a"] = (baseGetAllKeys);


/***/ }),
/* 98 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getNative_js__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__root_js__ = __webpack_require__(4);



/* Built-in method references that are verified to be native. */
var Set = Object(__WEBPACK_IMPORTED_MODULE_0__getNative_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_1__root_js__["a" /* default */], 'Set');

/* harmony default export */ __webpack_exports__["a"] = (Set);


/***/ }),
/* 99 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getNative_js__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__root_js__ = __webpack_require__(4);



/* Built-in method references that are verified to be native. */
var WeakMap = Object(__WEBPACK_IMPORTED_MODULE_0__getNative_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_1__root_js__["a" /* default */], 'WeakMap');

/* harmony default export */ __webpack_exports__["a"] = (WeakMap);


/***/ }),
/* 100 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__root_js__ = __webpack_require__(4);


/** Built-in value references. */
var Uint8Array = __WEBPACK_IMPORTED_MODULE_0__root_js__["a" /* default */].Uint8Array;

/* harmony default export */ __webpack_exports__["a"] = (Uint8Array);


/***/ }),
/* 101 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__apply_js__ = __webpack_require__(68);


/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return Object(__WEBPACK_IMPORTED_MODULE_0__apply_js__["a" /* default */])(func, this, otherArgs);
  };
}

/* harmony default export */ __webpack_exports__["a"] = (overRest);


/***/ }),
/* 102 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

/* harmony default export */ __webpack_exports__["a"] = (shortOut);


/***/ }),
/* 103 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__basePick_js__ = __webpack_require__(199);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__flatRest_js__ = __webpack_require__(72);



/**
 * Creates an object composed of the picked `object` properties.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {...(string|string[])} [paths] The property paths to pick.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.pick(object, ['a', 'c']);
 * // => { 'a': 1, 'c': 3 }
 */
var pick = Object(__WEBPACK_IMPORTED_MODULE_1__flatRest_js__["a" /* default */])(function(object, paths) {
  return object == null ? {} : Object(__WEBPACK_IMPORTED_MODULE_0__basePick_js__["a" /* default */])(object, paths);
});

/* harmony default export */ __webpack_exports__["default"] = (pick);


/***/ }),
/* 104 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGet_js__ = __webpack_require__(37);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseSet_js__ = __webpack_require__(204);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__castPath_js__ = __webpack_require__(19);




/**
 * The base implementation of  `_.pickBy` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} paths The property paths to pick.
 * @param {Function} predicate The function invoked per property.
 * @returns {Object} Returns the new object.
 */
function basePickBy(object, paths, predicate) {
  var index = -1,
      length = paths.length,
      result = {};

  while (++index < length) {
    var path = paths[index],
        value = Object(__WEBPACK_IMPORTED_MODULE_0__baseGet_js__["a" /* default */])(object, path);

    if (predicate(value, path)) {
      Object(__WEBPACK_IMPORTED_MODULE_1__baseSet_js__["a" /* default */])(result, Object(__WEBPACK_IMPORTED_MODULE_2__castPath_js__["a" /* default */])(path, object), value);
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (basePickBy);


/***/ }),
/* 105 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseToString_js__ = __webpack_require__(203);


/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : Object(__WEBPACK_IMPORTED_MODULE_0__baseToString_js__["a" /* default */])(value);
}

/* harmony default export */ __webpack_exports__["a"] = (toString);


/***/ }),
/* 106 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseHasIn_js__ = __webpack_require__(205);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__hasPath_js__ = __webpack_require__(107);



/**
 * Checks if `path` is a direct or inherited property of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.hasIn(object, 'a');
 * // => true
 *
 * _.hasIn(object, 'a.b');
 * // => true
 *
 * _.hasIn(object, ['a', 'b']);
 * // => true
 *
 * _.hasIn(object, 'b');
 * // => false
 */
function hasIn(object, path) {
  return object != null && Object(__WEBPACK_IMPORTED_MODULE_1__hasPath_js__["a" /* default */])(object, path, __WEBPACK_IMPORTED_MODULE_0__baseHasIn_js__["a" /* default */]);
}

/* harmony default export */ __webpack_exports__["a"] = (hasIn);


/***/ }),
/* 107 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__castPath_js__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isArguments_js__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isArray_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isIndex_js__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__isLength_js__ = __webpack_require__(58);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__toKey_js__ = __webpack_require__(20);







/**
 * Checks if `path` exists on `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @param {Function} hasFunc The function to check properties.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 */
function hasPath(object, path, hasFunc) {
  path = Object(__WEBPACK_IMPORTED_MODULE_0__castPath_js__["a" /* default */])(path, object);

  var index = -1,
      length = path.length,
      result = false;

  while (++index < length) {
    var key = Object(__WEBPACK_IMPORTED_MODULE_5__toKey_js__["a" /* default */])(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result || ++index != length) {
    return result;
  }
  length = object == null ? 0 : object.length;
  return !!length && Object(__WEBPACK_IMPORTED_MODULE_4__isLength_js__["a" /* default */])(length) && Object(__WEBPACK_IMPORTED_MODULE_3__isIndex_js__["a" /* default */])(key, length) &&
    (Object(__WEBPACK_IMPORTED_MODULE_2__isArray_js__["default"])(object) || Object(__WEBPACK_IMPORTED_MODULE_1__isArguments_js__["a" /* default */])(object));
}

/* harmony default export */ __webpack_exports__["a"] = (hasPath);


/***/ }),
/* 108 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseIsEqual_js__ = __webpack_require__(74);


/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent.
 *
 * **Note:** This method supports comparing arrays, array buffers, booleans,
 * date objects, error objects, maps, numbers, `Object` objects, regexes,
 * sets, strings, symbols, and typed arrays. `Object` objects are compared
 * by their own, not inherited, enumerable properties. Functions and DOM
 * nodes are compared by strict equality, i.e. `===`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.isEqual(object, other);
 * // => true
 *
 * object === other;
 * // => false
 */
function isEqual(value, other) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__baseIsEqual_js__["a" /* default */])(value, other);
}

/* harmony default export */ __webpack_exports__["default"] = (isEqual);


/***/ }),
/* 109 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__SetCache_js__ = __webpack_require__(39);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__arraySome_js__ = __webpack_require__(215);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__cacheHas_js__ = __webpack_require__(40);




/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new __WEBPACK_IMPORTED_MODULE_0__SetCache_js__["a" /* default */] : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!Object(__WEBPACK_IMPORTED_MODULE_1__arraySome_js__["a" /* default */])(other, function(othValue, othIndex) {
            if (!Object(__WEBPACK_IMPORTED_MODULE_2__cacheHas_js__["a" /* default */])(seen, othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (equalArrays);


/***/ }),
/* 110 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/**
 * Checks if `value` is `undefined`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
 * @example
 *
 * _.isUndefined(void 0);
 * // => true
 *
 * _.isUndefined(null);
 * // => false
 */
function isUndefined(value) {
  return value === undefined;
}

/* harmony default export */ __webpack_exports__["default"] = (isUndefined);


/***/ }),
/* 111 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array == null ? 0 : array.length;
  return length ? array[length - 1] : undefined;
}

/* harmony default export */ __webpack_exports__["default"] = (last);


/***/ }),
/* 112 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isObject_js__ = __webpack_require__(6);


/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !Object(__WEBPACK_IMPORTED_MODULE_0__isObject_js__["a" /* default */])(value);
}

/* harmony default export */ __webpack_exports__["a"] = (isStrictComparable);


/***/ }),
/* 113 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * A specialized version of `matchesProperty` for source values suitable
 * for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function matchesStrictComparable(key, srcValue) {
  return function(object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue &&
      (srcValue !== undefined || (key in Object(object)));
  };
}

/* harmony default export */ __webpack_exports__["a"] = (matchesStrictComparable);


/***/ }),
/* 114 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/* harmony default export */ __webpack_exports__["a"] = (baseProperty);


/***/ }),
/* 115 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseFindIndex_js__ = __webpack_require__(241);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseIsNaN_js__ = __webpack_require__(242);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__strictIndexOf_js__ = __webpack_require__(243);




/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  return value === value
    ? Object(__WEBPACK_IMPORTED_MODULE_2__strictIndexOf_js__["a" /* default */])(array, value, fromIndex)
    : Object(__WEBPACK_IMPORTED_MODULE_0__baseFindIndex_js__["a" /* default */])(array, __WEBPACK_IMPORTED_MODULE_1__baseIsNaN_js__["a" /* default */], fromIndex);
}

/* harmony default export */ __webpack_exports__["a"] = (baseIndexOf);


/***/ }),
/* 116 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__identity_js__ = __webpack_require__(18);


/**
 * Casts `value` to `identity` if it's not a function.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Function} Returns cast function.
 */
function castFunction(value) {
  return typeof value == 'function' ? value : __WEBPACK_IMPORTED_MODULE_0__identity_js__["a" /* default */];
}

/* harmony default export */ __webpack_exports__["a"] = (castFunction);


/***/ }),
/* 117 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__createFlow_js__ = __webpack_require__(245);


/**
 * Creates a function that returns the result of invoking the given functions
 * with the `this` binding of the created function, where each successive
 * invocation is supplied the return value of the previous.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Util
 * @param {...(Function|Function[])} [funcs] The functions to invoke.
 * @returns {Function} Returns the new composite function.
 * @see _.flowRight
 * @example
 *
 * function square(n) {
 *   return n * n;
 * }
 *
 * var addSquare = _.flow([_.add, square]);
 * addSquare(1, 2);
 * // => 9
 */
var flow = Object(__WEBPACK_IMPORTED_MODULE_0__createFlow_js__["a" /* default */])();

/* harmony default export */ __webpack_exports__["default"] = (flow);


/***/ }),
/* 118 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__WeakMap_js__ = __webpack_require__(99);


/** Used to store function metadata. */
var metaMap = __WEBPACK_IMPORTED_MODULE_0__WeakMap_js__["a" /* default */] && new __WEBPACK_IMPORTED_MODULE_0__WeakMap_js__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (metaMap);


/***/ }),
/* 119 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * This method returns `undefined`.
 *
 * @static
 * @memberOf _
 * @since 2.3.0
 * @category Util
 * @example
 *
 * _.times(2, _.noop);
 * // => [undefined, undefined]
 */
function noop() {
  // No operation performed.
}

/* harmony default export */ __webpack_exports__["a"] = (noop);


/***/ }),
/* 120 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__realNames_js__ = __webpack_require__(246);


/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the name of `func`.
 *
 * @private
 * @param {Function} func The function to query.
 * @returns {string} Returns the function name.
 */
function getFuncName(func) {
  var result = (func.name + ''),
      array = __WEBPACK_IMPORTED_MODULE_0__realNames_js__["a" /* default */][result],
      length = hasOwnProperty.call(__WEBPACK_IMPORTED_MODULE_0__realNames_js__["a" /* default */], result) ? array.length : 0;

  while (length--) {
    var data = array[length],
        otherFunc = data.func;
    if (otherFunc == null || otherFunc == func) {
      return data.name;
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (getFuncName);


/***/ }),
/* 121 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__LazyWrapper_js__ = __webpack_require__(81);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getData_js__ = __webpack_require__(80);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__getFuncName_js__ = __webpack_require__(120);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__wrapperLodash_js__ = __webpack_require__(247);





/**
 * Checks if `func` has a lazy counterpart.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` has a lazy counterpart,
 *  else `false`.
 */
function isLaziable(func) {
  var funcName = Object(__WEBPACK_IMPORTED_MODULE_2__getFuncName_js__["a" /* default */])(func),
      other = __WEBPACK_IMPORTED_MODULE_3__wrapperLodash_js__["a" /* default */][funcName];

  if (typeof other != 'function' || !(funcName in __WEBPACK_IMPORTED_MODULE_0__LazyWrapper_js__["a" /* default */].prototype)) {
    return false;
  }
  if (func === other) {
    return true;
  }
  var data = Object(__WEBPACK_IMPORTED_MODULE_1__getData_js__["a" /* default */])(other);
  return !!data && func === data[0];
}

/* harmony default export */ __webpack_exports__["a"] = (isLaziable);


/***/ }),
/* 122 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__ = __webpack_require__(5);



/** `Object#toString` result references. */
var numberTag = '[object Number]';

/**
 * Checks if `value` is classified as a `Number` primitive or object.
 *
 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are
 * classified as numbers, use the `_.isFinite` method.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a number, else `false`.
 * @example
 *
 * _.isNumber(3);
 * // => true
 *
 * _.isNumber(Number.MIN_VALUE);
 * // => true
 *
 * _.isNumber(Infinity);
 * // => true
 *
 * _.isNumber('3');
 * // => false
 */
function isNumber(value) {
  return typeof value == 'number' ||
    (Object(__WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__["a" /* default */])(value) && Object(__WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__["a" /* default */])(value) == numberTag);
}

/* harmony default export */ __webpack_exports__["default"] = (isNumber);


/***/ }),
/* 123 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseEach_js__ = __webpack_require__(42);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isArrayLike_js__ = __webpack_require__(17);



/**
 * The base implementation of `_.map` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function baseMap(collection, iteratee) {
  var index = -1,
      result = Object(__WEBPACK_IMPORTED_MODULE_1__isArrayLike_js__["a" /* default */])(collection) ? Array(collection.length) : [];

  Object(__WEBPACK_IMPORTED_MODULE_0__baseEach_js__["a" /* default */])(collection, function(value, key, collection) {
    result[++index] = iteratee(value, key, collection);
  });
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (baseMap);


/***/ }),
/* 124 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseRest_js__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__createWrap_js__ = __webpack_require__(252);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__getHolder_js__ = __webpack_require__(82);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__replaceHolders_js__ = __webpack_require__(46);





/** Used to compose bitmasks for function metadata. */
var WRAP_PARTIAL_RIGHT_FLAG = 64;

/**
 * This method is like `_.partial` except that partially applied arguments
 * are appended to the arguments it receives.
 *
 * The `_.partialRight.placeholder` value, which defaults to `_` in monolithic
 * builds, may be used as a placeholder for partially applied arguments.
 *
 * **Note:** This method doesn't set the "length" property of partially
 * applied functions.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Function
 * @param {Function} func The function to partially apply arguments to.
 * @param {...*} [partials] The arguments to be partially applied.
 * @returns {Function} Returns the new partially applied function.
 * @example
 *
 * function greet(greeting, name) {
 *   return greeting + ' ' + name;
 * }
 *
 * var greetFred = _.partialRight(greet, 'fred');
 * greetFred('hi');
 * // => 'hi fred'
 *
 * // Partially applied with placeholders.
 * var sayHelloTo = _.partialRight(greet, 'hello', _);
 * sayHelloTo('fred');
 * // => 'hello fred'
 */
var partialRight = Object(__WEBPACK_IMPORTED_MODULE_0__baseRest_js__["a" /* default */])(function(func, partials) {
  var holders = Object(__WEBPACK_IMPORTED_MODULE_3__replaceHolders_js__["a" /* default */])(partials, Object(__WEBPACK_IMPORTED_MODULE_2__getHolder_js__["a" /* default */])(partialRight));
  return Object(__WEBPACK_IMPORTED_MODULE_1__createWrap_js__["a" /* default */])(func, WRAP_PARTIAL_RIGHT_FLAG, undefined, partials, holders);
});

// Assign default placeholders.
partialRight.placeholder = {};

/* harmony default export */ __webpack_exports__["default"] = (partialRight);


/***/ }),
/* 125 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__identity_js__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__metaMap_js__ = __webpack_require__(118);



/**
 * The base implementation of `setData` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to associate metadata with.
 * @param {*} data The metadata.
 * @returns {Function} Returns `func`.
 */
var baseSetData = !__WEBPACK_IMPORTED_MODULE_1__metaMap_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_0__identity_js__["a" /* default */] : function(func, data) {
  __WEBPACK_IMPORTED_MODULE_1__metaMap_js__["a" /* default */].set(func, data);
  return func;
};

/* harmony default export */ __webpack_exports__["a"] = (baseSetData);


/***/ }),
/* 126 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__composeArgs_js__ = __webpack_require__(127);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__composeArgsRight_js__ = __webpack_require__(128);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__countHolders_js__ = __webpack_require__(255);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__createCtor_js__ = __webpack_require__(45);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__createRecurry_js__ = __webpack_require__(129);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__getHolder_js__ = __webpack_require__(82);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__reorder_js__ = __webpack_require__(259);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__replaceHolders_js__ = __webpack_require__(46);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__root_js__ = __webpack_require__(4);










/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_FLAG = 8,
    WRAP_CURRY_RIGHT_FLAG = 16,
    WRAP_ARY_FLAG = 128,
    WRAP_FLIP_FLAG = 512;

/**
 * Creates a function that wraps `func` to invoke it with optional `this`
 * binding of `thisArg`, partial application, and currying.
 *
 * @private
 * @param {Function|string} func The function or method name to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to prepend to those provided to
 *  the new function.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [partialsRight] The arguments to append to those provided
 *  to the new function.
 * @param {Array} [holdersRight] The `partialsRight` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createHybrid(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity) {
  var isAry = bitmask & WRAP_ARY_FLAG,
      isBind = bitmask & WRAP_BIND_FLAG,
      isBindKey = bitmask & WRAP_BIND_KEY_FLAG,
      isCurried = bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG),
      isFlip = bitmask & WRAP_FLIP_FLAG,
      Ctor = isBindKey ? undefined : Object(__WEBPACK_IMPORTED_MODULE_3__createCtor_js__["a" /* default */])(func);

  function wrapper() {
    var length = arguments.length,
        args = Array(length),
        index = length;

    while (index--) {
      args[index] = arguments[index];
    }
    if (isCurried) {
      var placeholder = Object(__WEBPACK_IMPORTED_MODULE_5__getHolder_js__["a" /* default */])(wrapper),
          holdersCount = Object(__WEBPACK_IMPORTED_MODULE_2__countHolders_js__["a" /* default */])(args, placeholder);
    }
    if (partials) {
      args = Object(__WEBPACK_IMPORTED_MODULE_0__composeArgs_js__["a" /* default */])(args, partials, holders, isCurried);
    }
    if (partialsRight) {
      args = Object(__WEBPACK_IMPORTED_MODULE_1__composeArgsRight_js__["a" /* default */])(args, partialsRight, holdersRight, isCurried);
    }
    length -= holdersCount;
    if (isCurried && length < arity) {
      var newHolders = Object(__WEBPACK_IMPORTED_MODULE_7__replaceHolders_js__["a" /* default */])(args, placeholder);
      return Object(__WEBPACK_IMPORTED_MODULE_4__createRecurry_js__["a" /* default */])(
        func, bitmask, createHybrid, wrapper.placeholder, thisArg,
        args, newHolders, argPos, ary, arity - length
      );
    }
    var thisBinding = isBind ? thisArg : this,
        fn = isBindKey ? thisBinding[func] : func;

    length = args.length;
    if (argPos) {
      args = Object(__WEBPACK_IMPORTED_MODULE_6__reorder_js__["a" /* default */])(args, argPos);
    } else if (isFlip && length > 1) {
      args.reverse();
    }
    if (isAry && ary < length) {
      args.length = ary;
    }
    if (this && this !== __WEBPACK_IMPORTED_MODULE_8__root_js__["a" /* default */] && this instanceof wrapper) {
      fn = Ctor || Object(__WEBPACK_IMPORTED_MODULE_3__createCtor_js__["a" /* default */])(fn);
    }
    return fn.apply(thisBinding, args);
  }
  return wrapper;
}

/* harmony default export */ __webpack_exports__["a"] = (createHybrid);


/***/ }),
/* 127 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates an array that is the composition of partially applied arguments,
 * placeholders, and provided arguments into a single array of arguments.
 *
 * @private
 * @param {Array} args The provided arguments.
 * @param {Array} partials The arguments to prepend to those provided.
 * @param {Array} holders The `partials` placeholder indexes.
 * @params {boolean} [isCurried] Specify composing for a curried function.
 * @returns {Array} Returns the new array of composed arguments.
 */
function composeArgs(args, partials, holders, isCurried) {
  var argsIndex = -1,
      argsLength = args.length,
      holdersLength = holders.length,
      leftIndex = -1,
      leftLength = partials.length,
      rangeLength = nativeMax(argsLength - holdersLength, 0),
      result = Array(leftLength + rangeLength),
      isUncurried = !isCurried;

  while (++leftIndex < leftLength) {
    result[leftIndex] = partials[leftIndex];
  }
  while (++argsIndex < holdersLength) {
    if (isUncurried || argsIndex < argsLength) {
      result[holders[argsIndex]] = args[argsIndex];
    }
  }
  while (rangeLength--) {
    result[leftIndex++] = args[argsIndex++];
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (composeArgs);


/***/ }),
/* 128 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * This function is like `composeArgs` except that the arguments composition
 * is tailored for `_.partialRight`.
 *
 * @private
 * @param {Array} args The provided arguments.
 * @param {Array} partials The arguments to append to those provided.
 * @param {Array} holders The `partials` placeholder indexes.
 * @params {boolean} [isCurried] Specify composing for a curried function.
 * @returns {Array} Returns the new array of composed arguments.
 */
function composeArgsRight(args, partials, holders, isCurried) {
  var argsIndex = -1,
      argsLength = args.length,
      holdersIndex = -1,
      holdersLength = holders.length,
      rightIndex = -1,
      rightLength = partials.length,
      rangeLength = nativeMax(argsLength - holdersLength, 0),
      result = Array(rangeLength + rightLength),
      isUncurried = !isCurried;

  while (++argsIndex < rangeLength) {
    result[argsIndex] = args[argsIndex];
  }
  var offset = argsIndex;
  while (++rightIndex < rightLength) {
    result[offset + rightIndex] = partials[rightIndex];
  }
  while (++holdersIndex < holdersLength) {
    if (isUncurried || argsIndex < argsLength) {
      result[offset + holders[holdersIndex]] = args[argsIndex++];
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (composeArgsRight);


/***/ }),
/* 129 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isLaziable_js__ = __webpack_require__(121);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__setData_js__ = __webpack_require__(130);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__setWrapToString_js__ = __webpack_require__(131);




/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_BOUND_FLAG = 4,
    WRAP_CURRY_FLAG = 8,
    WRAP_PARTIAL_FLAG = 32,
    WRAP_PARTIAL_RIGHT_FLAG = 64;

/**
 * Creates a function that wraps `func` to continue currying.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {Function} wrapFunc The function to create the `func` wrapper.
 * @param {*} placeholder The placeholder value.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to prepend to those provided to
 *  the new function.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createRecurry(func, bitmask, wrapFunc, placeholder, thisArg, partials, holders, argPos, ary, arity) {
  var isCurry = bitmask & WRAP_CURRY_FLAG,
      newHolders = isCurry ? holders : undefined,
      newHoldersRight = isCurry ? undefined : holders,
      newPartials = isCurry ? partials : undefined,
      newPartialsRight = isCurry ? undefined : partials;

  bitmask |= (isCurry ? WRAP_PARTIAL_FLAG : WRAP_PARTIAL_RIGHT_FLAG);
  bitmask &= ~(isCurry ? WRAP_PARTIAL_RIGHT_FLAG : WRAP_PARTIAL_FLAG);

  if (!(bitmask & WRAP_CURRY_BOUND_FLAG)) {
    bitmask &= ~(WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG);
  }
  var newData = [
    func, bitmask, thisArg, newPartials, newHolders, newPartialsRight,
    newHoldersRight, argPos, ary, arity
  ];

  var result = wrapFunc.apply(undefined, newData);
  if (Object(__WEBPACK_IMPORTED_MODULE_0__isLaziable_js__["a" /* default */])(func)) {
    Object(__WEBPACK_IMPORTED_MODULE_1__setData_js__["a" /* default */])(result, newData);
  }
  result.placeholder = placeholder;
  return Object(__WEBPACK_IMPORTED_MODULE_2__setWrapToString_js__["a" /* default */])(result, func, bitmask);
}

/* harmony default export */ __webpack_exports__["a"] = (createRecurry);


/***/ }),
/* 130 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseSetData_js__ = __webpack_require__(125);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__shortOut_js__ = __webpack_require__(102);



/**
 * Sets metadata for `func`.
 *
 * **Note:** If this function becomes hot, i.e. is invoked a lot in a short
 * period of time, it will trip its breaker and transition to an identity
 * function to avoid garbage collection pauses in V8. See
 * [V8 issue 2070](https://bugs.chromium.org/p/v8/issues/detail?id=2070)
 * for more details.
 *
 * @private
 * @param {Function} func The function to associate metadata with.
 * @param {*} data The metadata.
 * @returns {Function} Returns `func`.
 */
var setData = Object(__WEBPACK_IMPORTED_MODULE_1__shortOut_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_0__baseSetData_js__["a" /* default */]);

/* harmony default export */ __webpack_exports__["a"] = (setData);


/***/ }),
/* 131 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getWrapDetails_js__ = __webpack_require__(256);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__insertWrapDetails_js__ = __webpack_require__(257);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__setToString_js__ = __webpack_require__(69);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__updateWrapDetails_js__ = __webpack_require__(258);





/**
 * Sets the `toString` method of `wrapper` to mimic the source of `reference`
 * with wrapper details in a comment at the top of the source body.
 *
 * @private
 * @param {Function} wrapper The function to modify.
 * @param {Function} reference The reference function.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @returns {Function} Returns `wrapper`.
 */
function setWrapToString(wrapper, reference, bitmask) {
  var source = (reference + '');
  return Object(__WEBPACK_IMPORTED_MODULE_2__setToString_js__["a" /* default */])(wrapper, Object(__WEBPACK_IMPORTED_MODULE_1__insertWrapDetails_js__["a" /* default */])(source, Object(__WEBPACK_IMPORTED_MODULE_3__updateWrapDetails_js__["a" /* default */])(Object(__WEBPACK_IMPORTED_MODULE_0__getWrapDetails_js__["a" /* default */])(source), bitmask)));
}

/* harmony default export */ __webpack_exports__["a"] = (setWrapToString);


/***/ }),
/* 132 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__SetCache_js__ = __webpack_require__(39);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__arrayIncludes_js__ = __webpack_require__(43);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__arrayIncludesWith_js__ = __webpack_require__(77);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__cacheHas_js__ = __webpack_require__(40);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__createSet_js__ = __webpack_require__(265);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__setToArray_js__ = __webpack_require__(75);







/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of `_.uniqBy` without support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new duplicate free array.
 */
function baseUniq(array, iteratee, comparator) {
  var index = -1,
      includes = __WEBPACK_IMPORTED_MODULE_1__arrayIncludes_js__["a" /* default */],
      length = array.length,
      isCommon = true,
      result = [],
      seen = result;

  if (comparator) {
    isCommon = false;
    includes = __WEBPACK_IMPORTED_MODULE_2__arrayIncludesWith_js__["a" /* default */];
  }
  else if (length >= LARGE_ARRAY_SIZE) {
    var set = iteratee ? null : Object(__WEBPACK_IMPORTED_MODULE_4__createSet_js__["a" /* default */])(array);
    if (set) {
      return Object(__WEBPACK_IMPORTED_MODULE_5__setToArray_js__["a" /* default */])(set);
    }
    isCommon = false;
    includes = __WEBPACK_IMPORTED_MODULE_3__cacheHas_js__["a" /* default */];
    seen = new __WEBPACK_IMPORTED_MODULE_0__SetCache_js__["a" /* default */];
  }
  else {
    seen = iteratee ? [] : result;
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    value = (comparator || value !== 0) ? value : 0;
    if (isCommon && computed === computed) {
      var seenIndex = seen.length;
      while (seenIndex--) {
        if (seen[seenIndex] === computed) {
          continue outer;
        }
      }
      if (iteratee) {
        seen.push(computed);
      }
      result.push(value);
    }
    else if (!includes(seen, computed, comparator)) {
      if (seen !== result) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (baseUniq);


/***/ }),
/* 133 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseUniq_js__ = __webpack_require__(132);


/**
 * Creates a duplicate-free version of an array, using
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons, in which only the first occurrence of each element
 * is kept. The order of result values is determined by the order they occur
 * in the array.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @returns {Array} Returns the new duplicate free array.
 * @example
 *
 * _.uniq([2, 1, 2]);
 * // => [2, 1]
 */
function uniq(array) {
  return (array && array.length) ? Object(__WEBPACK_IMPORTED_MODULE_0__baseUniq_js__["a" /* default */])(array) : [];
}

/* harmony default export */ __webpack_exports__["default"] = (uniq);


/***/ }),
/* 134 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
/* tslint:disable:max-classes-per-file */
var BinaryExpr = /** @class */ (function () {
    function BinaryExpr(operator, leftOperand, rightOperand) {
        this.operator = operator;
        this.leftOperand = leftOperand;
        this.rightOperand = rightOperand;
    }
    return BinaryExpr;
}());
exports.BinaryExpr = BinaryExpr;
// Unary Expression
var UnaryExpr = /** @class */ (function () {
    function UnaryExpr(operator, operand) {
        this.operator = operator;
        this.operand = operand;
    }
    return UnaryExpr;
}());
exports.UnaryExpr = UnaryExpr;
// Function call
var FuncCall = /** @class */ (function () {
    function FuncCall(funcName, args, preComputeUniformName) {
        this.funcName = funcName;
        this.args = args;
        this.preComputeUniformName = preComputeUniformName;
    }
    return FuncCall;
}());
exports.FuncCall = FuncCall;
// Variable assignment
var Assignment = /** @class */ (function () {
    function Assignment(lhs, expr) {
        this.lhs = lhs;
        this.expr = expr;
    }
    return Assignment;
}());
exports.Assignment = Assignment;
// Code start symbol
var Program = /** @class */ (function () {
    function Program(statements) {
        this.statements = statements;
    }
    return Program;
}());
exports.Program = Program;
var PrimaryExprType;
(function (PrimaryExprType) {
    PrimaryExprType["ID"] = "ID";
    PrimaryExprType["CONST"] = "CONST";
    PrimaryExprType["REG"] = "REG";
    PrimaryExprType["VALUE"] = "VALUE";
})(PrimaryExprType = exports.PrimaryExprType || (exports.PrimaryExprType = {}));
// Atomic expression
var PrimaryExpr = /** @class */ (function () {
    function PrimaryExpr(value, type) {
        this.value = value;
        this.type = type;
    }
    return PrimaryExpr;
}());
exports.PrimaryExpr = PrimaryExpr;


/***/ }),
/* 135 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__assignIn_js__ = __webpack_require__(269);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return __WEBPACK_IMPORTED_MODULE_0__assignIn_js__["a"]; });



/***/ }),
/* 136 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseSlice_js__ = __webpack_require__(41);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__toInteger_js__ = __webpack_require__(21);



/**
 * Creates a slice of `array` with `n` elements taken from the beginning.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to query.
 * @param {number} [n=1] The number of elements to take.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
 * @returns {Array} Returns the slice of `array`.
 * @example
 *
 * _.take([1, 2, 3]);
 * // => [1]
 *
 * _.take([1, 2, 3], 2);
 * // => [1, 2]
 *
 * _.take([1, 2, 3], 5);
 * // => [1, 2, 3]
 *
 * _.take([1, 2, 3], 0);
 * // => []
 */
function take(array, n, guard) {
  if (!(array && array.length)) {
    return [];
  }
  n = (guard || n === undefined) ? 1 : Object(__WEBPACK_IMPORTED_MODULE_1__toInteger_js__["a" /* default */])(n);
  return Object(__WEBPACK_IMPORTED_MODULE_0__baseSlice_js__["a" /* default */])(array, 0, n < 0 ? 0 : n);
}

/* harmony default export */ __webpack_exports__["default"] = (take);


/***/ }),
/* 137 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseTimes_js__ = __webpack_require__(54);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__castFunction_js__ = __webpack_require__(116);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__toInteger_js__ = __webpack_require__(21);




/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used as references for the maximum length and index of an array. */
var MAX_ARRAY_LENGTH = 4294967295;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * Invokes the iteratee `n` times, returning an array of the results of
 * each invocation. The iteratee is invoked with one argument; (index).
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 * @example
 *
 * _.times(3, String);
 * // => ['0', '1', '2']
 *
 *  _.times(4, _.constant(0));
 * // => [0, 0, 0, 0]
 */
function times(n, iteratee) {
  n = Object(__WEBPACK_IMPORTED_MODULE_2__toInteger_js__["a" /* default */])(n);
  if (n < 1 || n > MAX_SAFE_INTEGER) {
    return [];
  }
  var index = MAX_ARRAY_LENGTH,
      length = nativeMin(n, MAX_ARRAY_LENGTH);

  iteratee = Object(__WEBPACK_IMPORTED_MODULE_1__castFunction_js__["a" /* default */])(iteratee);
  n -= MAX_ARRAY_LENGTH;

  var result = Object(__WEBPACK_IMPORTED_MODULE_0__baseTimes_js__["a" /* default */])(length, iteratee);
  while (++index < n) {
    iteratee(index);
  }
  return result;
}

/* harmony default export */ __webpack_exports__["default"] = (times);


/***/ }),
/* 138 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
var isNumber_1 = __webpack_require__(122);
var isString_1 = __webpack_require__(73);
var isUndefined_1 = __webpack_require__(110);
/**
 * TextureSetManager maintains a set of named/indexed textures and optionally, a
 * FrameBuffer for offscreen rendering.
 */
var TextureSetManager = /** @class */ (function () {
    /**
     * Creates a new TextureSetManager
     * @param rctx the rendering context in which the textures and buffers will be created
     * @param copier an instance of a copier program
     * @param hasFrameBuffer if true, then a FrameBuffer is also created
     * @param texCount initial number of textures
     */
    function TextureSetManager(rctx, copier, hasFrameBuffer, texCount) {
        if (hasFrameBuffer === void 0) { hasFrameBuffer = false; }
        if (texCount === void 0) { texCount = 2; }
        this.rctx = rctx;
        this.copier = copier;
        this.initTexCount = texCount;
        this.hasFrameBuffer = hasFrameBuffer;
        this.init();
    }
    /**
     * Adds the texture
     * @param name name of the texture
     */
    TextureSetManager.prototype.addTexture = function (name) {
        if (name && name in this.names) {
            this.names[name].refCount++;
            return this.names[name].index;
        }
        var gl = this.rctx.getGl();
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        this.textures.push(texture);
        if (name) {
            this.names[name] = {
                index: this.textures.length - 1,
                refCount: 1
            };
        }
        return this.textures.length - 1;
    };
    /**
     * Removes a texture
     * @param nameOrIndex name or index of the texture to be removed
     */
    TextureSetManager.prototype.removeTexture = function (nameOrIndex) {
        if (isString_1["default"](nameOrIndex) && nameOrIndex in this.names) {
            if (this.names[nameOrIndex].refCount > 1) {
                this.names[nameOrIndex].refCount--;
                return;
            }
        }
        var index = this.findIndex(nameOrIndex);
        if (index === this.curTex && (this.oldTexture || this.oldFrameBuffer)) {
            throw new Error("Cannot remove current texture when set as render target");
        }
        var gl = this.rctx.getGl();
        gl.deleteTexture(this.textures[index]);
        this.textures.splice(index, 1);
        if (this.curTex >= this.textures.length) {
            this.curTex = this.textures.length - 1;
        }
        if (typeof nameOrIndex === "string") {
            delete this.names[nameOrIndex];
        }
    };
    /**
     * Sets the current texture as the frame buffer attachment. If `hasFrameBuffer` is true
     * then the FrameBuffer manager is bound and the texture is set as the frame buffer attachment.
     * @param texName name of the texture to set as target. If undefined then we cycle
     *                through to next texture
     */
    TextureSetManager.prototype.setAsRenderTarget = function (texName) {
        var gl = this.rctx.getGl();
        var curFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        if (!this.hasFrameBuffer) {
            if (!curFrameBuffer) {
                throw new Error("Cannot set texture when current rendertarget is the default FrameBuffer");
            }
            this.oldTexture = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
        }
        else {
            this.oldFrameBuffer = curFrameBuffer;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        }
        this.isRenderTarget = true;
        if (!isUndefined_1["default"](texName)) {
            this.switchTexture(texName);
        }
        else {
            var texture = this.textures[this.curTex];
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        }
    };
    /**
     * Restores the texture attachment or framebuffer that was set
     * with a previous call to [[TextureSetManager.setAsRenderTarget]]
     */
    TextureSetManager.prototype.unsetAsRenderTarget = function () {
        var gl = this.rctx.getGl();
        if (!this.hasFrameBuffer) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.oldTexture, 0);
            this.oldTexture = null;
        }
        else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.oldFrameBuffer);
            this.oldFrameBuffer = null;
        }
        this.isRenderTarget = false;
    };
    /**
     * Returns the current texture.
     *
     * TextureSetManager has this notion of current texture
     * that it can cycle through the set of all textures.
     */
    TextureSetManager.prototype.getCurrentTexture = function () {
        return this.textures[this.curTex];
    };
    /**
     * Returns the texture at given index or with given nam,e
     * @param nameorIndex name of index of the texture to be returned
     */
    TextureSetManager.prototype.getTexture = function (nameOrIndex) {
        var index = this.findIndex(nameOrIndex);
        return this.textures[index];
    };
    /**
     * Copies previous texture into current texture.
     */
    TextureSetManager.prototype.copyOver = function () {
        var texCount = this.textures.length;
        var prevTexture = this.textures[(texCount + this.curTex - 1) % texCount];
        this.copier.run(null, { srcTexture: prevTexture });
    };
    /**
     * Sets the current texture and sets it as the current frame buffer attachment
     * @param nameOrIndex name or index of the texture. If undefined then we cycle through
     *                    to next texture
     */
    TextureSetManager.prototype.switchTexture = function (nameOrIndex) {
        if (nameOrIndex === void 0) { nameOrIndex = (this.curTex + 1) % this.textures.length; }
        if (!this.isRenderTarget) {
            throw new Error("Cannot switch texture when not set as rendertarget");
        }
        var gl = this.rctx.getGl();
        this.curTex = this.findIndex(nameOrIndex);
        var texture = this.textures[this.curTex];
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    };
    /**
     * Resizes all textures
     */
    TextureSetManager.prototype.resize = function () {
        // TODO: investigate chrome warning: INVALID_OPERATION: no texture
        var gl = this.rctx.getGl();
        for (var _i = 0, _a = this.textures; _i < _a.length; _i++) {
            var texture = _a[_i];
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
    };
    /**
     * Destroys all texture and framebuffer
     */
    TextureSetManager.prototype.destroy = function () {
        var gl = this.rctx.getGl();
        for (var _i = 0, _a = this.textures; _i < _a.length; _i++) {
            var texture = _a[_i];
            gl.deleteTexture(texture);
        }
        if (this.hasFrameBuffer) {
            gl.deleteFramebuffer(this.framebuffer);
        }
    };
    TextureSetManager.prototype.init = function () {
        var gl = this.rctx.getGl();
        if (this.hasFrameBuffer) {
            this.framebuffer = gl.createFramebuffer();
        }
        this.names = {};
        this.textures = [];
        for (var i = 0; i < this.initTexCount; i++) {
            this.addTexture();
        }
        this.curTex = 0;
        this.isRenderTarget = false;
    };
    TextureSetManager.prototype.findIndex = function (arg) {
        var index;
        if (isString_1["default"](arg) && arg in this.names) {
            index = this.names[arg].index;
        }
        else if (isNumber_1["default"](arg) && arg >= 0 && arg < this.textures.length) {
            index = arg;
        }
        else {
            // tslint:disable-next-line:no-console
            console.log("arg = ", typeof (arg), "textures = ", this.textures);
            throw new Error("Unknown texture '" + arg + "'");
        }
        return index;
    };
    return TextureSetManager;
}());
exports["default"] = TextureSetManager;


/***/ }),
/* 139 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var utils_1 = __webpack_require__(0);
var ShaderProgram_1 = __webpack_require__(3);
/**
 * A Shader program the clears the screen to a given color
 */
var ClearScreenProgram = /** @class */ (function (_super) {
    __extends(ClearScreenProgram, _super);
    /**
     * Creates new ClearScreenProgram
     * @param rctx the rendering context in which to create this shader
     * @param blendMode blend mode for this shader
     */
    function ClearScreenProgram(rctx, blendMode) {
        return _super.call(this, rctx, {
            bindings: {
                uniforms: {
                    color: { name: "u_color", valueType: utils_1.WebGLVarType._3FV }
                }
            },
            blendMode: blendMode,
            fragmentShader: "\n                uniform vec3 u_color;\n                void main() {\n                setFragColor(vec4(u_color, 1));\n                }\n            "
        }) || this;
    }
    return ClearScreenProgram;
}(ShaderProgram_1["default"]));
exports["default"] = ClearScreenProgram;


/***/ }),
/* 140 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
/**
 * AnalyserAdapter adapts music data analysers so that it can be plugged into Webvs.
 *
 * Implement this to send music data into webvs
 */
var AnalyserAdapter = /** @class */ (function () {
    function AnalyserAdapter() {
    }
    return AnalyserAdapter;
}());
exports["default"] = AnalyserAdapter;


/***/ }),
/* 141 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
var Main_1 = __webpack_require__(142);
var Component_1 = __webpack_require__(2);
var WebAudioAnalyser_1 = __webpack_require__(309);
var AnalyserAdapter_1 = __webpack_require__(140);
var ShaderProgram_1 = __webpack_require__(3);
var Webvs = {
    Main: Main_1["default"], Component: Component_1["default"], ShaderProgram: ShaderProgram_1["default"],
    WebAudioAnalyser: WebAudioAnalyser_1["default"], AnalyserAdapter: AnalyserAdapter_1["default"]
};
exports["default"] = Webvs;


/***/ }),
/* 142 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var clone_1 = __webpack_require__(47);
var defaults_1 = __webpack_require__(24);
var pick_1 = __webpack_require__(103);
var stats_js_1 = __webpack_require__(207);
var builtinResourcePack_1 = __webpack_require__(208);
var ComponentRegistry_1 = __webpack_require__(209);
var EffectList_1 = __webpack_require__(210);
var BufferSave_1 = __webpack_require__(274);
var GlobalVar_1 = __webpack_require__(275);
var Model_1 = __webpack_require__(76);
var ClearScreen_1 = __webpack_require__(276);
var MovingParticle_1 = __webpack_require__(278);
var Picture_1 = __webpack_require__(279);
var SuperScope_1 = __webpack_require__(280);
var Texer_1 = __webpack_require__(281);
var ResourceManager_1 = __webpack_require__(282);
var ChannelShift_1 = __webpack_require__(284);
var ColorClip_1 = __webpack_require__(286);
var ColorMap_1 = __webpack_require__(287);
var Convolution_1 = __webpack_require__(297);
var DynamicMovement_1 = __webpack_require__(301);
var FadeOut_1 = __webpack_require__(302);
var Invert_1 = __webpack_require__(303);
var Mirror_1 = __webpack_require__(304);
var Mosaic_1 = __webpack_require__(305);
var UniqueTone_1 = __webpack_require__(306);
var utils_1 = __webpack_require__(0);
var CopyProgram_1 = __webpack_require__(307);
var RenderingContext_1 = __webpack_require__(308);
var TextureSetManager_1 = __webpack_require__(138);
/**
 * Main is the primary interface that controls loading of presets, starting stopping animations, etc.
 * It maintains the root Component and the hierarchy of components under it.
 * A typical usage involves creating an Analyser and a Main object. The Analyser interfaces with your
 * audio source and generates the visualization data, while the Main object serves as the primary
 * interface for controlling the visualization. E.g:
 * ```
 * const analyser = new Webvs.WebAudioAnalyser();
 * const webvs = new Webvs.Main({
 *     canvas: document.getElementById("canvas"),
 *     analyser: analyser,
 *     showStat: true
 * });
 * webvs.loadPreset({
 *   "clearFrame": true,
 *   "components": [
 *       {
 *           "type": "SuperScope",
 *           "source": "WAVEFORM",
 *           "code": {
 *               "perPoint": "x=i*2-1;y=v;"
 *           },
 *           "colors": ["#ffffff"]
 *       }
 *   ]
 * });
 * webvs.start();
 * analyser.load("music.ogg");
 * analyser.play();
 * ```
 */
var Main = /** @class */ (function (_super) {
    __extends(Main, _super);
    /**
     * Constructs a Webvs Main object that can load and render visualization presets
     * @param options options for Main
     */
    function Main(options) {
        var _this = _super.call(this) || this;
        _this.presetResourceKeys = [];
        utils_1.checkRequiredOptions(options, ["canvas", "analyser"]);
        options = defaults_1["default"](options, {
            showStat: false
        });
        _this.canvas = options.canvas;
        _this.analyser = options.analyser;
        _this.isStarted = false;
        if (options.requestAnimationFrame && options.cancelAnimationFrame) {
            _this.requestAnimationFrame = options.requestAnimationFrame;
            _this.cancelAnimationFrame = options.cancelAnimationFrame;
        }
        else {
            _this.requestAnimationFrame = window.requestAnimationFrame.bind(window);
            _this.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
        }
        if (options.showStat) {
            var stats = new stats_js_1["default"]();
            stats.setMode(0);
            stats.domElement.style.position = "absolute";
            stats.domElement.style.right = "5px";
            stats.domElement.style.bottom = "5px";
            document.body.appendChild(stats.domElement);
            _this.stats = stats;
        }
        _this.meta = {};
        _this._initComponentRegistry();
        _this._initResourceManager(options.resourcePrefix || "");
        _this._registerContextEvents();
        _this._initGl();
        _this._setupRoot({ id: "root" });
        return _this;
    }
    /**
     * Starts running the animation when ready. The animation may not start
     * playing immediately because preset may use external resources which
     * needs to be loaded asynchronously by the resource manager.
     */
    Main.prototype.start = function () {
        if (this.isStarted) {
            return;
        }
        this.isStarted = true;
        if (this.rsrcMan.ready) {
            this._startAnimation();
        }
    };
    /**
     * Stops the animation
     */
    Main.prototype.stop = function () {
        if (!this.isStarted) {
            return;
        }
        this.isStarted = false;
        if (this.rsrcMan.ready) {
            this._stopAnimation();
        }
    };
    /**
     * Loads a preset into this webvs main instance.
     *
     * @param preset an object that contains the preset. The root object should
     * have a `components` property which will contain an Array for component configurations
     * for all the components. All component configurations should have a
     * `type` property containing the string name of the Component. Other
     * properties are specific to each component. The `resources.uris` property
     * in preset is used to register resources with [[ResourceManager]] and has
     * the same format accepted by the [[ResourceManager.registerUri]].
     */
    Main.prototype.loadPreset = function (preset) {
        preset = clone_1["default"](preset); // use our own copy
        preset.id = "root";
        this.rootComponent.destroy();
        // setup resources
        this.rsrcMan.clear(this.presetResourceKeys);
        if ("resources" in preset && "uris" in preset.resources) {
            this.rsrcMan.registerUri(preset.resources.uris);
            this.presetResourceKeys = Object.keys(preset.resources.uris);
        }
        else {
            this.presetResourceKeys = [];
        }
        // load meta
        this.meta = clone_1["default"](preset.meta);
        this._setupRoot(preset);
    };
    /**
     * Resets and reinitializes all the components and canvas.
     */
    Main.prototype.resetCanvas = function () {
        var preset = this.rootComponent.toJSON();
        this.rootComponent.destroy();
        this.tempTSM.destroy();
        this._initGl();
        this._setupRoot(preset);
    };
    /**
     * This function should be called if the canvas element's
     * width or height attribute has changed. This allows Webvs
     * to update and resize all the buffers.
     */
    Main.prototype.notifyResize = function () {
        var gl = this.rctx.getGl();
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        this.tempTSM.resize();
        this.emit("resize", gl.drawingBufferWidth, gl.drawingBufferHeight);
    };
    /**
     * Cache webgl Buffers. Useful to store buffers that can be shared. e.g. geometries.
     * @param name Name of the buffer
     * @param buffer Buffer to be cached
     */
    Main.prototype.cacheBuffer = function (name, buffer) {
        this.buffers[name] = buffer;
    };
    /**
     * Returns buffer cached under given name
     * @param name Name of the buffer
     * @returns The buffer cached under given name. `undefined` if not found.
     */
    Main.prototype.getBuffer = function (name) {
        return this.buffers[name];
    };
    /**
     * Gets the current value of a preset property. Eg. `main.get("meta")`
     * @param key preset property to be returned
     */
    Main.prototype.get = function (key) {
        if (key === "meta") {
            return this.meta;
        }
    };
    /**
     * Generates and returns the instantaneous preset JSON representation
     * @returns JSON representaton of the preset
     */
    Main.prototype.toJSON = function () {
        var preset = this.rootComponent.toJSON();
        preset = pick_1["default"](preset, "clearFrame", "components");
        preset.resources = this.rsrcMan.toJSON();
        preset.meta = clone_1["default"](this.meta);
        return preset;
    };
    /**
     * Destroys and cleans up all resources
     */
    Main.prototype.destroy = function () {
        this.stop();
        this.rootComponent.destroy();
        this.rootComponent = null;
        if (this.stats) {
            var statsDomElement = this.stats.domElement;
            statsDomElement.parentNode.removeChild(statsDomElement);
            this.stats = null;
        }
        this.rsrcMan = null;
        this.stopListening();
        this.canvas.removeEventListener("webglcontextlost", this.contextLostHander);
        this.canvas.removeEventListener("webglcontextrestored", this.contextRestoredHander);
    };
    /**
     * Returns the rendering context for webgl rendering
     */
    Main.prototype.getRctx = function () { return this.rctx; };
    /**
     * Returns the Resource Manager that manages media resources
     */
    Main.prototype.getRsrcMan = function () { return this.rsrcMan; };
    /**
     * Returns A shader program that can be used to copy frames
     */
    Main.prototype.getCopier = function () { return this.copier; };
    /**
     * Returns the analyser instance that's used to get music data
     * for the visualization
     */
    Main.prototype.getAnalyser = function () { return this.analyser; };
    /**
     * Returns a registry of [[Component]] classes that will be used
     * to create preset effects
     */
    Main.prototype.getComponentRegistry = function () { return this.componentRegistry; };
    /**
     * Returns a TextureSetManager for global temporary buffers, that can
     * be shared between components.
     */
    Main.prototype.getTempTSM = function () { return this.tempTSM; };
    /**
     * Returns register bank, a map of shared register values available
     * in EEL code in components.
     */
    Main.prototype.getRegisterBank = function () { return this.registerBank; };
    /**
     * Returns the timestamp at which this instance was constructed
     */
    Main.prototype.getBootTime = function () { return this.bootTime; };
    Main.prototype.setAttribute = function (key, value, options) {
        if (key === "meta") {
            this.meta = value;
            return true;
        }
        return false;
    };
    // event handlers
    Main.prototype.handleRsrcWait = function () {
        if (this.isStarted) {
            this._stopAnimation();
        }
    };
    Main.prototype.handleRsrcReady = function () {
        if (this.isStarted) {
            this._startAnimation();
        }
    };
    Main.prototype._initComponentRegistry = function () {
        this.componentRegistry = new ComponentRegistry_1["default"]([
            EffectList_1["default"],
            ClearScreen_1["default"],
            MovingParticle_1["default"],
            Picture_1["default"],
            SuperScope_1["default"],
            Texer_1["default"],
            ChannelShift_1["default"],
            ColorClip_1["default"],
            ColorMap_1["default"],
            Convolution_1["default"],
            DynamicMovement_1["default"],
            FadeOut_1["default"],
            Invert_1["default"],
            Mirror_1["default"],
            Mosaic_1["default"],
            UniqueTone_1["default"],
            BufferSave_1["default"],
            GlobalVar_1["default"],
        ]);
    };
    Main.prototype._initResourceManager = function (prefix) {
        var builtinPack = builtinResourcePack_1["default"];
        if (prefix) {
            builtinPack = clone_1["default"](builtinPack);
            builtinPack.prefix = prefix;
        }
        this.rsrcMan = new ResourceManager_1["default"](builtinPack);
        this.listenTo(this.rsrcMan, "wait", this.handleRsrcWait.bind(this));
        this.listenTo(this.rsrcMan, "ready", this.handleRsrcReady.bind(this));
    };
    Main.prototype._registerContextEvents = function () {
        var _this = this;
        this.contextLostHander = function (event) {
            event.preventDefault();
            _this.stop();
        };
        this.canvas.addEventListener("webglcontextlost", this.contextLostHander);
        this.contextRestoredHander = function (event) {
            _this.resetCanvas();
        };
        this.canvas.addEventListener("webglcontextrestored", this.contextRestoredHander);
    };
    Main.prototype._initGl = function () {
        try {
            this.rctx = new RenderingContext_1["default"](this.canvas.getContext("webgl", { alpha: false }));
            this.copier = new CopyProgram_1["default"](this.rctx, true);
            this.tempTSM = new TextureSetManager_1["default"](this.rctx, this.copier, true, 0);
        }
        catch (e) {
            throw new Error("Couldnt get webgl context" + e);
        }
    };
    Main.prototype._setupRoot = function (preset) {
        this.registerBank = {};
        this.bootTime = (new Date()).getTime();
        this.rootComponent = new EffectList_1["default"](this, null, preset);
    };
    Main.prototype._startAnimation = function () {
        var _this = this;
        var drawFrame = function () {
            _this.analyser.update();
            _this.rootComponent.draw();
            _this.animReqId = _this.requestAnimationFrame(drawFrame);
        };
        // Wrap drawframe in stats collection if required
        if (this.stats) {
            var oldDrawFrame_1 = drawFrame;
            drawFrame = function () {
                _this.stats.begin();
                oldDrawFrame_1();
                _this.stats.end();
            };
        }
        this.animReqId = this.requestAnimationFrame(drawFrame);
    };
    Main.prototype._stopAnimation = function () {
        this.cancelAnimationFrame(this.animReqId);
    };
    /**
     * version of Webvs library
     */
    Main.version = "2.0.1";
    return Main;
}(Model_1["default"]));
exports["default"] = Main;


/***/ }),
/* 143 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

/* harmony default export */ __webpack_exports__["a"] = (listCacheClear);


/***/ }),
/* 144 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__assocIndexOf_js__ = __webpack_require__(31);


/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = Object(__WEBPACK_IMPORTED_MODULE_0__assocIndexOf_js__["a" /* default */])(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

/* harmony default export */ __webpack_exports__["a"] = (listCacheDelete);


/***/ }),
/* 145 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__assocIndexOf_js__ = __webpack_require__(31);


/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = Object(__WEBPACK_IMPORTED_MODULE_0__assocIndexOf_js__["a" /* default */])(data, key);

  return index < 0 ? undefined : data[index][1];
}

/* harmony default export */ __webpack_exports__["a"] = (listCacheGet);


/***/ }),
/* 146 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__assocIndexOf_js__ = __webpack_require__(31);


/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__assocIndexOf_js__["a" /* default */])(this.__data__, key) > -1;
}

/* harmony default export */ __webpack_exports__["a"] = (listCacheHas);


/***/ }),
/* 147 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__assocIndexOf_js__ = __webpack_require__(31);


/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = Object(__WEBPACK_IMPORTED_MODULE_0__assocIndexOf_js__["a" /* default */])(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

/* harmony default export */ __webpack_exports__["a"] = (listCacheSet);


/***/ }),
/* 148 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ListCache_js__ = __webpack_require__(30);


/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new __WEBPACK_IMPORTED_MODULE_0__ListCache_js__["a" /* default */];
  this.size = 0;
}

/* harmony default export */ __webpack_exports__["a"] = (stackClear);


/***/ }),
/* 149 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (stackDelete);


/***/ }),
/* 150 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/* harmony default export */ __webpack_exports__["a"] = (stackGet);


/***/ }),
/* 151 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/* harmony default export */ __webpack_exports__["a"] = (stackHas);


/***/ }),
/* 152 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ListCache_js__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Map_js__ = __webpack_require__(49);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__MapCache_js__ = __webpack_require__(51);




/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof __WEBPACK_IMPORTED_MODULE_0__ListCache_js__["a" /* default */]) {
    var pairs = data.__data__;
    if (!__WEBPACK_IMPORTED_MODULE_1__Map_js__["a" /* default */] || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new __WEBPACK_IMPORTED_MODULE_2__MapCache_js__["a" /* default */](pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

/* harmony default export */ __webpack_exports__["a"] = (stackSet);


/***/ }),
/* 153 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isFunction_js__ = __webpack_require__(50);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isMasked_js__ = __webpack_require__(157);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isObject_js__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__toSource_js__ = __webpack_require__(88);





/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!Object(__WEBPACK_IMPORTED_MODULE_2__isObject_js__["a" /* default */])(value) || Object(__WEBPACK_IMPORTED_MODULE_1__isMasked_js__["a" /* default */])(value)) {
    return false;
  }
  var pattern = Object(__WEBPACK_IMPORTED_MODULE_0__isFunction_js__["default"])(value) ? reIsNative : reIsHostCtor;
  return pattern.test(Object(__WEBPACK_IMPORTED_MODULE_3__toSource_js__["a" /* default */])(value));
}

/* harmony default export */ __webpack_exports__["a"] = (baseIsNative);


/***/ }),
/* 154 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 155 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Symbol_js__ = __webpack_require__(14);


/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */].toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (getRawTag);


/***/ }),
/* 156 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/* harmony default export */ __webpack_exports__["a"] = (objectToString);


/***/ }),
/* 157 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__coreJsData_js__ = __webpack_require__(158);


/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(__WEBPACK_IMPORTED_MODULE_0__coreJsData_js__["a" /* default */] && __WEBPACK_IMPORTED_MODULE_0__coreJsData_js__["a" /* default */].keys && __WEBPACK_IMPORTED_MODULE_0__coreJsData_js__["a" /* default */].keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/* harmony default export */ __webpack_exports__["a"] = (isMasked);


/***/ }),
/* 158 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__root_js__ = __webpack_require__(4);


/** Used to detect overreaching core-js shims. */
var coreJsData = __WEBPACK_IMPORTED_MODULE_0__root_js__["a" /* default */]['__core-js_shared__'];

/* harmony default export */ __webpack_exports__["a"] = (coreJsData);


/***/ }),
/* 159 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/* harmony default export */ __webpack_exports__["a"] = (getValue);


/***/ }),
/* 160 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Hash_js__ = __webpack_require__(161);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__ListCache_js__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Map_js__ = __webpack_require__(49);




/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new __WEBPACK_IMPORTED_MODULE_0__Hash_js__["a" /* default */],
    'map': new (__WEBPACK_IMPORTED_MODULE_2__Map_js__["a" /* default */] || __WEBPACK_IMPORTED_MODULE_1__ListCache_js__["a" /* default */]),
    'string': new __WEBPACK_IMPORTED_MODULE_0__Hash_js__["a" /* default */]
  };
}

/* harmony default export */ __webpack_exports__["a"] = (mapCacheClear);


/***/ }),
/* 161 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__hashClear_js__ = __webpack_require__(162);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__hashDelete_js__ = __webpack_require__(163);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__hashGet_js__ = __webpack_require__(164);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__hashHas_js__ = __webpack_require__(165);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__hashSet_js__ = __webpack_require__(166);






/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = __WEBPACK_IMPORTED_MODULE_0__hashClear_js__["a" /* default */];
Hash.prototype['delete'] = __WEBPACK_IMPORTED_MODULE_1__hashDelete_js__["a" /* default */];
Hash.prototype.get = __WEBPACK_IMPORTED_MODULE_2__hashGet_js__["a" /* default */];
Hash.prototype.has = __WEBPACK_IMPORTED_MODULE_3__hashHas_js__["a" /* default */];
Hash.prototype.set = __WEBPACK_IMPORTED_MODULE_4__hashSet_js__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (Hash);


/***/ }),
/* 162 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__nativeCreate_js__ = __webpack_require__(32);


/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = __WEBPACK_IMPORTED_MODULE_0__nativeCreate_js__["a" /* default */] ? Object(__WEBPACK_IMPORTED_MODULE_0__nativeCreate_js__["a" /* default */])(null) : {};
  this.size = 0;
}

/* harmony default export */ __webpack_exports__["a"] = (hashClear);


/***/ }),
/* 163 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (hashDelete);


/***/ }),
/* 164 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__nativeCreate_js__ = __webpack_require__(32);


/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (__WEBPACK_IMPORTED_MODULE_0__nativeCreate_js__["a" /* default */]) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/* harmony default export */ __webpack_exports__["a"] = (hashGet);


/***/ }),
/* 165 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__nativeCreate_js__ = __webpack_require__(32);


/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return __WEBPACK_IMPORTED_MODULE_0__nativeCreate_js__["a" /* default */] ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
}

/* harmony default export */ __webpack_exports__["a"] = (hashHas);


/***/ }),
/* 166 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__nativeCreate_js__ = __webpack_require__(32);


/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (__WEBPACK_IMPORTED_MODULE_0__nativeCreate_js__["a" /* default */] && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

/* harmony default export */ __webpack_exports__["a"] = (hashSet);


/***/ }),
/* 167 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getMapData_js__ = __webpack_require__(33);


/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = Object(__WEBPACK_IMPORTED_MODULE_0__getMapData_js__["a" /* default */])(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (mapCacheDelete);


/***/ }),
/* 168 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/* harmony default export */ __webpack_exports__["a"] = (isKeyable);


/***/ }),
/* 169 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getMapData_js__ = __webpack_require__(33);


/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__getMapData_js__["a" /* default */])(this, key).get(key);
}

/* harmony default export */ __webpack_exports__["a"] = (mapCacheGet);


/***/ }),
/* 170 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getMapData_js__ = __webpack_require__(33);


/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__getMapData_js__["a" /* default */])(this, key).has(key);
}

/* harmony default export */ __webpack_exports__["a"] = (mapCacheHas);


/***/ }),
/* 171 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getMapData_js__ = __webpack_require__(33);


/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = Object(__WEBPACK_IMPORTED_MODULE_0__getMapData_js__["a" /* default */])(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

/* harmony default export */ __webpack_exports__["a"] = (mapCacheSet);


/***/ }),
/* 172 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__copyObject_js__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__keys_js__ = __webpack_require__(11);



/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return object && Object(__WEBPACK_IMPORTED_MODULE_0__copyObject_js__["a" /* default */])(source, Object(__WEBPACK_IMPORTED_MODULE_1__keys_js__["default"])(source), object);
}

/* harmony default export */ __webpack_exports__["a"] = (baseAssign);


/***/ }),
/* 173 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__ = __webpack_require__(5);



/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return Object(__WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__["a" /* default */])(value) && Object(__WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__["a" /* default */])(value) == argsTag;
}

/* harmony default export */ __webpack_exports__["a"] = (baseIsArguments);


/***/ }),
/* 174 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

/* harmony default export */ __webpack_exports__["a"] = (stubFalse);


/***/ }),
/* 175 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isLength_js__ = __webpack_require__(58);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isObjectLike_js__ = __webpack_require__(5);




/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return Object(__WEBPACK_IMPORTED_MODULE_2__isObjectLike_js__["a" /* default */])(value) &&
    Object(__WEBPACK_IMPORTED_MODULE_1__isLength_js__["a" /* default */])(value.length) && !!typedArrayTags[Object(__WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__["a" /* default */])(value)];
}

/* harmony default export */ __webpack_exports__["a"] = (baseIsTypedArray);


/***/ }),
/* 176 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isPrototype_js__ = __webpack_require__(60);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__nativeKeys_js__ = __webpack_require__(177);



/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!Object(__WEBPACK_IMPORTED_MODULE_0__isPrototype_js__["a" /* default */])(object)) {
    return Object(__WEBPACK_IMPORTED_MODULE_1__nativeKeys_js__["a" /* default */])(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (baseKeys);


/***/ }),
/* 177 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__overArg_js__ = __webpack_require__(93);


/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = Object(__WEBPACK_IMPORTED_MODULE_0__overArg_js__["a" /* default */])(Object.keys, Object);

/* harmony default export */ __webpack_exports__["a"] = (nativeKeys);


/***/ }),
/* 178 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__copyObject_js__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__keysIn_js__ = __webpack_require__(34);



/**
 * The base implementation of `_.assignIn` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssignIn(object, source) {
  return object && Object(__WEBPACK_IMPORTED_MODULE_0__copyObject_js__["a" /* default */])(source, Object(__WEBPACK_IMPORTED_MODULE_1__keysIn_js__["a" /* default */])(source), object);
}

/* harmony default export */ __webpack_exports__["a"] = (baseAssignIn);


/***/ }),
/* 179 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isObject_js__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isPrototype_js__ = __webpack_require__(60);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__nativeKeysIn_js__ = __webpack_require__(180);




/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!Object(__WEBPACK_IMPORTED_MODULE_0__isObject_js__["a" /* default */])(object)) {
    return Object(__WEBPACK_IMPORTED_MODULE_2__nativeKeysIn_js__["a" /* default */])(object);
  }
  var isProto = Object(__WEBPACK_IMPORTED_MODULE_1__isPrototype_js__["a" /* default */])(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (baseKeysIn);


/***/ }),
/* 180 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (nativeKeysIn);


/***/ }),
/* 181 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__root_js__ = __webpack_require__(4);


/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? __WEBPACK_IMPORTED_MODULE_0__root_js__["a" /* default */].Buffer : undefined,
    allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

  buffer.copy(result);
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (cloneBuffer);

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(57)(module)))

/***/ }),
/* 182 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__copyObject_js__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getSymbols_js__ = __webpack_require__(62);



/**
 * Copies own symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols(source, object) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__copyObject_js__["a" /* default */])(source, Object(__WEBPACK_IMPORTED_MODULE_1__getSymbols_js__["a" /* default */])(source), object);
}

/* harmony default export */ __webpack_exports__["a"] = (copySymbols);


/***/ }),
/* 183 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__copyObject_js__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getSymbolsIn_js__ = __webpack_require__(95);



/**
 * Copies own and inherited symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbolsIn(source, object) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__copyObject_js__["a" /* default */])(source, Object(__WEBPACK_IMPORTED_MODULE_1__getSymbolsIn_js__["a" /* default */])(source), object);
}

/* harmony default export */ __webpack_exports__["a"] = (copySymbolsIn);


/***/ }),
/* 184 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getNative_js__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__root_js__ = __webpack_require__(4);



/* Built-in method references that are verified to be native. */
var DataView = Object(__WEBPACK_IMPORTED_MODULE_0__getNative_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_1__root_js__["a" /* default */], 'DataView');

/* harmony default export */ __webpack_exports__["a"] = (DataView);


/***/ }),
/* 185 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getNative_js__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__root_js__ = __webpack_require__(4);



/* Built-in method references that are verified to be native. */
var Promise = Object(__WEBPACK_IMPORTED_MODULE_0__getNative_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_1__root_js__["a" /* default */], 'Promise');

/* harmony default export */ __webpack_exports__["a"] = (Promise);


/***/ }),
/* 186 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = new array.constructor(length);

  // Add properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (initCloneArray);


/***/ }),
/* 187 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__cloneArrayBuffer_js__ = __webpack_require__(67);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__cloneDataView_js__ = __webpack_require__(188);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__cloneRegExp_js__ = __webpack_require__(189);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__cloneSymbol_js__ = __webpack_require__(190);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__cloneTypedArray_js__ = __webpack_require__(191);






/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return Object(__WEBPACK_IMPORTED_MODULE_0__cloneArrayBuffer_js__["a" /* default */])(object);

    case boolTag:
    case dateTag:
      return new Ctor(+object);

    case dataViewTag:
      return Object(__WEBPACK_IMPORTED_MODULE_1__cloneDataView_js__["a" /* default */])(object, isDeep);

    case float32Tag: case float64Tag:
    case int8Tag: case int16Tag: case int32Tag:
    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
      return Object(__WEBPACK_IMPORTED_MODULE_4__cloneTypedArray_js__["a" /* default */])(object, isDeep);

    case mapTag:
      return new Ctor;

    case numberTag:
    case stringTag:
      return new Ctor(object);

    case regexpTag:
      return Object(__WEBPACK_IMPORTED_MODULE_2__cloneRegExp_js__["a" /* default */])(object);

    case setTag:
      return new Ctor;

    case symbolTag:
      return Object(__WEBPACK_IMPORTED_MODULE_3__cloneSymbol_js__["a" /* default */])(object);
  }
}

/* harmony default export */ __webpack_exports__["a"] = (initCloneByTag);


/***/ }),
/* 188 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__cloneArrayBuffer_js__ = __webpack_require__(67);


/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? Object(__WEBPACK_IMPORTED_MODULE_0__cloneArrayBuffer_js__["a" /* default */])(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

/* harmony default export */ __webpack_exports__["a"] = (cloneDataView);


/***/ }),
/* 189 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (cloneRegExp);


/***/ }),
/* 190 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Symbol_js__ = __webpack_require__(14);


/** Used to convert symbols to primitives and strings. */
var symbolProto = __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */].prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol(symbol) {
  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}

/* harmony default export */ __webpack_exports__["a"] = (cloneSymbol);


/***/ }),
/* 191 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__cloneArrayBuffer_js__ = __webpack_require__(67);


/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? Object(__WEBPACK_IMPORTED_MODULE_0__cloneArrayBuffer_js__["a" /* default */])(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

/* harmony default export */ __webpack_exports__["a"] = (cloneTypedArray);


/***/ }),
/* 192 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseCreate_js__ = __webpack_require__(36);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getPrototype_js__ = __webpack_require__(65);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isPrototype_js__ = __webpack_require__(60);




/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !Object(__WEBPACK_IMPORTED_MODULE_2__isPrototype_js__["a" /* default */])(object))
    ? Object(__WEBPACK_IMPORTED_MODULE_0__baseCreate_js__["a" /* default */])(Object(__WEBPACK_IMPORTED_MODULE_1__getPrototype_js__["a" /* default */])(object))
    : {};
}

/* harmony default export */ __webpack_exports__["a"] = (initCloneObject);


/***/ }),
/* 193 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseIsMap_js__ = __webpack_require__(194);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseUnary_js__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__nodeUtil_js__ = __webpack_require__(59);




/* Node.js helper references. */
var nodeIsMap = __WEBPACK_IMPORTED_MODULE_2__nodeUtil_js__["a" /* default */] && __WEBPACK_IMPORTED_MODULE_2__nodeUtil_js__["a" /* default */].isMap;

/**
 * Checks if `value` is classified as a `Map` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 * @example
 *
 * _.isMap(new Map);
 * // => true
 *
 * _.isMap(new WeakMap);
 * // => false
 */
var isMap = nodeIsMap ? Object(__WEBPACK_IMPORTED_MODULE_1__baseUnary_js__["a" /* default */])(nodeIsMap) : __WEBPACK_IMPORTED_MODULE_0__baseIsMap_js__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (isMap);


/***/ }),
/* 194 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getTag_js__ = __webpack_require__(35);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__ = __webpack_require__(5);



/** `Object#toString` result references. */
var mapTag = '[object Map]';

/**
 * The base implementation of `_.isMap` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 */
function baseIsMap(value) {
  return Object(__WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__["a" /* default */])(value) && Object(__WEBPACK_IMPORTED_MODULE_0__getTag_js__["a" /* default */])(value) == mapTag;
}

/* harmony default export */ __webpack_exports__["a"] = (baseIsMap);


/***/ }),
/* 195 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseIsSet_js__ = __webpack_require__(196);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseUnary_js__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__nodeUtil_js__ = __webpack_require__(59);




/* Node.js helper references. */
var nodeIsSet = __WEBPACK_IMPORTED_MODULE_2__nodeUtil_js__["a" /* default */] && __WEBPACK_IMPORTED_MODULE_2__nodeUtil_js__["a" /* default */].isSet;

/**
 * Checks if `value` is classified as a `Set` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 * @example
 *
 * _.isSet(new Set);
 * // => true
 *
 * _.isSet(new WeakSet);
 * // => false
 */
var isSet = nodeIsSet ? Object(__WEBPACK_IMPORTED_MODULE_1__baseUnary_js__["a" /* default */])(nodeIsSet) : __WEBPACK_IMPORTED_MODULE_0__baseIsSet_js__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (isSet);


/***/ }),
/* 196 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getTag_js__ = __webpack_require__(35);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__ = __webpack_require__(5);



/** `Object#toString` result references. */
var setTag = '[object Set]';

/**
 * The base implementation of `_.isSet` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 */
function baseIsSet(value) {
  return Object(__WEBPACK_IMPORTED_MODULE_1__isObjectLike_js__["a" /* default */])(value) && Object(__WEBPACK_IMPORTED_MODULE_0__getTag_js__["a" /* default */])(value) == setTag;
}

/* harmony default export */ __webpack_exports__["a"] = (baseIsSet);


/***/ }),
/* 197 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__constant_js__ = __webpack_require__(198);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__defineProperty_js__ = __webpack_require__(90);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__identity_js__ = __webpack_require__(18);




/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !__WEBPACK_IMPORTED_MODULE_1__defineProperty_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_2__identity_js__["a" /* default */] : function(func, string) {
  return Object(__WEBPACK_IMPORTED_MODULE_1__defineProperty_js__["a" /* default */])(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': Object(__WEBPACK_IMPORTED_MODULE_0__constant_js__["a" /* default */])(string),
    'writable': true
  });
};

/* harmony default export */ __webpack_exports__["a"] = (baseSetToString);


/***/ }),
/* 198 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

/* harmony default export */ __webpack_exports__["a"] = (constant);


/***/ }),
/* 199 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__basePickBy_js__ = __webpack_require__(104);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__hasIn_js__ = __webpack_require__(106);



/**
 * The base implementation of `_.pick` without support for individual
 * property identifiers.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} paths The property paths to pick.
 * @returns {Object} Returns the new object.
 */
function basePick(object, paths) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__basePickBy_js__["a" /* default */])(object, paths, function(value, path) {
    return Object(__WEBPACK_IMPORTED_MODULE_1__hasIn_js__["a" /* default */])(object, path);
  });
}

/* harmony default export */ __webpack_exports__["a"] = (basePick);


/***/ }),
/* 200 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__memoizeCapped_js__ = __webpack_require__(201);


/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = Object(__WEBPACK_IMPORTED_MODULE_0__memoizeCapped_js__["a" /* default */])(function(string) {
  var result = [];
  if (string.charCodeAt(0) === 46 /* . */) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

/* harmony default export */ __webpack_exports__["a"] = (stringToPath);


/***/ }),
/* 201 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__memoize_js__ = __webpack_require__(202);


/** Used as the maximum memoize cache size. */
var MAX_MEMOIZE_SIZE = 500;

/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */
function memoizeCapped(func) {
  var result = Object(__WEBPACK_IMPORTED_MODULE_0__memoize_js__["a" /* default */])(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });

  var cache = result.cache;
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (memoizeCapped);


/***/ }),
/* 202 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__MapCache_js__ = __webpack_require__(51);


/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || __WEBPACK_IMPORTED_MODULE_0__MapCache_js__["a" /* default */]);
  return memoized;
}

// Expose `MapCache`.
memoize.Cache = __WEBPACK_IMPORTED_MODULE_0__MapCache_js__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (memoize);


/***/ }),
/* 203 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Symbol_js__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__arrayMap_js__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isArray_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isSymbol_js__ = __webpack_require__(25);





/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */].prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (Object(__WEBPACK_IMPORTED_MODULE_2__isArray_js__["default"])(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return Object(__WEBPACK_IMPORTED_MODULE_1__arrayMap_js__["a" /* default */])(value, baseToString) + '';
  }
  if (Object(__WEBPACK_IMPORTED_MODULE_3__isSymbol_js__["a" /* default */])(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/* harmony default export */ __webpack_exports__["a"] = (baseToString);


/***/ }),
/* 204 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__assignValue_js__ = __webpack_require__(53);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__castPath_js__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isIndex_js__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isObject_js__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__toKey_js__ = __webpack_require__(20);






/**
 * The base implementation of `_.set`.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @param {Function} [customizer] The function to customize path creation.
 * @returns {Object} Returns `object`.
 */
function baseSet(object, path, value, customizer) {
  if (!Object(__WEBPACK_IMPORTED_MODULE_3__isObject_js__["a" /* default */])(object)) {
    return object;
  }
  path = Object(__WEBPACK_IMPORTED_MODULE_1__castPath_js__["a" /* default */])(path, object);

  var index = -1,
      length = path.length,
      lastIndex = length - 1,
      nested = object;

  while (nested != null && ++index < length) {
    var key = Object(__WEBPACK_IMPORTED_MODULE_4__toKey_js__["a" /* default */])(path[index]),
        newValue = value;

    if (index != lastIndex) {
      var objValue = nested[key];
      newValue = customizer ? customizer(objValue, key, nested) : undefined;
      if (newValue === undefined) {
        newValue = Object(__WEBPACK_IMPORTED_MODULE_3__isObject_js__["a" /* default */])(objValue)
          ? objValue
          : (Object(__WEBPACK_IMPORTED_MODULE_2__isIndex_js__["a" /* default */])(path[index + 1]) ? [] : {});
      }
    }
    Object(__WEBPACK_IMPORTED_MODULE_0__assignValue_js__["a" /* default */])(nested, key, newValue);
    nested = nested[key];
  }
  return object;
}

/* harmony default export */ __webpack_exports__["a"] = (baseSet);


/***/ }),
/* 205 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * The base implementation of `_.hasIn` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}

/* harmony default export */ __webpack_exports__["a"] = (baseHasIn);


/***/ }),
/* 206 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Symbol_js__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isArguments_js__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isArray_js__ = __webpack_require__(1);




/** Built-in value references. */
var spreadableSymbol = __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */].isConcatSpreadable : undefined;

/**
 * Checks if `value` is a flattenable `arguments` object or array.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */
function isFlattenable(value) {
  return Object(__WEBPACK_IMPORTED_MODULE_2__isArray_js__["default"])(value) || Object(__WEBPACK_IMPORTED_MODULE_1__isArguments_js__["a" /* default */])(value) ||
    !!(spreadableSymbol && value && value[spreadableSymbol]);
}

/* harmony default export */ __webpack_exports__["a"] = (isFlattenable);


/***/ }),
/* 207 */
/***/ (function(module, exports, __webpack_require__) {

// stats.js - http://github.com/mrdoob/stats.js
(function(f,e){ true?module.exports=e():"function"===typeof define&&define.amd?define(e):f.Stats=e()})(this,function(){var f=function(){function e(a){c.appendChild(a.dom);return a}function u(a){for(var d=0;d<c.children.length;d++)c.children[d].style.display=d===a?"block":"none";l=a}var l=0,c=document.createElement("div");c.style.cssText="position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000";c.addEventListener("click",function(a){a.preventDefault();
u(++l%c.children.length)},!1);var k=(performance||Date).now(),g=k,a=0,r=e(new f.Panel("FPS","#0ff","#002")),h=e(new f.Panel("MS","#0f0","#020"));if(self.performance&&self.performance.memory)var t=e(new f.Panel("MB","#f08","#201"));u(0);return{REVISION:16,dom:c,addPanel:e,showPanel:u,begin:function(){k=(performance||Date).now()},end:function(){a++;var c=(performance||Date).now();h.update(c-k,200);if(c>g+1E3&&(r.update(1E3*a/(c-g),100),g=c,a=0,t)){var d=performance.memory;t.update(d.usedJSHeapSize/
1048576,d.jsHeapSizeLimit/1048576)}return c},update:function(){k=this.end()},domElement:c,setMode:u}};f.Panel=function(e,f,l){var c=Infinity,k=0,g=Math.round,a=g(window.devicePixelRatio||1),r=80*a,h=48*a,t=3*a,v=2*a,d=3*a,m=15*a,n=74*a,p=30*a,q=document.createElement("canvas");q.width=r;q.height=h;q.style.cssText="width:80px;height:48px";var b=q.getContext("2d");b.font="bold "+9*a+"px Helvetica,Arial,sans-serif";b.textBaseline="top";b.fillStyle=l;b.fillRect(0,0,r,h);b.fillStyle=f;b.fillText(e,t,v);
b.fillRect(d,m,n,p);b.fillStyle=l;b.globalAlpha=.9;b.fillRect(d,m,n,p);return{dom:q,update:function(h,w){c=Math.min(c,h);k=Math.max(k,h);b.fillStyle=l;b.globalAlpha=1;b.fillRect(0,0,r,m);b.fillStyle=f;b.fillText(g(h)+" "+e+" ("+g(c)+"-"+g(k)+")",t,v);b.drawImage(q,d+a,m,n-a,p,d,m,n-a,p);b.fillRect(d+n-a,m,a,p);b.fillStyle=l;b.globalAlpha=.9;b.fillRect(d+n-a,m,a,g((1-h/w)*p))}}};return f});


/***/ }),
/* 208 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
var builtinResourcePack = {
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
        "avsres_texer_square_sharp_250x250.bmp",
    ],
    name: "Builtin",
    prefix: "https://unpkg.com/webvs@2.0.1/resources/"
};
exports["default"] = builtinResourcePack;


/***/ }),
/* 209 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
/**
 * A Registry of Component classes.
 *
 * ComponentRegistry maintains a map from Component name
 * to Component class constructors. Typically used through the [[Main.componentRegistry]]
 */
var ComponentRegistry = /** @class */ (function () {
    /**
     * construct a ComponentRegistry with an initial set of Component class
     * constructors.
     * @param componentClasses one or more Component class constructors
     */
    function ComponentRegistry(componentClasses) {
        this.components = {};
        this.tags = [];
        if (componentClasses) {
            this.addComponent(componentClasses);
        }
    }
    /**
     * Add a Component class constructor into the registry. Each constructor is mapped
     * to the static [[Component.componentName]] value of the class.
     * @param componentClasses one or more Component class constructors to be added
     */
    ComponentRegistry.prototype.addComponent = function (componentClasses) {
        var _this = this;
        if (!Array.isArray(componentClasses)) {
            componentClasses = [componentClasses];
        }
        componentClasses.forEach(function (componentClass) {
            var name = componentClass.getComponentName();
            if (name in _this.components) {
                throw new Error("Component " + name + " already exists in the registry");
            }
            _this.components[name] = componentClass;
            if (_this.tags.indexOf(componentClass.getComponentTag()) === -1) {
                _this.tags.push(componentClass.getComponentTag());
            }
        });
    };
    /**
     * Returns the Component class constructor mapped to the given name
     * @param name componentName of the Component class to be retrieved
     */
    ComponentRegistry.prototype.getComponentClass = function (name) {
        return this.components[name];
    };
    /**
     * Returns all components with given tag
     * @param tag of component classes to be returned
     */
    ComponentRegistry.prototype.getComponentClassesByTag = function (tag) {
        var _this = this;
        return Object.keys(this.components)
            .map(function (name) { return _this.components[name]; })
            .filter(function (componentClass) { return componentClass.getComponentTag() === tag; });
    };
    return ComponentRegistry;
}());
exports["default"] = ComponentRegistry;


/***/ }),
/* 210 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Container_1 = __webpack_require__(211);
var compileExpr_1 = __webpack_require__(28);
var TextureSetManager_1 = __webpack_require__(138);
/**
 * BlendModes supported by Effectlist
 */
var ELBlendMode;
(function (ELBlendMode) {
    ELBlendMode[ELBlendMode["REPLACE"] = 1] = "REPLACE";
    ELBlendMode[ELBlendMode["MAXIMUM"] = 2] = "MAXIMUM";
    ELBlendMode[ELBlendMode["AVERAGE"] = 3] = "AVERAGE";
    ELBlendMode[ELBlendMode["ADDITIVE"] = 4] = "ADDITIVE";
    ELBlendMode[ELBlendMode["SUBTRACTIVE1"] = 5] = "SUBTRACTIVE1";
    ELBlendMode[ELBlendMode["SUBTRACTIVE2"] = 6] = "SUBTRACTIVE2";
    ELBlendMode[ELBlendMode["MULTIPLY"] = 7] = "MULTIPLY";
    ELBlendMode[ELBlendMode["MULTIPLY2"] = 8] = "MULTIPLY2";
    ELBlendMode[ELBlendMode["ADJUSTABLE"] = 9] = "ADJUSTABLE";
    ELBlendMode[ELBlendMode["ALPHA"] = 10] = "ALPHA";
    ELBlendMode[ELBlendMode["IGNORE"] = 11] = "IGNORE";
})(ELBlendMode = exports.ELBlendMode || (exports.ELBlendMode = {}));
/**
 * Effectlist is a container that renders components to a separate buffer. And blends
 * it in with the parent buffer.
 *
 * An implicit Effeclist is also created by [[Main]] as a root component.
 */
var EffectList = /** @class */ (function (_super) {
    __extends(EffectList, _super);
    function EffectList(main, parent, opts) {
        var _this = _super.call(this, main, parent, opts) || this;
        _this.inited = false;
        return _this;
    }
    EffectList.prototype.init = function () {
        _super.prototype.init.call(this);
        var tsm = new TextureSetManager_1["default"](this.main.getRctx(), this.main.getCopier(), this.parent ? false : true);
        this.setTSM(tsm);
        this.updateCode();
        this.updateBlendMode(this.opts.input, "input");
        this.updateBlendMode(this.opts.output, "output");
        this.frameCounter = 0;
        this.first = true;
        this.listenTo(this.main, "resize", this.handleResize);
    };
    EffectList.prototype.draw = function () {
        var opts = this.opts;
        if (opts.enableOnBeat) {
            if (this.main.getAnalyser().isBeat()) {
                this.frameCounter = opts.enableOnBeatFor;
            }
            else if (this.frameCounter > 0) {
                this.frameCounter--;
            }
            // only enable for enableOnBeatFor # of frames
            if (this.frameCounter === 0) {
                return;
            }
        }
        this.code.beat = this.main.getAnalyser().isBeat() ? 1 : 0;
        this.code.enabled = 1;
        this.code.clear = opts.clearFrame ? 1 : 0;
        if (!this.inited) {
            this.inited = true;
            this.code.init();
        }
        this.code.perFrame();
        if (this.code.enabled === 0) {
            return;
        }
        // set rendertarget to internal framebuffer
        this.getTSM().setAsRenderTarget();
        // clear frame
        if (opts.clearFrame || this.first || this.code.clear) {
            var gl = this.main.getRctx().getGl();
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            this.first = false;
        }
        // blend input texture onto internal texture
        if (this.input !== ELBlendMode.IGNORE) {
            var inputTexture = this.parent.getTSM().getCurrentTexture();
            this.main.getCopier().run(this.getTSM(), { srcTexture: inputTexture }, this.input);
        }
        // render all the components
        // for (let i = 0; i < this.components.length; i++) {
        for (var _i = 0, _a = this.components; _i < _a.length; _i++) {
            var component = _a[_i];
            if (component.isEnabled()) {
                component.draw();
            }
        }
        // switch to old framebuffer
        this.getTSM().unsetAsRenderTarget();
        // blend current texture to the output framebuffer
        if (this.output !== ELBlendMode.IGNORE) {
            if (this.parent) {
                this.main.getCopier().run(this.parent.getTSM(), { srcTexture: this.getTSM().getCurrentTexture() }, this.output);
            }
            else {
                this.main.getCopier().run(null, { srcTexture: this.getTSM().getCurrentTexture() });
            }
        }
    };
    EffectList.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        if (this.getTSM()) {
            // destroy the framebuffer manager
            this.getTSM().destroy();
        }
    };
    EffectList.prototype.updateCode = function () {
        this.code = compileExpr_1["default"](this.opts.code, ["init", "perFrame"]).codeInst;
        this.code.setup(this.main);
        this.inited = false;
    };
    EffectList.prototype.updateBlendMode = function (value, name) {
        if (name === "input") {
            this.input = ELBlendMode[value];
        }
        else {
            this.output = ELBlendMode[value];
        }
    };
    EffectList.prototype.handleResize = function () {
        this.getTSM().resize();
        this.code.updateDimVars(this.main.getRctx().getGl());
    };
    EffectList.componentName = "EffectList";
    EffectList.componentTag = "";
    EffectList.defaultOptions = {
        clearFrame: false,
        code: {
            init: "",
            perFrame: ""
        },
        enableOnBeat: false,
        enableOnBeatFor: 1,
        input: "IGNORE",
        output: "REPLACE"
    };
    EffectList.optUpdateHandlers = {
        code: "updateCode",
        input: "updateBlendMode",
        output: "updateBlendMode"
    };
    return EffectList;
}(Container_1["default"]));
exports["default"] = EffectList;


/***/ }),
/* 211 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var defaults_1 = __webpack_require__(24);
var isString_1 = __webpack_require__(73);
var Component_1 = __webpack_require__(2);
/**
 * A Base class for all Components that have a sub component.
 *
 * Manages, cloning and component tree operations.
 */
var Container = /** @class */ (function (_super) {
    __extends(Container, _super);
    /**
     * See [[Component.constructor]]
     */
    function Container(main, parent, opts) {
        var _this = _super.call(this, main, parent, opts) || this;
        delete _this.opts.components;
        return _this;
    }
    /**
     * Returns the TextSetManager for this component.
     *
     * A container inherits TextureSetManager from it's own parent
     * unless explicitly overridden by Subclass
     */
    Container.prototype.getTSM = function () {
        return this.tsm;
    };
    /**
     * Initializes Container. Please override to implement component specific initialization
     *
     * Container init basically instantiates all subcomponents from the `components` option.
     * It also initializes the TextureSetManager to the parent's.
     */
    Container.prototype.init = function () {
        var components = [];
        if (this.opts.components) {
            for (var _i = 0, _a = this.opts.components; _i < _a.length; _i++) {
                var opts = _a[_i];
                var componentClass = this.main.getComponentRegistry().getComponentClass(opts.type);
                if (!componentClass) {
                    // tslint:disable-next-line:no-console
                    console.warn("Unknown ComponentClass: " + opts.type + ". Skipping.");
                    continue;
                }
                var component = new componentClass(this.main, this, opts);
                components.push(component);
            }
        }
        this.components = components;
        this.tsm = this.parent && this.parent.getTSM();
    };
    /**
     * Destroy all subcomponents and itself.
     */
    Container.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        for (var _i = 0, _a = this.components; _i < _a.length; _i++) {
            var component = _a[_i];
            component.destroy();
        }
    };
    /**
     * Adds new sub component in this Container
     *
     * Once component is inserted, an `addComponent` event is fired with the following arguments:
     * 1. The newly created component
     * 2. This container
     * 3. Additional params passed in to this call
     *
     * @param componentOpts options for the new sub-component
     * @param pos the position at which the sub-component should be inserted. Defaults to appending
     * @param params additional params to be passed down the the `addComponent` event
     */
    Container.prototype.addComponent = function (componentOpts, pos, params) {
        if (pos === void 0) { pos = this.components.length; }
        if (params === void 0) { params = {}; }
        var component;
        if (componentOpts instanceof Component_1["default"]) {
            component = componentOpts;
            component.setParent(this);
        }
        else {
            var componentClass = this.main.getComponentRegistry().getComponentClass(componentOpts.type);
            if (!componentClass) {
                // tslint:disable-next-line:no-console
                console.warn("Unknown ComponentClass: " + componentOpts.type + ".");
                return null;
            }
            component = new componentClass(this.main, this, componentOpts);
        }
        this.components.splice(pos, 0, component);
        params = defaults_1["default"]({ pos: pos }, params);
        this.emit("addComponent", component, this, params);
        return component;
    };
    /**
     * Detaches a component from this container and returns it.
     *
     * Once component is detached, a `detachComponent` event is fired with following arguments.
     * 1. The newly created component
     * 2. This container
     * 3. Additional params passed in to this call
     *
     * @param pos The position from which component should be detached
     * @param params additional params to be passed down the the `detachComponent` event
     */
    Container.prototype.detachComponent = function (pos, params) {
        if (params === void 0) { params = {}; }
        if (isString_1["default"](pos)) {
            var id = pos;
            var i = void 0;
            for (i = 0; i < this.components.length; i++) {
                if (this.components[i].getId() === id) {
                    pos = i;
                    break;
                }
            }
            if (i === this.components.length) {
                return;
            }
        }
        var component = this.components[pos];
        this.components.splice(pos, 1);
        params = defaults_1["default"]({ pos: pos }, params);
        this.emit("detachComponent", component, this, params);
        return component;
    };
    /**
     * Returns a sub-component under hierarchy of this Container with the given id
     * @param id id of the component to find
     */
    Container.prototype.findComponent = function (id) {
        for (var _i = 0, _a = this.components; _i < _a.length; _i++) {
            var component = _a[_i];
            if (component.getId() === id) {
                return component;
            }
        }
        // search in any subcontainers
        for (var _b = 0, _c = this.components; _b < _c.length; _b++) {
            var container = _c[_b];
            if (!(container instanceof Container)) {
                continue;
            }
            var subComponent = container.findComponent(id);
            if (subComponent) {
                return subComponent;
            }
        }
    };
    /**
     * Returns the JSON representation of the component options.
     */
    Container.prototype.toJSON = function () {
        var opts = _super.prototype.toJSON.call(this);
        opts.components = [];
        for (var _i = 0, _a = this.components; _i < _a.length; _i++) {
            var component = _a[_i];
            opts.components.push(component.toJSON());
        }
        return opts;
    };
    /**
     * sets the frambuffer manager for this container
     * @param tsm the frambuffermanager
     */
    Container.prototype.setTSM = function (tsm) {
        this.tsm = tsm;
    };
    return Container;
}(Component_1["default"]));
exports["default"] = Container;


/***/ }),
/* 212 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Stack_js__ = __webpack_require__(48);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__equalArrays_js__ = __webpack_require__(109);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__equalByTag_js__ = __webpack_require__(216);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__equalObjects_js__ = __webpack_require__(218);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__getTag_js__ = __webpack_require__(35);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__isArray_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__isBuffer_js__ = __webpack_require__(56);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__isTypedArray_js__ = __webpack_require__(92);









/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = Object(__WEBPACK_IMPORTED_MODULE_5__isArray_js__["default"])(object),
      othIsArr = Object(__WEBPACK_IMPORTED_MODULE_5__isArray_js__["default"])(other),
      objTag = objIsArr ? arrayTag : Object(__WEBPACK_IMPORTED_MODULE_4__getTag_js__["a" /* default */])(object),
      othTag = othIsArr ? arrayTag : Object(__WEBPACK_IMPORTED_MODULE_4__getTag_js__["a" /* default */])(other);

  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;

  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && Object(__WEBPACK_IMPORTED_MODULE_6__isBuffer_js__["a" /* default */])(object)) {
    if (!Object(__WEBPACK_IMPORTED_MODULE_6__isBuffer_js__["a" /* default */])(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new __WEBPACK_IMPORTED_MODULE_0__Stack_js__["a" /* default */]);
    return (objIsArr || Object(__WEBPACK_IMPORTED_MODULE_7__isTypedArray_js__["a" /* default */])(object))
      ? Object(__WEBPACK_IMPORTED_MODULE_1__equalArrays_js__["a" /* default */])(object, other, bitmask, customizer, equalFunc, stack)
      : Object(__WEBPACK_IMPORTED_MODULE_2__equalByTag_js__["a" /* default */])(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new __WEBPACK_IMPORTED_MODULE_0__Stack_js__["a" /* default */]);
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new __WEBPACK_IMPORTED_MODULE_0__Stack_js__["a" /* default */]);
  return Object(__WEBPACK_IMPORTED_MODULE_3__equalObjects_js__["a" /* default */])(object, other, bitmask, customizer, equalFunc, stack);
}

/* harmony default export */ __webpack_exports__["a"] = (baseIsEqualDeep);


/***/ }),
/* 213 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

/* harmony default export */ __webpack_exports__["a"] = (setCacheAdd);


/***/ }),
/* 214 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

/* harmony default export */ __webpack_exports__["a"] = (setCacheHas);


/***/ }),
/* 215 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

/* harmony default export */ __webpack_exports__["a"] = (arraySome);


/***/ }),
/* 216 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Symbol_js__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Uint8Array_js__ = __webpack_require__(100);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__eq_js__ = __webpack_require__(22);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__equalArrays_js__ = __webpack_require__(109);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__mapToArray_js__ = __webpack_require__(217);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__setToArray_js__ = __webpack_require__(75);







/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]';

/** Used to convert symbols to primitives and strings. */
var symbolProto = __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */].prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new __WEBPACK_IMPORTED_MODULE_1__Uint8Array_js__["a" /* default */](object), new __WEBPACK_IMPORTED_MODULE_1__Uint8Array_js__["a" /* default */](other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return Object(__WEBPACK_IMPORTED_MODULE_2__eq_js__["a" /* default */])(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = __WEBPACK_IMPORTED_MODULE_4__mapToArray_js__["a" /* default */];

    case setTag:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
      convert || (convert = __WEBPACK_IMPORTED_MODULE_5__setToArray_js__["a" /* default */]);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = Object(__WEBPACK_IMPORTED_MODULE_3__equalArrays_js__["a" /* default */])(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

/* harmony default export */ __webpack_exports__["a"] = (equalByTag);


/***/ }),
/* 217 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (mapToArray);


/***/ }),
/* 218 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__getAllKeys_js__ = __webpack_require__(96);


/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      objProps = Object(__WEBPACK_IMPORTED_MODULE_0__getAllKeys_js__["a" /* default */])(object),
      objLength = objProps.length,
      othProps = Object(__WEBPACK_IMPORTED_MODULE_0__getAllKeys_js__["a" /* default */])(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (equalObjects);


/***/ }),
/* 219 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayMap_js__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseClone_js__ = __webpack_require__(86);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__baseUnset_js__ = __webpack_require__(220);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__castPath_js__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__copyObject_js__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__customOmitClone_js__ = __webpack_require__(222);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__flatRest_js__ = __webpack_require__(72);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__getAllKeysIn_js__ = __webpack_require__(66);









/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1,
    CLONE_FLAT_FLAG = 2,
    CLONE_SYMBOLS_FLAG = 4;

/**
 * The opposite of `_.pick`; this method creates an object composed of the
 * own and inherited enumerable property paths of `object` that are not omitted.
 *
 * **Note:** This method is considerably slower than `_.pick`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {...(string|string[])} [paths] The property paths to omit.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.omit(object, ['a', 'c']);
 * // => { 'b': '2' }
 */
var omit = Object(__WEBPACK_IMPORTED_MODULE_6__flatRest_js__["a" /* default */])(function(object, paths) {
  var result = {};
  if (object == null) {
    return result;
  }
  var isDeep = false;
  paths = Object(__WEBPACK_IMPORTED_MODULE_0__arrayMap_js__["a" /* default */])(paths, function(path) {
    path = Object(__WEBPACK_IMPORTED_MODULE_3__castPath_js__["a" /* default */])(path, object);
    isDeep || (isDeep = path.length > 1);
    return path;
  });
  Object(__WEBPACK_IMPORTED_MODULE_4__copyObject_js__["a" /* default */])(object, Object(__WEBPACK_IMPORTED_MODULE_7__getAllKeysIn_js__["a" /* default */])(object), result);
  if (isDeep) {
    result = Object(__WEBPACK_IMPORTED_MODULE_1__baseClone_js__["a" /* default */])(result, CLONE_DEEP_FLAG | CLONE_FLAT_FLAG | CLONE_SYMBOLS_FLAG, __WEBPACK_IMPORTED_MODULE_5__customOmitClone_js__["a" /* default */]);
  }
  var length = paths.length;
  while (length--) {
    Object(__WEBPACK_IMPORTED_MODULE_2__baseUnset_js__["a" /* default */])(result, paths[length]);
  }
  return result;
});

/* harmony default export */ __webpack_exports__["default"] = (omit);


/***/ }),
/* 220 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__castPath_js__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__last_js__ = __webpack_require__(111);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__parent_js__ = __webpack_require__(221);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__toKey_js__ = __webpack_require__(20);





/**
 * The base implementation of `_.unset`.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {Array|string} path The property path to unset.
 * @returns {boolean} Returns `true` if the property is deleted, else `false`.
 */
function baseUnset(object, path) {
  path = Object(__WEBPACK_IMPORTED_MODULE_0__castPath_js__["a" /* default */])(path, object);
  object = Object(__WEBPACK_IMPORTED_MODULE_2__parent_js__["a" /* default */])(object, path);
  return object == null || delete object[Object(__WEBPACK_IMPORTED_MODULE_3__toKey_js__["a" /* default */])(Object(__WEBPACK_IMPORTED_MODULE_1__last_js__["default"])(path))];
}

/* harmony default export */ __webpack_exports__["a"] = (baseUnset);


/***/ }),
/* 221 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGet_js__ = __webpack_require__(37);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseSlice_js__ = __webpack_require__(41);



/**
 * Gets the parent value at `path` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} path The path to get the parent value of.
 * @returns {*} Returns the parent value.
 */
function parent(object, path) {
  return path.length < 2 ? object : Object(__WEBPACK_IMPORTED_MODULE_0__baseGet_js__["a" /* default */])(object, Object(__WEBPACK_IMPORTED_MODULE_1__baseSlice_js__["a" /* default */])(path, 0, -1));
}

/* harmony default export */ __webpack_exports__["a"] = (parent);


/***/ }),
/* 222 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isPlainObject_js__ = __webpack_require__(223);


/**
 * Used by `_.omit` to customize its `_.cloneDeep` use to only clone plain
 * objects.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {string} key The key of the property to inspect.
 * @returns {*} Returns the uncloned value or `undefined` to defer cloning to `_.cloneDeep`.
 */
function customOmitClone(value) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__isPlainObject_js__["a" /* default */])(value) ? undefined : value;
}

/* harmony default export */ __webpack_exports__["a"] = (customOmitClone);


/***/ }),
/* 223 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getPrototype_js__ = __webpack_require__(65);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isObjectLike_js__ = __webpack_require__(5);




/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!Object(__WEBPACK_IMPORTED_MODULE_2__isObjectLike_js__["a" /* default */])(value) || Object(__WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__["a" /* default */])(value) != objectTag) {
    return false;
  }
  var proto = Object(__WEBPACK_IMPORTED_MODULE_1__getPrototype_js__["a" /* default */])(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString;
}

/* harmony default export */ __webpack_exports__["a"] = (isPlainObject);


/***/ }),
/* 224 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__toString_js__ = __webpack_require__(105);


/** Used to generate unique IDs. */
var idCounter = 0;

/**
 * Generates a unique ID. If `prefix` is given, the ID is appended to it.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {string} [prefix=''] The value to prefix the ID with.
 * @returns {string} Returns the unique ID.
 * @example
 *
 * _.uniqueId('contact_');
 * // => 'contact_104'
 *
 * _.uniqueId();
 * // => '105'
 */
function uniqueId(prefix) {
  var id = ++idCounter;
  return Object(__WEBPACK_IMPORTED_MODULE_0__toString_js__["a" /* default */])(prefix) + id;
}

/* harmony default export */ __webpack_exports__["default"] = (uniqueId);


/***/ }),
/* 225 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if (true) {
  module.exports = EventEmitter;
}


/***/ }),
/* 226 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayFilter_js__ = __webpack_require__(63);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseFilter_js__ = __webpack_require__(227);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__baseIteratee_js__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isArray_js__ = __webpack_require__(1);





/**
 * Iterates over elements of `collection`, returning an array of all elements
 * `predicate` returns truthy for. The predicate is invoked with three
 * arguments: (value, index|key, collection).
 *
 * **Note:** Unlike `_.remove`, this method returns a new array.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 * @see _.reject
 * @example
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36, 'active': true },
 *   { 'user': 'fred',   'age': 40, 'active': false }
 * ];
 *
 * _.filter(users, function(o) { return !o.active; });
 * // => objects for ['fred']
 *
 * // The `_.matches` iteratee shorthand.
 * _.filter(users, { 'age': 36, 'active': true });
 * // => objects for ['barney']
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.filter(users, ['active', false]);
 * // => objects for ['fred']
 *
 * // The `_.property` iteratee shorthand.
 * _.filter(users, 'active');
 * // => objects for ['barney']
 */
function filter(collection, predicate) {
  var func = Object(__WEBPACK_IMPORTED_MODULE_3__isArray_js__["default"])(collection) ? __WEBPACK_IMPORTED_MODULE_0__arrayFilter_js__["a" /* default */] : __WEBPACK_IMPORTED_MODULE_1__baseFilter_js__["a" /* default */];
  return func(collection, Object(__WEBPACK_IMPORTED_MODULE_2__baseIteratee_js__["a" /* default */])(predicate, 3));
}

/* harmony default export */ __webpack_exports__["default"] = (filter);


/***/ }),
/* 227 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseEach_js__ = __webpack_require__(42);


/**
 * The base implementation of `_.filter` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function baseFilter(collection, predicate) {
  var result = [];
  Object(__WEBPACK_IMPORTED_MODULE_0__baseEach_js__["a" /* default */])(collection, function(value, index, collection) {
    if (predicate(value, index, collection)) {
      result.push(value);
    }
  });
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (baseFilter);


/***/ }),
/* 228 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseFor_js__ = __webpack_require__(229);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__keys_js__ = __webpack_require__(11);



/**
 * The base implementation of `_.forOwn` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return object && Object(__WEBPACK_IMPORTED_MODULE_0__baseFor_js__["a" /* default */])(object, iteratee, __WEBPACK_IMPORTED_MODULE_1__keys_js__["default"]);
}

/* harmony default export */ __webpack_exports__["a"] = (baseForOwn);


/***/ }),
/* 229 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__createBaseFor_js__ = __webpack_require__(230);


/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = Object(__WEBPACK_IMPORTED_MODULE_0__createBaseFor_js__["a" /* default */])();

/* harmony default export */ __webpack_exports__["a"] = (baseFor);


/***/ }),
/* 230 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

/* harmony default export */ __webpack_exports__["a"] = (createBaseFor);


/***/ }),
/* 231 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isArrayLike_js__ = __webpack_require__(17);


/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!Object(__WEBPACK_IMPORTED_MODULE_0__isArrayLike_js__["a" /* default */])(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length,
        index = fromRight ? length : -1,
        iterable = Object(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

/* harmony default export */ __webpack_exports__["a"] = (createBaseEach);


/***/ }),
/* 232 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseIsMatch_js__ = __webpack_require__(233);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getMatchData_js__ = __webpack_require__(234);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__matchesStrictComparable_js__ = __webpack_require__(113);




/**
 * The base implementation of `_.matches` which doesn't clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatches(source) {
  var matchData = Object(__WEBPACK_IMPORTED_MODULE_1__getMatchData_js__["a" /* default */])(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return Object(__WEBPACK_IMPORTED_MODULE_2__matchesStrictComparable_js__["a" /* default */])(matchData[0][0], matchData[0][1]);
  }
  return function(object) {
    return object === source || Object(__WEBPACK_IMPORTED_MODULE_0__baseIsMatch_js__["a" /* default */])(object, source, matchData);
  };
}

/* harmony default export */ __webpack_exports__["a"] = (baseMatches);


/***/ }),
/* 233 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Stack_js__ = __webpack_require__(48);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseIsEqual_js__ = __webpack_require__(74);



/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * The base implementation of `_.isMatch` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @param {Array} matchData The property names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, source, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var stack = new __WEBPACK_IMPORTED_MODULE_0__Stack_js__["a" /* default */];
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === undefined
            ? Object(__WEBPACK_IMPORTED_MODULE_1__baseIsEqual_js__["a" /* default */])(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack)
            : result
          )) {
        return false;
      }
    }
  }
  return true;
}

/* harmony default export */ __webpack_exports__["a"] = (baseIsMatch);


/***/ }),
/* 234 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isStrictComparable_js__ = __webpack_require__(112);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__keys_js__ = __webpack_require__(11);



/**
 * Gets the property names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = Object(__WEBPACK_IMPORTED_MODULE_1__keys_js__["default"])(object),
      length = result.length;

  while (length--) {
    var key = result[length],
        value = object[key];

    result[length] = [key, value, Object(__WEBPACK_IMPORTED_MODULE_0__isStrictComparable_js__["a" /* default */])(value)];
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (getMatchData);


/***/ }),
/* 235 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseIsEqual_js__ = __webpack_require__(74);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__get_js__ = __webpack_require__(236);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__hasIn_js__ = __webpack_require__(106);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isKey_js__ = __webpack_require__(71);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__isStrictComparable_js__ = __webpack_require__(112);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__matchesStrictComparable_js__ = __webpack_require__(113);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__toKey_js__ = __webpack_require__(20);








/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatchesProperty(path, srcValue) {
  if (Object(__WEBPACK_IMPORTED_MODULE_3__isKey_js__["a" /* default */])(path) && Object(__WEBPACK_IMPORTED_MODULE_4__isStrictComparable_js__["a" /* default */])(srcValue)) {
    return Object(__WEBPACK_IMPORTED_MODULE_5__matchesStrictComparable_js__["a" /* default */])(Object(__WEBPACK_IMPORTED_MODULE_6__toKey_js__["a" /* default */])(path), srcValue);
  }
  return function(object) {
    var objValue = Object(__WEBPACK_IMPORTED_MODULE_1__get_js__["a" /* default */])(object, path);
    return (objValue === undefined && objValue === srcValue)
      ? Object(__WEBPACK_IMPORTED_MODULE_2__hasIn_js__["a" /* default */])(object, path)
      : Object(__WEBPACK_IMPORTED_MODULE_0__baseIsEqual_js__["a" /* default */])(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
  };
}

/* harmony default export */ __webpack_exports__["a"] = (baseMatchesProperty);


/***/ }),
/* 236 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGet_js__ = __webpack_require__(37);


/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get(object, path, defaultValue) {
  var result = object == null ? undefined : Object(__WEBPACK_IMPORTED_MODULE_0__baseGet_js__["a" /* default */])(object, path);
  return result === undefined ? defaultValue : result;
}

/* harmony default export */ __webpack_exports__["a"] = (get);


/***/ }),
/* 237 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseProperty_js__ = __webpack_require__(114);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__basePropertyDeep_js__ = __webpack_require__(238);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isKey_js__ = __webpack_require__(71);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__toKey_js__ = __webpack_require__(20);





/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */
function property(path) {
  return Object(__WEBPACK_IMPORTED_MODULE_2__isKey_js__["a" /* default */])(path) ? Object(__WEBPACK_IMPORTED_MODULE_0__baseProperty_js__["a" /* default */])(Object(__WEBPACK_IMPORTED_MODULE_3__toKey_js__["a" /* default */])(path)) : Object(__WEBPACK_IMPORTED_MODULE_1__basePropertyDeep_js__["a" /* default */])(path);
}

/* harmony default export */ __webpack_exports__["a"] = (property);


/***/ }),
/* 238 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGet_js__ = __webpack_require__(37);


/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyDeep(path) {
  return function(object) {
    return Object(__WEBPACK_IMPORTED_MODULE_0__baseGet_js__["a" /* default */])(object, path);
  };
}

/* harmony default export */ __webpack_exports__["a"] = (basePropertyDeep);


/***/ }),
/* 239 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseDifference_js__ = __webpack_require__(240);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseFlatten_js__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__baseRest_js__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isArrayLikeObject_js__ = __webpack_require__(44);





/**
 * Creates an array of `array` values not included in the other given arrays
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons. The order and references of result values are
 * determined by the first array.
 *
 * **Note:** Unlike `_.pullAll`, this method returns a new array.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {...Array} [values] The values to exclude.
 * @returns {Array} Returns the new array of filtered values.
 * @see _.without, _.xor
 * @example
 *
 * _.difference([2, 1], [2, 3]);
 * // => [1]
 */
var difference = Object(__WEBPACK_IMPORTED_MODULE_2__baseRest_js__["a" /* default */])(function(array, values) {
  return Object(__WEBPACK_IMPORTED_MODULE_3__isArrayLikeObject_js__["a" /* default */])(array)
    ? Object(__WEBPACK_IMPORTED_MODULE_0__baseDifference_js__["a" /* default */])(array, Object(__WEBPACK_IMPORTED_MODULE_1__baseFlatten_js__["a" /* default */])(values, 1, __WEBPACK_IMPORTED_MODULE_3__isArrayLikeObject_js__["a" /* default */], true))
    : [];
});

/* harmony default export */ __webpack_exports__["default"] = (difference);


/***/ }),
/* 240 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__SetCache_js__ = __webpack_require__(39);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__arrayIncludes_js__ = __webpack_require__(43);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__arrayIncludesWith_js__ = __webpack_require__(77);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__arrayMap_js__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__baseUnary_js__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__cacheHas_js__ = __webpack_require__(40);







/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of methods like `_.difference` without support
 * for excluding multiple arrays or iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of filtered values.
 */
function baseDifference(array, values, iteratee, comparator) {
  var index = -1,
      includes = __WEBPACK_IMPORTED_MODULE_1__arrayIncludes_js__["a" /* default */],
      isCommon = true,
      length = array.length,
      result = [],
      valuesLength = values.length;

  if (!length) {
    return result;
  }
  if (iteratee) {
    values = Object(__WEBPACK_IMPORTED_MODULE_3__arrayMap_js__["a" /* default */])(values, Object(__WEBPACK_IMPORTED_MODULE_4__baseUnary_js__["a" /* default */])(iteratee));
  }
  if (comparator) {
    includes = __WEBPACK_IMPORTED_MODULE_2__arrayIncludesWith_js__["a" /* default */];
    isCommon = false;
  }
  else if (values.length >= LARGE_ARRAY_SIZE) {
    includes = __WEBPACK_IMPORTED_MODULE_5__cacheHas_js__["a" /* default */];
    isCommon = false;
    values = new __WEBPACK_IMPORTED_MODULE_0__SetCache_js__["a" /* default */](values);
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee == null ? value : iteratee(value);

    value = (comparator || value !== 0) ? value : 0;
    if (isCommon && computed === computed) {
      var valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === computed) {
          continue outer;
        }
      }
      result.push(value);
    }
    else if (!includes(values, computed, comparator)) {
      result.push(value);
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (baseDifference);


/***/ }),
/* 241 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

/* harmony default export */ __webpack_exports__["a"] = (baseFindIndex);


/***/ }),
/* 242 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN(value) {
  return value !== value;
}

/* harmony default export */ __webpack_exports__["a"] = (baseIsNaN);


/***/ }),
/* 243 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * A specialized version of `_.indexOf` which performs strict equality
 * comparisons of values, i.e. `===`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function strictIndexOf(array, value, fromIndex) {
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

/* harmony default export */ __webpack_exports__["a"] = (strictIndexOf);


/***/ }),
/* 244 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayEach_js__ = __webpack_require__(52);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseEach_js__ = __webpack_require__(42);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__castFunction_js__ = __webpack_require__(116);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isArray_js__ = __webpack_require__(1);





/**
 * Iterates over elements of `collection` and invokes `iteratee` for each element.
 * The iteratee is invoked with three arguments: (value, index|key, collection).
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length"
 * property are iterated like arrays. To avoid this behavior use `_.forIn`
 * or `_.forOwn` for object iteration.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @alias each
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 * @see _.forEachRight
 * @example
 *
 * _.forEach([1, 2], function(value) {
 *   console.log(value);
 * });
 * // => Logs `1` then `2`.
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
 *   console.log(key);
 * });
 * // => Logs 'a' then 'b' (iteration order is not guaranteed).
 */
function forEach(collection, iteratee) {
  var func = Object(__WEBPACK_IMPORTED_MODULE_3__isArray_js__["default"])(collection) ? __WEBPACK_IMPORTED_MODULE_0__arrayEach_js__["a" /* default */] : __WEBPACK_IMPORTED_MODULE_1__baseEach_js__["a" /* default */];
  return func(collection, Object(__WEBPACK_IMPORTED_MODULE_2__castFunction_js__["a" /* default */])(iteratee));
}

/* harmony default export */ __webpack_exports__["a"] = (forEach);


/***/ }),
/* 245 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__LodashWrapper_js__ = __webpack_require__(78);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__flatRest_js__ = __webpack_require__(72);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__getData_js__ = __webpack_require__(80);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__getFuncName_js__ = __webpack_require__(120);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__isArray_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__isLaziable_js__ = __webpack_require__(121);







/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used to compose bitmasks for function metadata. */
var WRAP_CURRY_FLAG = 8,
    WRAP_PARTIAL_FLAG = 32,
    WRAP_ARY_FLAG = 128,
    WRAP_REARG_FLAG = 256;

/**
 * Creates a `_.flow` or `_.flowRight` function.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new flow function.
 */
function createFlow(fromRight) {
  return Object(__WEBPACK_IMPORTED_MODULE_1__flatRest_js__["a" /* default */])(function(funcs) {
    var length = funcs.length,
        index = length,
        prereq = __WEBPACK_IMPORTED_MODULE_0__LodashWrapper_js__["a" /* default */].prototype.thru;

    if (fromRight) {
      funcs.reverse();
    }
    while (index--) {
      var func = funcs[index];
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      if (prereq && !wrapper && Object(__WEBPACK_IMPORTED_MODULE_3__getFuncName_js__["a" /* default */])(func) == 'wrapper') {
        var wrapper = new __WEBPACK_IMPORTED_MODULE_0__LodashWrapper_js__["a" /* default */]([], true);
      }
    }
    index = wrapper ? index : length;
    while (++index < length) {
      func = funcs[index];

      var funcName = Object(__WEBPACK_IMPORTED_MODULE_3__getFuncName_js__["a" /* default */])(func),
          data = funcName == 'wrapper' ? Object(__WEBPACK_IMPORTED_MODULE_2__getData_js__["a" /* default */])(func) : undefined;

      if (data && Object(__WEBPACK_IMPORTED_MODULE_5__isLaziable_js__["a" /* default */])(data[0]) &&
            data[1] == (WRAP_ARY_FLAG | WRAP_CURRY_FLAG | WRAP_PARTIAL_FLAG | WRAP_REARG_FLAG) &&
            !data[4].length && data[9] == 1
          ) {
        wrapper = wrapper[Object(__WEBPACK_IMPORTED_MODULE_3__getFuncName_js__["a" /* default */])(data[0])].apply(wrapper, data[3]);
      } else {
        wrapper = (func.length == 1 && Object(__WEBPACK_IMPORTED_MODULE_5__isLaziable_js__["a" /* default */])(func))
          ? wrapper[funcName]()
          : wrapper.thru(func);
      }
    }
    return function() {
      var args = arguments,
          value = args[0];

      if (wrapper && args.length == 1 && Object(__WEBPACK_IMPORTED_MODULE_4__isArray_js__["default"])(value)) {
        return wrapper.plant(value).value();
      }
      var index = 0,
          result = length ? funcs[index].apply(this, args) : value;

      while (++index < length) {
        result = funcs[index].call(this, result);
      }
      return result;
    };
  });
}

/* harmony default export */ __webpack_exports__["a"] = (createFlow);


/***/ }),
/* 246 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used to lookup unminified function names. */
var realNames = {};

/* harmony default export */ __webpack_exports__["a"] = (realNames);


/***/ }),
/* 247 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__LazyWrapper_js__ = __webpack_require__(81);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__LodashWrapper_js__ = __webpack_require__(78);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__baseLodash_js__ = __webpack_require__(79);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isArray_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__isObjectLike_js__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__wrapperClone_js__ = __webpack_require__(248);







/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates a `lodash` object which wraps `value` to enable implicit method
 * chain sequences. Methods that operate on and return arrays, collections,
 * and functions can be chained together. Methods that retrieve a single value
 * or may return a primitive value will automatically end the chain sequence
 * and return the unwrapped value. Otherwise, the value must be unwrapped
 * with `_#value`.
 *
 * Explicit chain sequences, which must be unwrapped with `_#value`, may be
 * enabled using `_.chain`.
 *
 * The execution of chained methods is lazy, that is, it's deferred until
 * `_#value` is implicitly or explicitly called.
 *
 * Lazy evaluation allows several methods to support shortcut fusion.
 * Shortcut fusion is an optimization to merge iteratee calls; this avoids
 * the creation of intermediate arrays and can greatly reduce the number of
 * iteratee executions. Sections of a chain sequence qualify for shortcut
 * fusion if the section is applied to an array and iteratees accept only
 * one argument. The heuristic for whether a section qualifies for shortcut
 * fusion is subject to change.
 *
 * Chaining is supported in custom builds as long as the `_#value` method is
 * directly or indirectly included in the build.
 *
 * In addition to lodash methods, wrappers have `Array` and `String` methods.
 *
 * The wrapper `Array` methods are:
 * `concat`, `join`, `pop`, `push`, `shift`, `sort`, `splice`, and `unshift`
 *
 * The wrapper `String` methods are:
 * `replace` and `split`
 *
 * The wrapper methods that support shortcut fusion are:
 * `at`, `compact`, `drop`, `dropRight`, `dropWhile`, `filter`, `find`,
 * `findLast`, `head`, `initial`, `last`, `map`, `reject`, `reverse`, `slice`,
 * `tail`, `take`, `takeRight`, `takeRightWhile`, `takeWhile`, and `toArray`
 *
 * The chainable wrapper methods are:
 * `after`, `ary`, `assign`, `assignIn`, `assignInWith`, `assignWith`, `at`,
 * `before`, `bind`, `bindAll`, `bindKey`, `castArray`, `chain`, `chunk`,
 * `commit`, `compact`, `concat`, `conforms`, `constant`, `countBy`, `create`,
 * `curry`, `debounce`, `defaults`, `defaultsDeep`, `defer`, `delay`,
 * `difference`, `differenceBy`, `differenceWith`, `drop`, `dropRight`,
 * `dropRightWhile`, `dropWhile`, `extend`, `extendWith`, `fill`, `filter`,
 * `flatMap`, `flatMapDeep`, `flatMapDepth`, `flatten`, `flattenDeep`,
 * `flattenDepth`, `flip`, `flow`, `flowRight`, `fromPairs`, `functions`,
 * `functionsIn`, `groupBy`, `initial`, `intersection`, `intersectionBy`,
 * `intersectionWith`, `invert`, `invertBy`, `invokeMap`, `iteratee`, `keyBy`,
 * `keys`, `keysIn`, `map`, `mapKeys`, `mapValues`, `matches`, `matchesProperty`,
 * `memoize`, `merge`, `mergeWith`, `method`, `methodOf`, `mixin`, `negate`,
 * `nthArg`, `omit`, `omitBy`, `once`, `orderBy`, `over`, `overArgs`,
 * `overEvery`, `overSome`, `partial`, `partialRight`, `partition`, `pick`,
 * `pickBy`, `plant`, `property`, `propertyOf`, `pull`, `pullAll`, `pullAllBy`,
 * `pullAllWith`, `pullAt`, `push`, `range`, `rangeRight`, `rearg`, `reject`,
 * `remove`, `rest`, `reverse`, `sampleSize`, `set`, `setWith`, `shuffle`,
 * `slice`, `sort`, `sortBy`, `splice`, `spread`, `tail`, `take`, `takeRight`,
 * `takeRightWhile`, `takeWhile`, `tap`, `throttle`, `thru`, `toArray`,
 * `toPairs`, `toPairsIn`, `toPath`, `toPlainObject`, `transform`, `unary`,
 * `union`, `unionBy`, `unionWith`, `uniq`, `uniqBy`, `uniqWith`, `unset`,
 * `unshift`, `unzip`, `unzipWith`, `update`, `updateWith`, `values`,
 * `valuesIn`, `without`, `wrap`, `xor`, `xorBy`, `xorWith`, `zip`,
 * `zipObject`, `zipObjectDeep`, and `zipWith`
 *
 * The wrapper methods that are **not** chainable by default are:
 * `add`, `attempt`, `camelCase`, `capitalize`, `ceil`, `clamp`, `clone`,
 * `cloneDeep`, `cloneDeepWith`, `cloneWith`, `conformsTo`, `deburr`,
 * `defaultTo`, `divide`, `each`, `eachRight`, `endsWith`, `eq`, `escape`,
 * `escapeRegExp`, `every`, `find`, `findIndex`, `findKey`, `findLast`,
 * `findLastIndex`, `findLastKey`, `first`, `floor`, `forEach`, `forEachRight`,
 * `forIn`, `forInRight`, `forOwn`, `forOwnRight`, `get`, `gt`, `gte`, `has`,
 * `hasIn`, `head`, `identity`, `includes`, `indexOf`, `inRange`, `invoke`,
 * `isArguments`, `isArray`, `isArrayBuffer`, `isArrayLike`, `isArrayLikeObject`,
 * `isBoolean`, `isBuffer`, `isDate`, `isElement`, `isEmpty`, `isEqual`,
 * `isEqualWith`, `isError`, `isFinite`, `isFunction`, `isInteger`, `isLength`,
 * `isMap`, `isMatch`, `isMatchWith`, `isNaN`, `isNative`, `isNil`, `isNull`,
 * `isNumber`, `isObject`, `isObjectLike`, `isPlainObject`, `isRegExp`,
 * `isSafeInteger`, `isSet`, `isString`, `isUndefined`, `isTypedArray`,
 * `isWeakMap`, `isWeakSet`, `join`, `kebabCase`, `last`, `lastIndexOf`,
 * `lowerCase`, `lowerFirst`, `lt`, `lte`, `max`, `maxBy`, `mean`, `meanBy`,
 * `min`, `minBy`, `multiply`, `noConflict`, `noop`, `now`, `nth`, `pad`,
 * `padEnd`, `padStart`, `parseInt`, `pop`, `random`, `reduce`, `reduceRight`,
 * `repeat`, `result`, `round`, `runInContext`, `sample`, `shift`, `size`,
 * `snakeCase`, `some`, `sortedIndex`, `sortedIndexBy`, `sortedLastIndex`,
 * `sortedLastIndexBy`, `startCase`, `startsWith`, `stubArray`, `stubFalse`,
 * `stubObject`, `stubString`, `stubTrue`, `subtract`, `sum`, `sumBy`,
 * `template`, `times`, `toFinite`, `toInteger`, `toJSON`, `toLength`,
 * `toLower`, `toNumber`, `toSafeInteger`, `toString`, `toUpper`, `trim`,
 * `trimEnd`, `trimStart`, `truncate`, `unescape`, `uniqueId`, `upperCase`,
 * `upperFirst`, `value`, and `words`
 *
 * @name _
 * @constructor
 * @category Seq
 * @param {*} value The value to wrap in a `lodash` instance.
 * @returns {Object} Returns the new `lodash` wrapper instance.
 * @example
 *
 * function square(n) {
 *   return n * n;
 * }
 *
 * var wrapped = _([1, 2, 3]);
 *
 * // Returns an unwrapped value.
 * wrapped.reduce(_.add);
 * // => 6
 *
 * // Returns a wrapped value.
 * var squares = wrapped.map(square);
 *
 * _.isArray(squares);
 * // => false
 *
 * _.isArray(squares.value());
 * // => true
 */
function lodash(value) {
  if (Object(__WEBPACK_IMPORTED_MODULE_4__isObjectLike_js__["a" /* default */])(value) && !Object(__WEBPACK_IMPORTED_MODULE_3__isArray_js__["default"])(value) && !(value instanceof __WEBPACK_IMPORTED_MODULE_0__LazyWrapper_js__["a" /* default */])) {
    if (value instanceof __WEBPACK_IMPORTED_MODULE_1__LodashWrapper_js__["a" /* default */]) {
      return value;
    }
    if (hasOwnProperty.call(value, '__wrapped__')) {
      return Object(__WEBPACK_IMPORTED_MODULE_5__wrapperClone_js__["a" /* default */])(value);
    }
  }
  return new __WEBPACK_IMPORTED_MODULE_1__LodashWrapper_js__["a" /* default */](value);
}

// Ensure wrappers are instances of `baseLodash`.
lodash.prototype = __WEBPACK_IMPORTED_MODULE_2__baseLodash_js__["a" /* default */].prototype;
lodash.prototype.constructor = lodash;

/* harmony default export */ __webpack_exports__["a"] = (lodash);


/***/ }),
/* 248 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__LazyWrapper_js__ = __webpack_require__(81);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__LodashWrapper_js__ = __webpack_require__(78);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__copyArray_js__ = __webpack_require__(61);




/**
 * Creates a clone of `wrapper`.
 *
 * @private
 * @param {Object} wrapper The wrapper to clone.
 * @returns {Object} Returns the cloned wrapper.
 */
function wrapperClone(wrapper) {
  if (wrapper instanceof __WEBPACK_IMPORTED_MODULE_0__LazyWrapper_js__["a" /* default */]) {
    return wrapper.clone();
  }
  var result = new __WEBPACK_IMPORTED_MODULE_1__LodashWrapper_js__["a" /* default */](wrapper.__wrapped__, wrapper.__chain__);
  result.__actions__ = Object(__WEBPACK_IMPORTED_MODULE_2__copyArray_js__["a" /* default */])(wrapper.__actions__);
  result.__index__  = wrapper.__index__;
  result.__values__ = wrapper.__values__;
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (wrapperClone);


/***/ }),
/* 249 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayMap_js__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseIntersection_js__ = __webpack_require__(250);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__baseRest_js__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__castArrayLikeObject_js__ = __webpack_require__(251);





/**
 * Creates an array of unique values that are included in all given arrays
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons. The order and references of result values are
 * determined by the first array.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {...Array} [arrays] The arrays to inspect.
 * @returns {Array} Returns the new array of intersecting values.
 * @example
 *
 * _.intersection([2, 1], [2, 3]);
 * // => [2]
 */
var intersection = Object(__WEBPACK_IMPORTED_MODULE_2__baseRest_js__["a" /* default */])(function(arrays) {
  var mapped = Object(__WEBPACK_IMPORTED_MODULE_0__arrayMap_js__["a" /* default */])(arrays, __WEBPACK_IMPORTED_MODULE_3__castArrayLikeObject_js__["a" /* default */]);
  return (mapped.length && mapped[0] === arrays[0])
    ? Object(__WEBPACK_IMPORTED_MODULE_1__baseIntersection_js__["a" /* default */])(mapped)
    : [];
});

/* harmony default export */ __webpack_exports__["default"] = (intersection);


/***/ }),
/* 250 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__SetCache_js__ = __webpack_require__(39);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__arrayIncludes_js__ = __webpack_require__(43);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__arrayIncludesWith_js__ = __webpack_require__(77);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__arrayMap_js__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__baseUnary_js__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__cacheHas_js__ = __webpack_require__(40);







/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * The base implementation of methods like `_.intersection`, without support
 * for iteratee shorthands, that accepts an array of arrays to inspect.
 *
 * @private
 * @param {Array} arrays The arrays to inspect.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of shared values.
 */
function baseIntersection(arrays, iteratee, comparator) {
  var includes = comparator ? __WEBPACK_IMPORTED_MODULE_2__arrayIncludesWith_js__["a" /* default */] : __WEBPACK_IMPORTED_MODULE_1__arrayIncludes_js__["a" /* default */],
      length = arrays[0].length,
      othLength = arrays.length,
      othIndex = othLength,
      caches = Array(othLength),
      maxLength = Infinity,
      result = [];

  while (othIndex--) {
    var array = arrays[othIndex];
    if (othIndex && iteratee) {
      array = Object(__WEBPACK_IMPORTED_MODULE_3__arrayMap_js__["a" /* default */])(array, Object(__WEBPACK_IMPORTED_MODULE_4__baseUnary_js__["a" /* default */])(iteratee));
    }
    maxLength = nativeMin(array.length, maxLength);
    caches[othIndex] = !comparator && (iteratee || (length >= 120 && array.length >= 120))
      ? new __WEBPACK_IMPORTED_MODULE_0__SetCache_js__["a" /* default */](othIndex && array)
      : undefined;
  }
  array = arrays[0];

  var index = -1,
      seen = caches[0];

  outer:
  while (++index < length && result.length < maxLength) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    value = (comparator || value !== 0) ? value : 0;
    if (!(seen
          ? Object(__WEBPACK_IMPORTED_MODULE_5__cacheHas_js__["a" /* default */])(seen, computed)
          : includes(result, computed, comparator)
        )) {
      othIndex = othLength;
      while (--othIndex) {
        var cache = caches[othIndex];
        if (!(cache
              ? Object(__WEBPACK_IMPORTED_MODULE_5__cacheHas_js__["a" /* default */])(cache, computed)
              : includes(arrays[othIndex], computed, comparator))
            ) {
          continue outer;
        }
      }
      if (seen) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (baseIntersection);


/***/ }),
/* 251 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isArrayLikeObject_js__ = __webpack_require__(44);


/**
 * Casts `value` to an empty array if it's not an array like object.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Array|Object} Returns the cast array-like object.
 */
function castArrayLikeObject(value) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__isArrayLikeObject_js__["a" /* default */])(value) ? value : [];
}

/* harmony default export */ __webpack_exports__["a"] = (castArrayLikeObject);


/***/ }),
/* 252 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseSetData_js__ = __webpack_require__(125);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__createBind_js__ = __webpack_require__(253);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__createCurry_js__ = __webpack_require__(254);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__createHybrid_js__ = __webpack_require__(126);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__createPartial_js__ = __webpack_require__(260);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__getData_js__ = __webpack_require__(80);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__mergeData_js__ = __webpack_require__(261);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__setData_js__ = __webpack_require__(130);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__setWrapToString_js__ = __webpack_require__(131);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__toInteger_js__ = __webpack_require__(21);











/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_FLAG = 8,
    WRAP_CURRY_RIGHT_FLAG = 16,
    WRAP_PARTIAL_FLAG = 32,
    WRAP_PARTIAL_RIGHT_FLAG = 64;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that either curries or invokes `func` with optional
 * `this` binding and partially applied arguments.
 *
 * @private
 * @param {Function|string} func The function or method name to wrap.
 * @param {number} bitmask The bitmask flags.
 *    1 - `_.bind`
 *    2 - `_.bindKey`
 *    4 - `_.curry` or `_.curryRight` of a bound function
 *    8 - `_.curry`
 *   16 - `_.curryRight`
 *   32 - `_.partial`
 *   64 - `_.partialRight`
 *  128 - `_.rearg`
 *  256 - `_.ary`
 *  512 - `_.flip`
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to be partially applied.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createWrap(func, bitmask, thisArg, partials, holders, argPos, ary, arity) {
  var isBindKey = bitmask & WRAP_BIND_KEY_FLAG;
  if (!isBindKey && typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var length = partials ? partials.length : 0;
  if (!length) {
    bitmask &= ~(WRAP_PARTIAL_FLAG | WRAP_PARTIAL_RIGHT_FLAG);
    partials = holders = undefined;
  }
  ary = ary === undefined ? ary : nativeMax(Object(__WEBPACK_IMPORTED_MODULE_9__toInteger_js__["a" /* default */])(ary), 0);
  arity = arity === undefined ? arity : Object(__WEBPACK_IMPORTED_MODULE_9__toInteger_js__["a" /* default */])(arity);
  length -= holders ? holders.length : 0;

  if (bitmask & WRAP_PARTIAL_RIGHT_FLAG) {
    var partialsRight = partials,
        holdersRight = holders;

    partials = holders = undefined;
  }
  var data = isBindKey ? undefined : Object(__WEBPACK_IMPORTED_MODULE_5__getData_js__["a" /* default */])(func);

  var newData = [
    func, bitmask, thisArg, partials, holders, partialsRight, holdersRight,
    argPos, ary, arity
  ];

  if (data) {
    Object(__WEBPACK_IMPORTED_MODULE_6__mergeData_js__["a" /* default */])(newData, data);
  }
  func = newData[0];
  bitmask = newData[1];
  thisArg = newData[2];
  partials = newData[3];
  holders = newData[4];
  arity = newData[9] = newData[9] === undefined
    ? (isBindKey ? 0 : func.length)
    : nativeMax(newData[9] - length, 0);

  if (!arity && bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG)) {
    bitmask &= ~(WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG);
  }
  if (!bitmask || bitmask == WRAP_BIND_FLAG) {
    var result = Object(__WEBPACK_IMPORTED_MODULE_1__createBind_js__["a" /* default */])(func, bitmask, thisArg);
  } else if (bitmask == WRAP_CURRY_FLAG || bitmask == WRAP_CURRY_RIGHT_FLAG) {
    result = Object(__WEBPACK_IMPORTED_MODULE_2__createCurry_js__["a" /* default */])(func, bitmask, arity);
  } else if ((bitmask == WRAP_PARTIAL_FLAG || bitmask == (WRAP_BIND_FLAG | WRAP_PARTIAL_FLAG)) && !holders.length) {
    result = Object(__WEBPACK_IMPORTED_MODULE_4__createPartial_js__["a" /* default */])(func, bitmask, thisArg, partials);
  } else {
    result = __WEBPACK_IMPORTED_MODULE_3__createHybrid_js__["a" /* default */].apply(undefined, newData);
  }
  var setter = data ? __WEBPACK_IMPORTED_MODULE_0__baseSetData_js__["a" /* default */] : __WEBPACK_IMPORTED_MODULE_7__setData_js__["a" /* default */];
  return Object(__WEBPACK_IMPORTED_MODULE_8__setWrapToString_js__["a" /* default */])(setter(result, newData), func, bitmask);
}

/* harmony default export */ __webpack_exports__["a"] = (createWrap);


/***/ }),
/* 253 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__createCtor_js__ = __webpack_require__(45);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__root_js__ = __webpack_require__(4);



/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1;

/**
 * Creates a function that wraps `func` to invoke it with the optional `this`
 * binding of `thisArg`.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createBind(func, bitmask, thisArg) {
  var isBind = bitmask & WRAP_BIND_FLAG,
      Ctor = Object(__WEBPACK_IMPORTED_MODULE_0__createCtor_js__["a" /* default */])(func);

  function wrapper() {
    var fn = (this && this !== __WEBPACK_IMPORTED_MODULE_1__root_js__["a" /* default */] && this instanceof wrapper) ? Ctor : func;
    return fn.apply(isBind ? thisArg : this, arguments);
  }
  return wrapper;
}

/* harmony default export */ __webpack_exports__["a"] = (createBind);


/***/ }),
/* 254 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__apply_js__ = __webpack_require__(68);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__createCtor_js__ = __webpack_require__(45);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__createHybrid_js__ = __webpack_require__(126);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__createRecurry_js__ = __webpack_require__(129);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__getHolder_js__ = __webpack_require__(82);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__replaceHolders_js__ = __webpack_require__(46);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__root_js__ = __webpack_require__(4);








/**
 * Creates a function that wraps `func` to enable currying.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {number} arity The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createCurry(func, bitmask, arity) {
  var Ctor = Object(__WEBPACK_IMPORTED_MODULE_1__createCtor_js__["a" /* default */])(func);

  function wrapper() {
    var length = arguments.length,
        args = Array(length),
        index = length,
        placeholder = Object(__WEBPACK_IMPORTED_MODULE_4__getHolder_js__["a" /* default */])(wrapper);

    while (index--) {
      args[index] = arguments[index];
    }
    var holders = (length < 3 && args[0] !== placeholder && args[length - 1] !== placeholder)
      ? []
      : Object(__WEBPACK_IMPORTED_MODULE_5__replaceHolders_js__["a" /* default */])(args, placeholder);

    length -= holders.length;
    if (length < arity) {
      return Object(__WEBPACK_IMPORTED_MODULE_3__createRecurry_js__["a" /* default */])(
        func, bitmask, __WEBPACK_IMPORTED_MODULE_2__createHybrid_js__["a" /* default */], wrapper.placeholder, undefined,
        args, holders, undefined, undefined, arity - length);
    }
    var fn = (this && this !== __WEBPACK_IMPORTED_MODULE_6__root_js__["a" /* default */] && this instanceof wrapper) ? Ctor : func;
    return Object(__WEBPACK_IMPORTED_MODULE_0__apply_js__["a" /* default */])(fn, this, args);
  }
  return wrapper;
}

/* harmony default export */ __webpack_exports__["a"] = (createCurry);


/***/ }),
/* 255 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Gets the number of `placeholder` occurrences in `array`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} placeholder The placeholder to search for.
 * @returns {number} Returns the placeholder count.
 */
function countHolders(array, placeholder) {
  var length = array.length,
      result = 0;

  while (length--) {
    if (array[length] === placeholder) {
      ++result;
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = (countHolders);


/***/ }),
/* 256 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used to match wrap detail comments. */
var reWrapDetails = /\{\n\/\* \[wrapped with (.+)\] \*/,
    reSplitDetails = /,? & /;

/**
 * Extracts wrapper details from the `source` body comment.
 *
 * @private
 * @param {string} source The source to inspect.
 * @returns {Array} Returns the wrapper details.
 */
function getWrapDetails(source) {
  var match = source.match(reWrapDetails);
  return match ? match[1].split(reSplitDetails) : [];
}

/* harmony default export */ __webpack_exports__["a"] = (getWrapDetails);


/***/ }),
/* 257 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used to match wrap detail comments. */
var reWrapComment = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/;

/**
 * Inserts wrapper `details` in a comment at the top of the `source` body.
 *
 * @private
 * @param {string} source The source to modify.
 * @returns {Array} details The details to insert.
 * @returns {string} Returns the modified source.
 */
function insertWrapDetails(source, details) {
  var length = details.length;
  if (!length) {
    return source;
  }
  var lastIndex = length - 1;
  details[lastIndex] = (length > 1 ? '& ' : '') + details[lastIndex];
  details = details.join(length > 2 ? ', ' : ' ');
  return source.replace(reWrapComment, '{\n/* [wrapped with ' + details + '] */\n');
}

/* harmony default export */ __webpack_exports__["a"] = (insertWrapDetails);


/***/ }),
/* 258 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayEach_js__ = __webpack_require__(52);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__arrayIncludes_js__ = __webpack_require__(43);



/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_FLAG = 8,
    WRAP_CURRY_RIGHT_FLAG = 16,
    WRAP_PARTIAL_FLAG = 32,
    WRAP_PARTIAL_RIGHT_FLAG = 64,
    WRAP_ARY_FLAG = 128,
    WRAP_REARG_FLAG = 256,
    WRAP_FLIP_FLAG = 512;

/** Used to associate wrap methods with their bit flags. */
var wrapFlags = [
  ['ary', WRAP_ARY_FLAG],
  ['bind', WRAP_BIND_FLAG],
  ['bindKey', WRAP_BIND_KEY_FLAG],
  ['curry', WRAP_CURRY_FLAG],
  ['curryRight', WRAP_CURRY_RIGHT_FLAG],
  ['flip', WRAP_FLIP_FLAG],
  ['partial', WRAP_PARTIAL_FLAG],
  ['partialRight', WRAP_PARTIAL_RIGHT_FLAG],
  ['rearg', WRAP_REARG_FLAG]
];

/**
 * Updates wrapper `details` based on `bitmask` flags.
 *
 * @private
 * @returns {Array} details The details to modify.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @returns {Array} Returns `details`.
 */
function updateWrapDetails(details, bitmask) {
  Object(__WEBPACK_IMPORTED_MODULE_0__arrayEach_js__["a" /* default */])(wrapFlags, function(pair) {
    var value = '_.' + pair[0];
    if ((bitmask & pair[1]) && !Object(__WEBPACK_IMPORTED_MODULE_1__arrayIncludes_js__["a" /* default */])(details, value)) {
      details.push(value);
    }
  });
  return details.sort();
}

/* harmony default export */ __webpack_exports__["a"] = (updateWrapDetails);


/***/ }),
/* 259 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__copyArray_js__ = __webpack_require__(61);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isIndex_js__ = __webpack_require__(23);



/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * Reorder `array` according to the specified indexes where the element at
 * the first index is assigned as the first element, the element at
 * the second index is assigned as the second element, and so on.
 *
 * @private
 * @param {Array} array The array to reorder.
 * @param {Array} indexes The arranged array indexes.
 * @returns {Array} Returns `array`.
 */
function reorder(array, indexes) {
  var arrLength = array.length,
      length = nativeMin(indexes.length, arrLength),
      oldArray = Object(__WEBPACK_IMPORTED_MODULE_0__copyArray_js__["a" /* default */])(array);

  while (length--) {
    var index = indexes[length];
    array[length] = Object(__WEBPACK_IMPORTED_MODULE_1__isIndex_js__["a" /* default */])(index, arrLength) ? oldArray[index] : undefined;
  }
  return array;
}

/* harmony default export */ __webpack_exports__["a"] = (reorder);


/***/ }),
/* 260 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__apply_js__ = __webpack_require__(68);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__createCtor_js__ = __webpack_require__(45);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__root_js__ = __webpack_require__(4);




/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1;

/**
 * Creates a function that wraps `func` to invoke it with the `this` binding
 * of `thisArg` and `partials` prepended to the arguments it receives.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} partials The arguments to prepend to those provided to
 *  the new function.
 * @returns {Function} Returns the new wrapped function.
 */
function createPartial(func, bitmask, thisArg, partials) {
  var isBind = bitmask & WRAP_BIND_FLAG,
      Ctor = Object(__WEBPACK_IMPORTED_MODULE_1__createCtor_js__["a" /* default */])(func);

  function wrapper() {
    var argsIndex = -1,
        argsLength = arguments.length,
        leftIndex = -1,
        leftLength = partials.length,
        args = Array(leftLength + argsLength),
        fn = (this && this !== __WEBPACK_IMPORTED_MODULE_2__root_js__["a" /* default */] && this instanceof wrapper) ? Ctor : func;

    while (++leftIndex < leftLength) {
      args[leftIndex] = partials[leftIndex];
    }
    while (argsLength--) {
      args[leftIndex++] = arguments[++argsIndex];
    }
    return Object(__WEBPACK_IMPORTED_MODULE_0__apply_js__["a" /* default */])(fn, isBind ? thisArg : this, args);
  }
  return wrapper;
}

/* harmony default export */ __webpack_exports__["a"] = (createPartial);


/***/ }),
/* 261 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__composeArgs_js__ = __webpack_require__(127);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__composeArgsRight_js__ = __webpack_require__(128);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__replaceHolders_js__ = __webpack_require__(46);




/** Used as the internal argument placeholder. */
var PLACEHOLDER = '__lodash_placeholder__';

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_BOUND_FLAG = 4,
    WRAP_CURRY_FLAG = 8,
    WRAP_ARY_FLAG = 128,
    WRAP_REARG_FLAG = 256;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * Merges the function metadata of `source` into `data`.
 *
 * Merging metadata reduces the number of wrappers used to invoke a function.
 * This is possible because methods like `_.bind`, `_.curry`, and `_.partial`
 * may be applied regardless of execution order. Methods like `_.ary` and
 * `_.rearg` modify function arguments, making the order in which they are
 * executed important, preventing the merging of metadata. However, we make
 * an exception for a safe combined case where curried functions have `_.ary`
 * and or `_.rearg` applied.
 *
 * @private
 * @param {Array} data The destination metadata.
 * @param {Array} source The source metadata.
 * @returns {Array} Returns `data`.
 */
function mergeData(data, source) {
  var bitmask = data[1],
      srcBitmask = source[1],
      newBitmask = bitmask | srcBitmask,
      isCommon = newBitmask < (WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG | WRAP_ARY_FLAG);

  var isCombo =
    ((srcBitmask == WRAP_ARY_FLAG) && (bitmask == WRAP_CURRY_FLAG)) ||
    ((srcBitmask == WRAP_ARY_FLAG) && (bitmask == WRAP_REARG_FLAG) && (data[7].length <= source[8])) ||
    ((srcBitmask == (WRAP_ARY_FLAG | WRAP_REARG_FLAG)) && (source[7].length <= source[8]) && (bitmask == WRAP_CURRY_FLAG));

  // Exit early if metadata can't be merged.
  if (!(isCommon || isCombo)) {
    return data;
  }
  // Use source `thisArg` if available.
  if (srcBitmask & WRAP_BIND_FLAG) {
    data[2] = source[2];
    // Set when currying a bound function.
    newBitmask |= bitmask & WRAP_BIND_FLAG ? 0 : WRAP_CURRY_BOUND_FLAG;
  }
  // Compose partial arguments.
  var value = source[3];
  if (value) {
    var partials = data[3];
    data[3] = partials ? Object(__WEBPACK_IMPORTED_MODULE_0__composeArgs_js__["a" /* default */])(partials, value, source[4]) : value;
    data[4] = partials ? Object(__WEBPACK_IMPORTED_MODULE_2__replaceHolders_js__["a" /* default */])(data[3], PLACEHOLDER) : source[4];
  }
  // Compose partial right arguments.
  value = source[5];
  if (value) {
    partials = data[5];
    data[5] = partials ? Object(__WEBPACK_IMPORTED_MODULE_1__composeArgsRight_js__["a" /* default */])(partials, value, source[6]) : value;
    data[6] = partials ? Object(__WEBPACK_IMPORTED_MODULE_2__replaceHolders_js__["a" /* default */])(data[5], PLACEHOLDER) : source[6];
  }
  // Use source `argPos` if available.
  value = source[7];
  if (value) {
    data[7] = value;
  }
  // Use source `ary` if it's smaller.
  if (srcBitmask & WRAP_ARY_FLAG) {
    data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
  }
  // Use source `arity` if one is not provided.
  if (data[9] == null) {
    data[9] = source[9];
  }
  // Use source `func` and merge bitmasks.
  data[0] = source[0];
  data[1] = newBitmask;

  return data;
}

/* harmony default export */ __webpack_exports__["a"] = (mergeData);


/***/ }),
/* 262 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__toNumber_js__ = __webpack_require__(263);


/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0,
    MAX_INTEGER = 1.7976931348623157e+308;

/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */
function toFinite(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = Object(__WEBPACK_IMPORTED_MODULE_0__toNumber_js__["a" /* default */])(value);
  if (value === INFINITY || value === -INFINITY) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER;
  }
  return value === value ? value : 0;
}

/* harmony default export */ __webpack_exports__["a"] = (toFinite);


/***/ }),
/* 263 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isObject_js__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isSymbol_js__ = __webpack_require__(25);



/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (Object(__WEBPACK_IMPORTED_MODULE_1__isSymbol_js__["a" /* default */])(value)) {
    return NAN;
  }
  if (Object(__WEBPACK_IMPORTED_MODULE_0__isObject_js__["a" /* default */])(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = Object(__WEBPACK_IMPORTED_MODULE_0__isObject_js__["a" /* default */])(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

/* harmony default export */ __webpack_exports__["a"] = (toNumber);


/***/ }),
/* 264 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseFlatten_js__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseRest_js__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__baseUniq_js__ = __webpack_require__(132);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isArrayLikeObject_js__ = __webpack_require__(44);





/**
 * Creates an array of unique values, in order, from all given arrays using
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {...Array} [arrays] The arrays to inspect.
 * @returns {Array} Returns the new array of combined values.
 * @example
 *
 * _.union([2], [1, 2]);
 * // => [2, 1]
 */
var union = Object(__WEBPACK_IMPORTED_MODULE_1__baseRest_js__["a" /* default */])(function(arrays) {
  return Object(__WEBPACK_IMPORTED_MODULE_2__baseUniq_js__["a" /* default */])(Object(__WEBPACK_IMPORTED_MODULE_0__baseFlatten_js__["a" /* default */])(arrays, 1, __WEBPACK_IMPORTED_MODULE_3__isArrayLikeObject_js__["a" /* default */], true));
});

/* harmony default export */ __webpack_exports__["default"] = (union);


/***/ }),
/* 265 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Set_js__ = __webpack_require__(98);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__noop_js__ = __webpack_require__(119);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__setToArray_js__ = __webpack_require__(75);




/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/**
 * Creates a set object of `values`.
 *
 * @private
 * @param {Array} values The values to add to the set.
 * @returns {Object} Returns the new set.
 */
var createSet = !(__WEBPACK_IMPORTED_MODULE_0__Set_js__["a" /* default */] && (1 / Object(__WEBPACK_IMPORTED_MODULE_2__setToArray_js__["a" /* default */])(new __WEBPACK_IMPORTED_MODULE_0__Set_js__["a" /* default */]([,-0]))[1]) == INFINITY) ? __WEBPACK_IMPORTED_MODULE_1__noop_js__["a" /* default */] : function(values) {
  return new __WEBPACK_IMPORTED_MODULE_0__Set_js__["a" /* default */](values);
};

/* harmony default export */ __webpack_exports__["a"] = (createSet);


/***/ }),
/* 266 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseValues_js__ = __webpack_require__(267);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__keys_js__ = __webpack_require__(11);



/**
 * Creates an array of the own enumerable string keyed property values of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property values.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.values(new Foo);
 * // => [1, 2] (iteration order is not guaranteed)
 *
 * _.values('hi');
 * // => ['h', 'i']
 */
function values(object) {
  return object == null ? [] : Object(__WEBPACK_IMPORTED_MODULE_0__baseValues_js__["a" /* default */])(object, Object(__WEBPACK_IMPORTED_MODULE_1__keys_js__["default"])(object));
}

/* harmony default export */ __webpack_exports__["default"] = (values);


/***/ }),
/* 267 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayMap_js__ = __webpack_require__(7);


/**
 * The base implementation of `_.values` and `_.valuesIn` which creates an
 * array of `object` property values corresponding to the property names
 * of `props`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} props The property names to get values for.
 * @returns {Object} Returns the array of property values.
 */
function baseValues(object, props) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__arrayMap_js__["a" /* default */])(props, function(key) {
    return object[key];
  });
}

/* harmony default export */ __webpack_exports__["a"] = (baseValues);


/***/ }),
/* 268 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseSlice_js__ = __webpack_require__(41);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__toInteger_js__ = __webpack_require__(21);



/**
 * Creates a slice of `array` with `n` elements dropped from the beginning.
 *
 * @static
 * @memberOf _
 * @since 0.5.0
 * @category Array
 * @param {Array} array The array to query.
 * @param {number} [n=1] The number of elements to drop.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
 * @returns {Array} Returns the slice of `array`.
 * @example
 *
 * _.drop([1, 2, 3]);
 * // => [2, 3]
 *
 * _.drop([1, 2, 3], 2);
 * // => [3]
 *
 * _.drop([1, 2, 3], 5);
 * // => []
 *
 * _.drop([1, 2, 3], 0);
 * // => [1, 2, 3]
 */
function drop(array, n, guard) {
  var length = array == null ? 0 : array.length;
  if (!length) {
    return [];
  }
  n = (guard || n === undefined) ? 1 : Object(__WEBPACK_IMPORTED_MODULE_1__toInteger_js__["a" /* default */])(n);
  return Object(__WEBPACK_IMPORTED_MODULE_0__baseSlice_js__["a" /* default */])(array, n < 0 ? 0 : n, length);
}

/* harmony default export */ __webpack_exports__["default"] = (drop);


/***/ }),
/* 269 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__copyObject_js__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__createAssigner_js__ = __webpack_require__(270);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__keysIn_js__ = __webpack_require__(34);




/**
 * This method is like `_.assign` except that it iterates over own and
 * inherited source properties.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @alias extend
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.assign
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * function Bar() {
 *   this.c = 3;
 * }
 *
 * Foo.prototype.b = 2;
 * Bar.prototype.d = 4;
 *
 * _.assignIn({ 'a': 0 }, new Foo, new Bar);
 * // => { 'a': 1, 'b': 2, 'c': 3, 'd': 4 }
 */
var assignIn = Object(__WEBPACK_IMPORTED_MODULE_1__createAssigner_js__["a" /* default */])(function(object, source) {
  Object(__WEBPACK_IMPORTED_MODULE_0__copyObject_js__["a" /* default */])(source, Object(__WEBPACK_IMPORTED_MODULE_2__keysIn_js__["a" /* default */])(source), object);
});

/* harmony default export */ __webpack_exports__["a"] = (assignIn);


/***/ }),
/* 270 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseRest_js__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__isIterateeCall_js__ = __webpack_require__(70);



/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__baseRest_js__["a" /* default */])(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && Object(__WEBPACK_IMPORTED_MODULE_1__isIterateeCall_js__["a" /* default */])(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

/* harmony default export */ __webpack_exports__["a"] = (createAssigner);


/***/ }),
/* 271 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseHas_js__ = __webpack_require__(272);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__hasPath_js__ = __webpack_require__(107);



/**
 * Checks if `path` is a direct property of `object`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = { 'a': { 'b': 2 } };
 * var other = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.has(object, 'a');
 * // => true
 *
 * _.has(object, 'a.b');
 * // => true
 *
 * _.has(object, ['a', 'b']);
 * // => true
 *
 * _.has(other, 'a');
 * // => false
 */
function has(object, path) {
  return object != null && Object(__WEBPACK_IMPORTED_MODULE_1__hasPath_js__["a" /* default */])(object, path, __WEBPACK_IMPORTED_MODULE_0__baseHas_js__["a" /* default */]);
}

/* harmony default export */ __webpack_exports__["default"] = (has);


/***/ }),
/* 272 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.has` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHas(object, key) {
  return object != null && hasOwnProperty.call(object, key);
}

/* harmony default export */ __webpack_exports__["a"] = (baseHas);


/***/ }),
/* 273 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */



function peg$subclass(child, parent) {
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
}

function peg$SyntaxError(message, expected, found, location) {
  this.message  = message;
  this.expected = expected;
  this.found    = found;
  this.location = location;
  this.name     = "SyntaxError";

  if (typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(this, peg$SyntaxError);
  }
}

peg$subclass(peg$SyntaxError, Error);

peg$SyntaxError.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
          return "\"" + literalEscape(expectation.text) + "\"";
        },

        "class": function(expectation) {
          var escapedParts = "",
              i;

          for (i = 0; i < expectation.parts.length; i++) {
            escapedParts += expectation.parts[i] instanceof Array
              ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
              : classEscape(expectation.parts[i]);
          }

          return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
        },

        any: function(expectation) {
          return "any character";
        },

        end: function(expectation) {
          return "end of input";
        },

        other: function(expectation) {
          return expectation.description;
        }
      };

  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }

  function literalEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/"/g,  '\\"')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/\]/g, '\\]')
      .replace(/\^/g, '\\^')
      .replace(/-/g,  '\\-')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    var descriptions = new Array(expected.length),
        i, j;

    for (i = 0; i < expected.length; i++) {
      descriptions[i] = describeExpectation(expected[i]);
    }

    descriptions.sort();

    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }

    switch (descriptions.length) {
      case 1:
        return descriptions[0];

      case 2:
        return descriptions[0] + " or " + descriptions[1];

      default:
        return descriptions.slice(0, -1).join(", ")
          + ", or "
          + descriptions[descriptions.length - 1];
    }
  }

  function describeFound(found) {
    return found ? "\"" + literalEscape(found) + "\"" : "end of input";
  }

  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};

function peg$parse(input, options) {
  options = options !== void 0 ? options : {};

  var peg$FAILED = {},

      peg$startRuleFunctions = { program: peg$parseprogram },
      peg$startRuleFunction  = peg$parseprogram,

      peg$c0 = ";",
      peg$c1 = peg$literalExpectation(";", false),
      peg$c2 = function(p) {
          var stmts = [p[1]];
          stmts = stmts.concat(map(p[3], function(pp) {
              return pp[2];
          }));
          return new Ast.Program(stmts);
      },
      peg$c3 = "=",
      peg$c4 = peg$literalExpectation("=", false),
      peg$c5 = function(lhs, e) { return new Ast.Assignment(lhs, e); },
      peg$c6 = "+",
      peg$c7 = peg$literalExpectation("+", false),
      peg$c8 = "-",
      peg$c9 = peg$literalExpectation("-", false),
      peg$c10 = "*",
      peg$c11 = peg$literalExpectation("*", false),
      peg$c12 = "/",
      peg$c13 = peg$literalExpectation("/", false),
      peg$c14 = "%",
      peg$c15 = peg$literalExpectation("%", false),
      peg$c16 = "&",
      peg$c17 = peg$literalExpectation("&", false),
      peg$c18 = "|",
      peg$c19 = peg$literalExpectation("|", false),
      peg$c20 = function(head, tail) { return makeBinaryExpr(head, tail); },
      peg$c21 = function(op, oper) { return new Ast.UnaryExpr(op, oper); },
      peg$c22 = /^[a-zA-Z_]/,
      peg$c23 = peg$classExpectation([["a", "z"], ["A", "Z"], "_"], false, false),
      peg$c24 = /^[a-zA-Z_0-9]/,
      peg$c25 = peg$classExpectation([["a", "z"], ["A", "Z"], "_", ["0", "9"]], false, false),
      peg$c26 = "(",
      peg$c27 = peg$literalExpectation("(", false),
      peg$c28 = ",",
      peg$c29 = peg$literalExpectation(",", false),
      peg$c30 = ")",
      peg$c31 = peg$literalExpectation(")", false),
      peg$c32 = function(funcName, args) {
      		        var argsList = [];
      		        each(args[0], function(toks) {
      		            argsList.push(toks[1]);
      		        });
                      argsList.push(args[2]);
                      return new Ast.FuncCall(flattenChars(funcName), argsList);
      		},
      peg$c33 = function(e) { return e; },
      peg$c34 = function(val) { return new Ast.PrimaryExpr(flattenChars(val).toLowerCase(), "ID"); },
      peg$c35 = "$",
      peg$c36 = peg$literalExpectation("$", false),
      peg$c37 = function(val) { return new Ast.PrimaryExpr(flattenChars(val).toLowerCase(), "CONST"); },
      peg$c38 = "@",
      peg$c39 = peg$literalExpectation("@", false),
      peg$c40 = function(val) { return new Ast.PrimaryExpr("__REG_AT_" + flattenChars(val).toLowerCase(), "REG"); },
      peg$c41 = /^[rR]/,
      peg$c42 = peg$classExpectation(["r", "R"], false, false),
      peg$c43 = /^[eE]/,
      peg$c44 = peg$classExpectation(["e", "E"], false, false),
      peg$c45 = /^[gG]/,
      peg$c46 = peg$classExpectation(["g", "G"], false, false),
      peg$c47 = /^[0-9]/,
      peg$c48 = peg$classExpectation([["0", "9"]], false, false),
      peg$c49 = function(val) { return new Ast.PrimaryExpr("__REG_" + flattenChars(val).toLowerCase(), "REG"); },
      peg$c50 = ".",
      peg$c51 = peg$literalExpectation(".", false),
      peg$c52 = /^[Ee]/,
      peg$c53 = peg$classExpectation(["E", "e"], false, false),
      peg$c54 = function(val) { return new Ast.PrimaryExpr(parseFloat(flattenChars(val)), "VALUE"); },
      peg$c55 = /^[a-fA-F0-9]/,
      peg$c56 = peg$classExpectation([["a", "f"], ["A", "F"], ["0", "9"]], false, false),
      peg$c57 = /^[hH]/,
      peg$c58 = peg$classExpectation(["h", "H"], false, false),
      peg$c59 = function(val) { return new Ast.PrimaryExpr(parseInt(flattenChars(val), 16), "VALUE"); },
      peg$c60 = /^[dD]/,
      peg$c61 = peg$classExpectation(["d", "D"], false, false),
      peg$c62 = function(val) { return new Ast.PrimaryExpr(parseInt(flattenChars(val), 10), "VALUE"); },
      peg$c63 = /^[\t\x0B\f \xA0\uFEFF]/,
      peg$c64 = peg$classExpectation(["\t", "\x0B", "\f", " ", "\xA0", "\uFEFF"], false, false),
      peg$c65 = /^[\n\r\u2028\u2029]/,
      peg$c66 = peg$classExpectation(["\n", "\r", "\u2028", "\u2029"], false, false),
      peg$c67 = "/*",
      peg$c68 = peg$literalExpectation("/*", false),
      peg$c69 = "*/",
      peg$c70 = peg$literalExpectation("*/", false),
      peg$c71 = peg$anyExpectation(),
      peg$c72 = "//",
      peg$c73 = peg$literalExpectation("//", false),

      peg$currPos          = 0,
      peg$savedPos         = 0,
      peg$posDetailsCache  = [{ line: 1, column: 1 }],
      peg$maxFailPos       = 0,
      peg$maxFailExpected  = [],
      peg$silentFails      = 0,

      peg$result;

  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }

  function expected(description, location) {
    location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location
    );
  }

  function error(message, location) {
    location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

    throw peg$buildSimpleError(message, location);
  }

  function peg$literalExpectation(text, ignoreCase) {
    return { type: "literal", text: text, ignoreCase: ignoreCase };
  }

  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
  }

  function peg$anyExpectation() {
    return { type: "any" };
  }

  function peg$endExpectation() {
    return { type: "end" };
  }

  function peg$otherExpectation(description) {
    return { type: "other", description: description };
  }

  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos], p;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line:   details.line,
        column: details.column
      };

      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;
      return details;
    }
  }

  function peg$computeLocation(startPos, endPos) {
    var startPosDetails = peg$computePosDetails(startPos),
        endPosDetails   = peg$computePosDetails(endPos);

    return {
      start: {
        offset: startPos,
        line:   startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line:   endPosDetails.line,
        column: endPosDetails.column
      }
    };
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) { return; }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildSimpleError(message, location) {
    return new peg$SyntaxError(message, null, null, location);
  }

  function peg$buildStructuredError(expected, found, location) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
      expected,
      found,
      location
    );
  }

  function peg$parseprogram() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parse__();
    if (s2 !== peg$FAILED) {
      s3 = peg$parsestatement();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse__();
        if (s4 !== peg$FAILED) {
          s5 = [];
          s6 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 59) {
            s7 = peg$c0;
            peg$currPos++;
          } else {
            s7 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c1); }
          }
          if (s7 !== peg$FAILED) {
            s8 = peg$parse__();
            if (s8 !== peg$FAILED) {
              s9 = peg$parsestatement();
              if (s9 !== peg$FAILED) {
                s10 = peg$parse__();
                if (s10 !== peg$FAILED) {
                  s7 = [s7, s8, s9, s10];
                  s6 = s7;
                } else {
                  peg$currPos = s6;
                  s6 = peg$FAILED;
                }
              } else {
                peg$currPos = s6;
                s6 = peg$FAILED;
              }
            } else {
              peg$currPos = s6;
              s6 = peg$FAILED;
            }
          } else {
            peg$currPos = s6;
            s6 = peg$FAILED;
          }
          while (s6 !== peg$FAILED) {
            s5.push(s6);
            s6 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 59) {
              s7 = peg$c0;
              peg$currPos++;
            } else {
              s7 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c1); }
            }
            if (s7 !== peg$FAILED) {
              s8 = peg$parse__();
              if (s8 !== peg$FAILED) {
                s9 = peg$parsestatement();
                if (s9 !== peg$FAILED) {
                  s10 = peg$parse__();
                  if (s10 !== peg$FAILED) {
                    s7 = [s7, s8, s9, s10];
                    s6 = s7;
                  } else {
                    peg$currPos = s6;
                    s6 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s6;
                  s6 = peg$FAILED;
                }
              } else {
                peg$currPos = s6;
                s6 = peg$FAILED;
              }
            } else {
              peg$currPos = s6;
              s6 = peg$FAILED;
            }
          }
          if (s5 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 59) {
              s6 = peg$c0;
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c1); }
            }
            if (s6 === peg$FAILED) {
              s6 = null;
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$parse__();
              if (s7 !== peg$FAILED) {
                s2 = [s2, s3, s4, s5, s6, s7];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c2(s1);
    }
    s0 = s1;

    return s0;
  }

  function peg$parsestatement() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parseassignable();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse__();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c3;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c4); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse__();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseboolean_expr();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c5(s1, s5);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parseboolean_expr();
    }

    return s0;
  }

  function peg$parseunary_ops() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 43) {
      s0 = peg$c6;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c7); }
    }
    if (s0 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 45) {
        s0 = peg$c8;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c9); }
      }
    }

    return s0;
  }

  function peg$parseadditive_ops() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 43) {
      s0 = peg$c6;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c7); }
    }
    if (s0 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 45) {
        s0 = peg$c8;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c9); }
      }
    }

    return s0;
  }

  function peg$parsemultiplicative_ops() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 42) {
      s0 = peg$c10;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c11); }
    }
    if (s0 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 47) {
        s0 = peg$c12;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c13); }
      }
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 37) {
          s0 = peg$c14;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c15); }
        }
      }
    }

    return s0;
  }

  function peg$parseboolean_ops() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 38) {
      s0 = peg$c16;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c17); }
    }
    if (s0 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 124) {
        s0 = peg$c18;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c19); }
      }
    }

    return s0;
  }

  function peg$parseboolean_expr() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    s0 = peg$currPos;
    s1 = peg$parseadditive_expr();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse__();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseboolean_ops();
        if (s5 !== peg$FAILED) {
          s6 = peg$parse__();
          if (s6 !== peg$FAILED) {
            s7 = peg$parseadditive_expr();
            if (s7 !== peg$FAILED) {
              s4 = [s4, s5, s6, s7];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parse__();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseboolean_ops();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse__();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseadditive_expr();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c20(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseadditive_expr() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    s0 = peg$currPos;
    s1 = peg$parsemultiplicative_expr();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse__();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseadditive_ops();
        if (s5 !== peg$FAILED) {
          s6 = peg$parse__();
          if (s6 !== peg$FAILED) {
            s7 = peg$parsemultiplicative_expr();
            if (s7 !== peg$FAILED) {
              s4 = [s4, s5, s6, s7];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parse__();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseadditive_ops();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse__();
            if (s6 !== peg$FAILED) {
              s7 = peg$parsemultiplicative_expr();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c20(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsemultiplicative_expr() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    s0 = peg$currPos;
    s1 = peg$parseunary();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse__();
      if (s4 !== peg$FAILED) {
        s5 = peg$parsemultiplicative_ops();
        if (s5 !== peg$FAILED) {
          s6 = peg$parse__();
          if (s6 !== peg$FAILED) {
            s7 = peg$parseunary();
            if (s7 !== peg$FAILED) {
              s4 = [s4, s5, s6, s7];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parse__();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsemultiplicative_ops();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse__();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseunary();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c20(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseunary() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parseunary_ops();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse__();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsefunc_call();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c21(s1, s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parsefunc_call();
    }

    return s0;
  }

  function peg$parsefunc_call() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

    s0 = peg$currPos;
    s1 = peg$currPos;
    if (peg$c22.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c23); }
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      if (peg$c24.test(input.charAt(peg$currPos))) {
        s4 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c25); }
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        if (peg$c24.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c25); }
        }
      }
      if (s3 !== peg$FAILED) {
        s2 = [s2, s3];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse__();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 40) {
          s3 = peg$c26;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c27); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$currPos;
          s5 = [];
          s6 = peg$currPos;
          s7 = peg$parse__();
          if (s7 !== peg$FAILED) {
            s8 = peg$parseboolean_expr();
            if (s8 !== peg$FAILED) {
              s9 = peg$parse__();
              if (s9 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 44) {
                  s10 = peg$c28;
                  peg$currPos++;
                } else {
                  s10 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c29); }
                }
                if (s10 !== peg$FAILED) {
                  s7 = [s7, s8, s9, s10];
                  s6 = s7;
                } else {
                  peg$currPos = s6;
                  s6 = peg$FAILED;
                }
              } else {
                peg$currPos = s6;
                s6 = peg$FAILED;
              }
            } else {
              peg$currPos = s6;
              s6 = peg$FAILED;
            }
          } else {
            peg$currPos = s6;
            s6 = peg$FAILED;
          }
          while (s6 !== peg$FAILED) {
            s5.push(s6);
            s6 = peg$currPos;
            s7 = peg$parse__();
            if (s7 !== peg$FAILED) {
              s8 = peg$parseboolean_expr();
              if (s8 !== peg$FAILED) {
                s9 = peg$parse__();
                if (s9 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 44) {
                    s10 = peg$c28;
                    peg$currPos++;
                  } else {
                    s10 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c29); }
                  }
                  if (s10 !== peg$FAILED) {
                    s7 = [s7, s8, s9, s10];
                    s6 = s7;
                  } else {
                    peg$currPos = s6;
                    s6 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s6;
                  s6 = peg$FAILED;
                }
              } else {
                peg$currPos = s6;
                s6 = peg$FAILED;
              }
            } else {
              peg$currPos = s6;
              s6 = peg$FAILED;
            }
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parse__();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseboolean_expr();
              if (s7 !== peg$FAILED) {
                s5 = [s5, s6, s7];
                s4 = s5;
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parse__();
            if (s5 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 41) {
                s6 = peg$c30;
                peg$currPos++;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c31); }
              }
              if (s6 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c32(s1, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parseprimary_expr();
    }

    return s0;
  }

  function peg$parseprimary_expr() {
    var s0, s1, s2, s3;

    s0 = peg$parsevalue();
    if (s0 === peg$FAILED) {
      s0 = peg$parseconstant();
      if (s0 === peg$FAILED) {
        s0 = peg$parseregister();
        if (s0 === peg$FAILED) {
          s0 = peg$parseidentifier();
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 40) {
              s1 = peg$c26;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c27); }
            }
            if (s1 !== peg$FAILED) {
              s2 = peg$parseboolean_expr();
              if (s2 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 41) {
                  s3 = peg$c30;
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c31); }
                }
                if (s3 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c33(s2);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parseassignable() {
    var s0;

    s0 = peg$parseregister();
    if (s0 === peg$FAILED) {
      s0 = peg$parseidentifier();
    }

    return s0;
  }

  function peg$parseidentifier() {
    var s0, s1, s2, s3, s4;

    s0 = peg$currPos;
    s1 = peg$currPos;
    if (peg$c22.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c23); }
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      if (peg$c24.test(input.charAt(peg$currPos))) {
        s4 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c25); }
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        if (peg$c24.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c25); }
        }
      }
      if (s3 !== peg$FAILED) {
        s2 = [s2, s3];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c34(s1);
    }
    s0 = s1;

    return s0;
  }

  function peg$parseconstant() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 36) {
      s1 = peg$c35;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c36); }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      if (peg$c24.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c25); }
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        if (peg$c24.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c25); }
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c37(s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseregister() {
    var s0, s1, s2, s3, s4, s5, s6;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 64) {
      s1 = peg$c38;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c39); }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      if (peg$c24.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c25); }
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        if (peg$c24.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c25); }
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c40(s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$currPos;
      if (peg$c41.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c42); }
      }
      if (s2 !== peg$FAILED) {
        if (peg$c43.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c44); }
        }
        if (s3 !== peg$FAILED) {
          if (peg$c45.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c46); }
          }
          if (s4 !== peg$FAILED) {
            if (peg$c47.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c48); }
            }
            if (s5 !== peg$FAILED) {
              if (peg$c47.test(input.charAt(peg$currPos))) {
                s6 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c48); }
              }
              if (s6 !== peg$FAILED) {
                s2 = [s2, s3, s4, s5, s6];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c49(s1);
      }
      s0 = s1;
    }

    return s0;
  }

  function peg$parsevalue() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8;

    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = [];
    if (peg$c47.test(input.charAt(peg$currPos))) {
      s3 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c48); }
    }
    while (s3 !== peg$FAILED) {
      s2.push(s3);
      if (peg$c47.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c48); }
      }
    }
    if (s2 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 46) {
        s3 = peg$c50;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c51); }
      }
      if (s3 !== peg$FAILED) {
        s4 = [];
        if (peg$c47.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c48); }
        }
        if (s5 !== peg$FAILED) {
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            if (peg$c47.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c48); }
            }
          }
        } else {
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$currPos;
          if (peg$c52.test(input.charAt(peg$currPos))) {
            s6 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c53); }
          }
          if (s6 !== peg$FAILED) {
            s7 = [];
            if (peg$c47.test(input.charAt(peg$currPos))) {
              s8 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s8 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c48); }
            }
            if (s8 !== peg$FAILED) {
              while (s8 !== peg$FAILED) {
                s7.push(s8);
                if (peg$c47.test(input.charAt(peg$currPos))) {
                  s8 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s8 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c48); }
                }
              }
            } else {
              s7 = peg$FAILED;
            }
            if (s7 !== peg$FAILED) {
              s6 = [s6, s7];
              s5 = s6;
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
          if (s5 === peg$FAILED) {
            s5 = null;
          }
          if (s5 !== peg$FAILED) {
            s2 = [s2, s3, s4, s5];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c54(s1);
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = [];
      if (peg$c55.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c56); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c55.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c56); }
          }
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        if (peg$c57.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c58); }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c59(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = [];
        if (peg$c47.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c48); }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (peg$c47.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c48); }
            }
          }
        } else {
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          if (peg$c60.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c61); }
          }
          if (s2 === peg$FAILED) {
            s2 = null;
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c62(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
    }

    return s0;
  }

  function peg$parse__() {
    var s0, s1;

    s0 = [];
    s1 = peg$parsewhiteSpace();
    if (s1 === peg$FAILED) {
      s1 = peg$parselineEnd();
      if (s1 === peg$FAILED) {
        s1 = peg$parsecomment();
      }
    }
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      s1 = peg$parsewhiteSpace();
      if (s1 === peg$FAILED) {
        s1 = peg$parselineEnd();
        if (s1 === peg$FAILED) {
          s1 = peg$parsecomment();
        }
      }
    }

    return s0;
  }

  function peg$parsewhiteSpace() {
    var s0;

    if (peg$c63.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c64); }
    }

    return s0;
  }

  function peg$parselineEnd() {
    var s0;

    if (peg$c65.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c66); }
    }

    return s0;
  }

  function peg$parsecomment() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c67) {
      s1 = peg$c67;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c68); }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$currPos;
      peg$silentFails++;
      if (input.substr(peg$currPos, 2) === peg$c69) {
        s5 = peg$c69;
        peg$currPos += 2;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c70); }
      }
      peg$silentFails--;
      if (s5 === peg$FAILED) {
        s4 = void 0;
      } else {
        peg$currPos = s4;
        s4 = peg$FAILED;
      }
      if (s4 !== peg$FAILED) {
        if (input.length > peg$currPos) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c71); }
        }
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c69) {
          s5 = peg$c69;
          peg$currPos += 2;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c70); }
        }
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = void 0;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c71); }
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c69) {
          s3 = peg$c69;
          peg$currPos += 2;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c70); }
        }
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c72) {
        s1 = peg$c72;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c73); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parselineEnd();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = void 0;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c71); }
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          s5 = peg$parselineEnd();
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = void 0;
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          if (s4 !== peg$FAILED) {
            if (input.length > peg$currPos) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c71); }
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }

    return s0;
  }


      var flatten = __webpack_require__(38).default;
      var map = __webpack_require__(13).default;
      var each = __webpack_require__(12).default;
      var Ast = __webpack_require__(134);

      function makeBinaryExpr(head, tail) {
          var result = head;
          tail.forEach(function(tailItem) {
              result = new Ast.BinaryExpr(tailItem[1], result, tailItem[3]);
          });
          return result;
      }

      function flattenChars(val) {
          return flatten(val).join("");
      }


  peg$result = peg$startRuleFunction();

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }

    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length
        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}

module.exports = {
  SyntaxError: peg$SyntaxError,
  parse:       peg$parse
};


/***/ }),
/* 274 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Component_1 = __webpack_require__(2);
var utils_1 = __webpack_require__(0);
/**
 * Actions for BufferSave
 */
var BufferSaveAction;
(function (BufferSaveAction) {
    BufferSaveAction[BufferSaveAction["SAVE"] = 0] = "SAVE";
    BufferSaveAction[BufferSaveAction["RESTORE"] = 1] = "RESTORE";
    BufferSaveAction[BufferSaveAction["SAVERESTORE"] = 2] = "SAVERESTORE";
    BufferSaveAction[BufferSaveAction["RESTORESAVE"] = 3] = "RESTORESAVE";
})(BufferSaveAction || (BufferSaveAction = {}));
/**
 * A component that saves or restores a copy of the current
 * frame buffer
 */
var BufferSave = /** @class */ (function (_super) {
    __extends(BufferSave, _super);
    function BufferSave(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    BufferSave.prototype.init = function () {
        this.updateAction();
        this.updateBlendMode();
        this.updateBuffer();
    };
    BufferSave.prototype.draw = function () {
        var currentAction;
        if (this.action === BufferSaveAction.SAVERESTORE ||
            this.action === BufferSaveAction.RESTORESAVE) {
            currentAction = this.nextAction;
            // toggle next action
            this.nextAction =
                (this.nextAction === BufferSaveAction.SAVE) ? BufferSaveAction.RESTORE : BufferSaveAction.SAVE;
        }
        else {
            currentAction = this.action;
        }
        var tempTSM = this.main.getTempTSM();
        switch (currentAction) {
            case BufferSaveAction.SAVE:
                tempTSM.setAsRenderTarget(this.opts.bufferId);
                this.main.getCopier().run(null, { srcTexture: this.parent.getTSM().getCurrentTexture() });
                tempTSM.unsetAsRenderTarget();
                break;
            case BufferSaveAction.RESTORE:
                this.main.getCopier().run(this.parent.getTSM(), { srcTexture: tempTSM.getTexture(this.opts.bufferId) }, this.blendMode);
                break;
        }
    };
    BufferSave.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.main.getTempTSM().removeTexture(this.opts.bufferId);
    };
    BufferSave.prototype.updateAction = function () {
        this.action = BufferSaveAction[this.opts.action];
        if (this.action === BufferSaveAction.SAVERESTORE) {
            this.nextAction = BufferSaveAction.SAVE;
        }
        else if (this.action === BufferSaveAction.RESTORESAVE) {
            this.nextAction = BufferSaveAction.RESTORE;
        }
    };
    BufferSave.prototype.updateBuffer = function (value, key, oldValue) {
        // buffer names in TextureSetManager have to be string
        // converting to string to maintain backward compatibility
        this.opts.bufferId = this.opts.bufferId + "";
        if (oldValue) {
            this.main.getTempTSM().removeTexture(oldValue);
        }
        this.main.getTempTSM().addTexture(this.opts.bufferId);
    };
    BufferSave.prototype.updateBlendMode = function () {
        this.blendMode = utils_1.BlendMode[this.opts.blendMode];
    };
    BufferSave.componentName = "BufferSave";
    BufferSave.componentTag = "misc";
    BufferSave.optUpdateHandlers = {
        action: "updateAction",
        blendMode: "updateBlendMode",
        bufferId: "updateBuffer"
    };
    BufferSave.defaultOptions = {
        action: "SAVE",
        blendMode: "REPLACE",
        bufferId: "buffer1"
    };
    return BufferSave;
}(Component_1["default"]));
exports["default"] = BufferSave;


/***/ }),
/* 275 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Component_1 = __webpack_require__(2);
var compileExpr_1 = __webpack_require__(28);
// A component that simply runs some avs expressions.
// Useful to maintain global state
var GlobalVar = /** @class */ (function (_super) {
    __extends(GlobalVar, _super);
    function GlobalVar(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    GlobalVar.prototype.init = function () {
        this.updateCode();
        this.listenTo(this.main, "resize", this.handleResize);
    };
    GlobalVar.prototype.draw = function () {
        var code = this.code;
        code.b = this.main.getAnalyser().isBeat() ? 1 : 0;
        if (!this.inited) {
            code.init();
            this.inited = true;
        }
        if (this.main.getAnalyser().isBeat()) {
            code.onBeat();
        }
        code.perFrame();
    };
    GlobalVar.prototype.updateCode = function () {
        this.code = compileExpr_1["default"](this.opts.code, ["init", "onBeat", "perFrame"]).codeInst;
        this.code.setup(this.main);
        this.inited = false;
    };
    GlobalVar.prototype.handleResize = function () {
        this.code.updateDimVars(this.main.getRctx().getGl());
    };
    GlobalVar.componentName = "GlobalVar";
    GlobalVar.componentTag = "misc";
    GlobalVar.optUpdateHandlers = {
        code: "updateCode"
    };
    GlobalVar.defaultOptions = {
        code: {
            init: "",
            onBeat: "",
            perFrame: ""
        }
    };
    return GlobalVar;
}(Component_1["default"]));
exports["default"] = GlobalVar;


/***/ }),
/* 276 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Component_1 = __webpack_require__(2);
var utils_1 = __webpack_require__(0);
var ClearScreenProgram_1 = __webpack_require__(139);
// A component that clears the screen
var ClearScreen = /** @class */ (function (_super) {
    __extends(ClearScreen, _super);
    function ClearScreen(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    ClearScreen.prototype.init = function () {
        this.prevBeat = false;
        this.beatCount = 0;
        this.updateColor();
        this.updateProgram();
    };
    ClearScreen.prototype.draw = function () {
        var clear = false;
        if (this.opts.beatCount === 0) {
            clear = true;
        }
        else {
            if (this.main.getAnalyser().isBeat() && !this.prevBeat) {
                this.beatCount++;
                if (this.beatCount >= this.opts.beatCount) {
                    clear = true;
                    this.beatCount = 0;
                }
            }
            this.prevBeat = this.main.getAnalyser().isBeat();
        }
        if (clear) {
            this.program.run(this.parent.getTSM(), { color: this.color });
        }
    };
    ClearScreen.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.program.destroy();
    };
    ClearScreen.prototype.updateColor = function () {
        this.color = utils_1.parseColorNorm(this.opts.color);
    };
    ClearScreen.prototype.updateProgram = function () {
        var blendMode = utils_1.BlendMode[this.opts.blendMode];
        var program = new ClearScreenProgram_1["default"](this.main.getRctx(), blendMode);
        if (this.program) {
            this.program.destroy();
        }
        this.program = program;
    };
    ClearScreen.componentName = "ClearScreen";
    ClearScreen.componentTag = "render";
    ClearScreen.defaultOptions = {
        beatCount: 0,
        blendMode: "REPLACE",
        color: "#000000"
    };
    ClearScreen.optUpdateHandlers = {
        blendMode: "updateProgram",
        color: "updateColor"
    };
    return ClearScreen;
}(Component_1["default"]));
exports["default"] = ClearScreen;


/***/ }),
/* 277 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseIndexOf_js__ = __webpack_require__(115);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__toInteger_js__ = __webpack_require__(21);



/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Gets the index at which the first occurrence of `value` is found in `array`
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons. If `fromIndex` is negative, it's used as the
 * offset from the end of `array`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} [fromIndex=0] The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 * @example
 *
 * _.indexOf([1, 2, 1, 2], 2);
 * // => 1
 *
 * // Search from the `fromIndex`.
 * _.indexOf([1, 2, 1, 2], 2, 2);
 * // => 3
 */
function indexOf(array, value, fromIndex) {
  var length = array == null ? 0 : array.length;
  if (!length) {
    return -1;
  }
  var index = fromIndex == null ? 0 : Object(__WEBPACK_IMPORTED_MODULE_1__toInteger_js__["a" /* default */])(fromIndex);
  if (index < 0) {
    index = nativeMax(length + index, 0);
  }
  return Object(__WEBPACK_IMPORTED_MODULE_0__baseIndexOf_js__["a" /* default */])(array, value, index);
}

/* harmony default export */ __webpack_exports__["default"] = (indexOf);


/***/ }),
/* 278 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Component_1 = __webpack_require__(2);
var utils_1 = __webpack_require__(0);
var geometries_1 = __webpack_require__(85);
var ShaderProgram_1 = __webpack_require__(3);
// A particle that moves around depending on beat changes
var MovingParticle = /** @class */ (function (_super) {
    __extends(MovingParticle, _super);
    function MovingParticle(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    MovingParticle.prototype.init = function () {
        this.centerX = 0;
        this.centerY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.posX = 0;
        this.posY = 0;
        this.updateBlendMode();
        var gl = this.main.getRctx().getGl();
        this.program = new ShaderProgram_1["default"](this.main.getRctx(), {
            bindings: {
                attribs: {
                    points: { name: "a_points", drawMode: gl.TRIANGLE_FAN }
                },
                uniforms: {
                    color: { name: "u_color", valueType: utils_1.WebGLVarType._3FV },
                    position: { name: "u_position", valueType: utils_1.WebGLVarType._2FV },
                    scale: { name: "u_scale", valueType: utils_1.WebGLVarType._2FV }
                }
            },
            copyOnSwap: true,
            dynamicBlend: true,
            fragmentShader: "\n                uniform vec3 u_color;\n                void main() {\n                   setFragColor(vec4(u_color, 1));\n                }\n            ",
            vertexShader: "\n                attribute vec2 a_point;\n                uniform vec2 u_position;\n                uniform vec2 u_scale;\n                void main() {\n                   setPosition((a_point*u_scale)+u_position);\n                }\n            "
        });
        this.updateColor();
    };
    MovingParticle.prototype.draw = function () {
        if (this.main.getAnalyser().isBeat()) {
            this.centerX = (Math.random() * 2 - 1) * 0.3;
            this.centerY = (Math.random() * 2 - 1) * 0.3;
        }
        this.velocityX -= 0.004 * (this.posX - this.centerX);
        this.velocityY -= 0.004 * (this.posY - this.centerY);
        this.posX += this.velocityX;
        this.posY += this.velocityY;
        this.velocityX *= 0.991;
        this.velocityY *= 0.991;
        var x = this.posX * this.opts.distance;
        var y = this.posY * this.opts.distance;
        var scaleX;
        var scaleY;
        if (this.opts.onBeatSizeChange && this.main.getAnalyser().isBeat()) {
            scaleX = this.opts.onBeatParticleSize;
            scaleY = this.opts.onBeatParticleSize;
        }
        else {
            scaleX = this.opts.particleSize;
            scaleY = this.opts.particleSize;
        }
        var gl = this.main.getRctx().getGl();
        scaleX = 2 * scaleX / gl.drawingBufferWidth;
        scaleY = 2 * scaleY / gl.drawingBufferHeight;
        this.program.run(this.parent.getTSM(), {
            color: this.color,
            points: geometries_1.circleGeometry(this.main.getRctx()),
            position: [x, y],
            scale: [scaleX, scaleY]
        }, this.blendMode);
    };
    MovingParticle.prototype.updateBlendMode = function () {
        this.blendMode = utils_1.BlendMode[this.opts.blendMode];
    };
    MovingParticle.prototype.updateColor = function () {
        this.color = utils_1.parseColorNorm(this.opts.color);
    };
    MovingParticle.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.program.destroy();
    };
    MovingParticle.componentName = "MovingParticle";
    MovingParticle.componentTag = "render";
    MovingParticle.optUpdateHandlers = {
        blendMode: "updateBlendMode",
        color: "updateColor"
    };
    MovingParticle.defaultOptions = {
        blendMode: "REPLACE",
        color: "#FFFFFF",
        distance: 0.7,
        onBeatParticleSize: 10,
        onBeatSizeChange: false,
        particleSize: 10
    };
    return MovingParticle;
}(Component_1["default"]));
exports["default"] = MovingParticle;


/***/ }),
/* 279 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Component_1 = __webpack_require__(2);
var utils_1 = __webpack_require__(0);
var geometries_1 = __webpack_require__(85);
var ShaderProgram_1 = __webpack_require__(3);
// A component that renders an image onto the screen
var Picture = /** @class */ (function (_super) {
    __extends(Picture, _super);
    function Picture(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    Picture.prototype.init = function () {
        var gl = this.main.getRctx().getGl();
        this.program = new ShaderProgram_1["default"](this.main.getRctx(), {
            bindings: {
                attribs: {
                    points: { name: "a_texVertex", drawMode: gl.TRIANGLES }
                },
                uniforms: {
                    image: { name: "u_image", valueType: utils_1.WebGLVarType.TEXTURE2D },
                    imageRes: { name: "u_texRes", valueType: utils_1.WebGLVarType._2FV },
                    position: { name: "u_pos", valueType: utils_1.WebGLVarType._2FV }
                }
            },
            copyOnSwap: true,
            fragmentShader: "\n                uniform sampler2D u_image;\n                varying vec2 v_texCoord;\n                void main() {\n                   setFragColor(texture2D(u_image, v_texCoord));\n                }\n            ",
            vertexShader: "\n                attribute vec2 a_texVertex;\n                uniform vec2 u_pos;\n                uniform vec2 u_texRes;\n                varying vec2 v_texCoord;\n\n                void main() {\n                   v_texCoord = a_texVertex;\n                   setPosition(a_texVertex*(u_texRes/u_resolution)*vec2(2,-2)+u_pos);\n                }\n            "
        });
        this.updateImage();
    };
    Picture.prototype.draw = function () {
        this.program.run(this.parent.getTSM(), {
            image: this.texture,
            imageRes: [this.width, this.height],
            points: geometries_1.squareGeometry(this.main.getRctx(), true),
            position: [this.opts.x, -this.opts.y]
        });
    };
    Picture.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.program.destroy();
        this.main.getRctx().getGl().deleteTexture(this.texture);
    };
    Picture.prototype.updateImage = function () {
        var _this = this;
        var gl = this.main.getRctx().getGl();
        this.main.getRsrcMan().getImage(this.opts.src, function (image) {
            _this.width = image.width;
            _this.height = image.height;
            if (!_this.texture) {
                _this.texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, _this.texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }
            else {
                gl.bindTexture(gl.TEXTURE_2D, _this.texture);
            }
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        });
    };
    Picture.componentName = "Picture";
    Picture.componentTag = "render";
    Picture.optUpdateHandlers = {
        src: "updateImage"
    };
    Picture.defaultOptions = {
        src: "avsres_texer_circle_edgeonly_19x19.bmp",
        x: 0,
        y: 0
    };
    return Picture;
}(Component_1["default"]));
exports["default"] = Picture;


/***/ }),
/* 280 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var each_1 = __webpack_require__(12);
var map_1 = __webpack_require__(13);
var Component_1 = __webpack_require__(2);
var CodeInstance_1 = __webpack_require__(84);
var compileExpr_1 = __webpack_require__(28);
var utils_1 = __webpack_require__(0);
var Buffer_1 = __webpack_require__(29);
var ShaderProgram_1 = __webpack_require__(3);
/**
 * Drawing modes for the [[SuperScope]] component
 */
var SuperScopeDrawMode;
(function (SuperScopeDrawMode) {
    SuperScopeDrawMode[SuperScopeDrawMode["LINES"] = 1] = "LINES";
    SuperScopeDrawMode[SuperScopeDrawMode["DOTS"] = 2] = "DOTS";
})(SuperScopeDrawMode || (SuperScopeDrawMode = {}));
/**
 * A generic scope, that can draw points or lines based on user code
 */
var SuperScope = /** @class */ (function (_super) {
    __extends(SuperScope, _super);
    function SuperScope(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    SuperScope.prototype.init = function () {
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
        this.pointBuffer = new Buffer_1["default"](this.main.getRctx());
        this.colorBuffer = new Buffer_1["default"](this.main.getRctx());
    };
    SuperScope.prototype.draw = function () {
        var _this = this;
        var color = this._makeColor();
        each_1["default"](this.code, function (code) {
            _this.drawScope(code, color, !_this.inited);
        });
        this.inited = true;
    };
    SuperScope.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.program.destroy();
        this.pointBuffer.destroy();
        this.colorBuffer.destroy();
    };
    /**
     * renders the scope
     * @memberof Webvs.SuperScope#
     */
    SuperScope.prototype.drawScope = function (code, color, runInit) {
        var gl = this.main.getRctx().getGl();
        code.red = color[0];
        code.green = color[1];
        code.blue = color[2];
        if (runInit) {
            code.init();
        }
        var beat = this.main.getAnalyser().isBeat();
        code.b = beat ? 1 : 0;
        code.perFrame();
        if (beat) {
            code.onBeat();
        }
        var nPoints = Math.floor(code.n);
        var data;
        if (this.source === utils_1.Source.SPECTRUM) {
            data = this.main.getAnalyser().getSpectrum(this.channel);
        }
        else {
            data = this.main.getAnalyser().getWaveform(this.channel);
        }
        var dots = this.drawMode === SuperScopeDrawMode.DOTS;
        var bucketSize = data.length / nPoints;
        var pbi = 0;
        var cdi = 0;
        var bufferSize;
        var thickX;
        var thickY;
        var lastX;
        var lastY;
        var lastR;
        var lastG;
        var lastB;
        if (this.veryThick) {
            bufferSize = (dots ? (nPoints * 6) : (nPoints * 6 - 6));
            thickX = this.opts.thickness / gl.drawingBufferWidth;
            thickY = this.opts.thickness / gl.drawingBufferHeight;
        }
        else {
            bufferSize = (dots ? nPoints : (nPoints * 2 - 2));
        }
        var pointBufferData = new Float32Array(bufferSize * 2);
        var colorData = new Float32Array(bufferSize * 3);
        for (var i = 0; i < nPoints; i++) {
            var value = 0;
            var size = 0;
            for (var j = Math.floor(i * bucketSize); j < (i + 1) * bucketSize; j++, size++) {
                value += data[j];
            }
            value = value / size;
            var pos = i / ((nPoints > 1) ? (nPoints - 1) : 1);
            code.i = pos;
            code.v = value;
            code.perPoint();
            code.y *= -1;
            if (this.veryThick) {
                if (dots) {
                    // just a box at current point
                    pointBufferData[pbi++] = code.x - thickX;
                    pointBufferData[pbi++] = code.y - thickY;
                    pointBufferData[pbi++] = code.x + thickX;
                    pointBufferData[pbi++] = code.y - thickY;
                    pointBufferData[pbi++] = code.x - thickX;
                    pointBufferData[pbi++] = code.y + thickY;
                    pointBufferData[pbi++] = code.x + thickX;
                    pointBufferData[pbi++] = code.y - thickY;
                    pointBufferData[pbi++] = code.x - thickX;
                    pointBufferData[pbi++] = code.y + thickY;
                    pointBufferData[pbi++] = code.x + thickX;
                    pointBufferData[pbi++] = code.y + thickY;
                    for (var j = 0; j < 6; j++) {
                        colorData[cdi++] = code.red;
                        colorData[cdi++] = code.green;
                        colorData[cdi++] = code.blue;
                    }
                }
                else {
                    if (i !== 0) {
                        var xdiff = Math.abs(lastX - code.x);
                        var ydiff = Math.abs(lastY - code.y);
                        var xoff = (xdiff <= ydiff) ? thickX : 0;
                        var yoff = (xdiff > ydiff) ? thickY : 0;
                        // a rectangle from last point to the current point
                        pointBufferData[pbi++] = lastX + xoff;
                        pointBufferData[pbi++] = lastY + yoff;
                        pointBufferData[pbi++] = code.x + xoff;
                        pointBufferData[pbi++] = code.y + yoff;
                        pointBufferData[pbi++] = lastX - xoff;
                        pointBufferData[pbi++] = lastY - yoff;
                        pointBufferData[pbi++] = code.x + xoff;
                        pointBufferData[pbi++] = code.y + yoff;
                        pointBufferData[pbi++] = lastX - xoff;
                        pointBufferData[pbi++] = lastY - yoff;
                        pointBufferData[pbi++] = code.x - xoff;
                        pointBufferData[pbi++] = code.y - yoff;
                        for (var j = 0; j < 6; j++) {
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
            else {
                if (dots) {
                    // just a point at the current point
                    pointBufferData[pbi++] = code.x;
                    pointBufferData[pbi++] = code.y;
                    colorData[cdi++] = code.red;
                    colorData[cdi++] = code.green;
                    colorData[cdi++] = code.blue;
                }
                else {
                    if (i !== 0) {
                        // lines from last point to current point
                        pointBufferData[pbi++] = lastX;
                        pointBufferData[pbi++] = lastY;
                        pointBufferData[pbi++] = code.x;
                        pointBufferData[pbi++] = code.y;
                        for (var j = 0; j < 2; j++) {
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
        this.pointBuffer.setData(pointBufferData);
        this.colorBuffer.setData(colorData);
        this.program.run(this.parent.getTSM(), {
            colors: this.colorBuffer,
            drawTriangles: this.veryThick,
            isDots: dots,
            pointSize: this.veryThick ? 1 : this.opts.thickness,
            points: this.pointBuffer
        });
    };
    SuperScope.prototype.updateProgram = function () {
        var blendMode = utils_1.BlendMode[this.opts.blendMode];
        var program = new ShaderProgram_1["default"](this.main.getRctx(), {
            bindings: {
                attribs: {
                    colors: { name: "a_color", size: 3 },
                    points: { name: "a_position" }
                },
                uniforms: {
                    pointSize: { name: "u_pointSize", valueType: utils_1.WebGLVarType._1F }
                }
            },
            blendMode: blendMode,
            copyOnSwap: true,
            drawHook: function (values, gl) {
                var prevLineWidth;
                if (!values.isDots) {
                    prevLineWidth = gl.getParameter(gl.LINE_WIDTH);
                    gl.lineWidth(values.pointSize);
                }
                var mode;
                if (values.drawTriangles) {
                    mode = gl.TRIANGLES;
                }
                else if (values.isDots) {
                    mode = gl.POINTS;
                }
                else {
                    mode = gl.LINES;
                }
                gl.drawArrays(mode, 0, values.points.getLength() / 2);
                if (!values.isDots) {
                    gl.lineWidth(prevLineWidth);
                }
            },
            fragmentShader: "\n                varying vec3 v_color;\n                void main() {\n                    setFragColor(vec4(v_color, 1));\n                }\n            ",
            vertexShader: "\n                attribute vec2 a_position;\n                attribute vec3 a_color;\n                varying vec3 v_color;\n                uniform float u_pointSize;\n                void main() {\n                    gl_PointSize = u_pointSize;\n                    setPosition(a_position);\n                    v_color = a_color;\n                }\n            "
        });
        if (this.program) {
            this.program.destroy();
        }
        this.program = program;
    };
    SuperScope.prototype.updateCode = function () {
        var code = compileExpr_1["default"](this.opts.code, ["init", "onBeat", "perFrame", "perPoint"]).codeInst;
        code.n = 100;
        code.setup(this.main);
        this.inited = false;
        this.code = [code];
    };
    SuperScope.prototype.updateClones = function () {
        this.code = CodeInstance_1["default"].clone(this.code, this.opts.clone);
    };
    SuperScope.prototype.updateColors = function () {
        this.colors = map_1["default"](this.opts.colors, utils_1.parseColorNorm);
        this.curColorId = 0;
    };
    SuperScope.prototype.updateSpeed = function () {
        var oldMaxStep = this.maxStep;
        this.maxStep = Math.floor(1 / this.opts.cycleSpeed);
        if (this.curStep) {
            // curStep adjustment when speed changes
            this.curStep = Math.floor((this.curStep / oldMaxStep) * this.maxStep);
        }
        else {
            this.curStep = 0;
        }
    };
    SuperScope.prototype.updateChannel = function () {
        this.channel = utils_1.Channels[this.opts.channel];
    };
    SuperScope.prototype.updateSource = function () {
        this.source = utils_1.Source[this.opts.source];
    };
    SuperScope.prototype.updateDrawMode = function () {
        this.drawMode = SuperScopeDrawMode[this.opts.drawMode];
    };
    SuperScope.prototype.updateThickness = function () {
        var range;
        var gl = this.main.getRctx().getGl();
        if (this.drawMode === SuperScopeDrawMode.DOTS) {
            range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
        }
        else {
            range = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);
        }
        if (this.opts.thickness < range[0] || this.opts.thickness > range[1]) {
            this.veryThick = true;
        }
        else {
            this.veryThick = false;
        }
    };
    SuperScope.prototype._makeColor = function () {
        if (this.colors.length === 1) {
            return this.colors[0];
        }
        else {
            var color = [0, 0, 0];
            var currentColor = this.colors[this.curColorId];
            var nextColor = this.colors[(this.curColorId + 1) % this.colors.length];
            var mix = this.curStep / this.maxStep;
            for (var i = 0; i < 3; i++) {
                color[i] = currentColor[i] * (1 - mix) + nextColor[i] * mix;
            }
            this.curStep = (this.curStep + 1) % this.maxStep;
            if (this.curStep === 0) {
                this.curColorId = (this.curColorId + 1) % this.colors.length;
            }
            return color;
        }
    };
    SuperScope.prototype.handleResize = function () {
        var _this = this;
        each_1["default"](this.code, function (code) {
            code.updateDimVars(_this.main.getRctx().getGl());
        });
    };
    SuperScope.componentName = "SuperScope";
    SuperScope.componentTag = "render";
    SuperScope.optUpdateHandlers = {
        blendMode: "updateProgram",
        channel: "updateChannel",
        clone: "updateClones",
        code: ["updateCode", "updateClones"],
        colors: "updateColors",
        cycleSpeed: "updateSpeed",
        drawMode: "updateDrawMode",
        source: "updateSource",
        thickness: "updateThickness"
    };
    SuperScope.defaultOptions = {
        blendMode: "REPLACE",
        channel: "CENTER",
        clone: 1,
        code: {
            init: "n=800",
            onBeat: "",
            perFrame: "t=t-0.05",
            perPoint: "d=i+v*0.2; r=t+i*$PI*4; x=cos(r)*d; y=sin(r)*d"
        },
        colors: ["#ffffff"],
        cycleSpeed: 0.01,
        drawMode: "LINES",
        source: "SPECTRUM",
        thickness: 1
    };
    return SuperScope;
}(Component_1["default"]));
exports["default"] = SuperScope;


/***/ }),
/* 281 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var each_1 = __webpack_require__(12);
var Component_1 = __webpack_require__(2);
var CodeInstance_1 = __webpack_require__(84);
var compileExpr_1 = __webpack_require__(28);
var utils_1 = __webpack_require__(0);
var Buffer_1 = __webpack_require__(29);
var ShaderProgram_1 = __webpack_require__(3);
// A SuperScope like component that places images at points.
var Texer = /** @class */ (function (_super) {
    __extends(Texer, _super);
    function Texer(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    Texer.prototype.handleResize = function () {
        for (var _i = 0, _a = this.code; _i < _a.length; _i++) {
            var codeInst = _a[_i];
            codeInst.updateDimVars(this.main.getRctx().getGl());
        }
    };
    Texer.prototype.init = function () {
        var rctx = this.main.getRctx();
        var gl = this.main.getRctx().getGl();
        this.program = new ShaderProgram_1["default"](rctx, {
            bindings: {
                attribs: {
                    colors: { name: "a_color", size: 3 },
                    texVertices: { name: "a_texVertex" },
                    vertices: { name: "a_vertex" }
                },
                index: {
                    drawMode: gl.TRIANGLES,
                    valueName: "indices"
                },
                uniforms: {
                    colorFilter: { name: "u_colorFilter", valueType: utils_1.WebGLVarType._1I },
                    image: { name: "u_image", valueType: utils_1.WebGLVarType.TEXTURE2D }
                }
            },
            copyOnSwap: true,
            fragmentShader: "\n                uniform bool u_colorFilter;\n                uniform sampler2D u_image;\n                varying vec2 v_texVertex;\n                varying vec3 v_color;\n                void main() {\n                   vec3 outColor = texture2D(u_image, v_texVertex).rgb;\n                   if(u_colorFilter) {\n                       outColor = outColor*v_color;\n                   }\n                   setFragColor(vec4(outColor, 1));\n                }\n            ",
            vertexShader: "\n                uniform bool u_colorFilter;\n                attribute vec2 a_texVertex;\n                attribute vec2 a_vertex;\n                attribute vec3 a_color;\n                varying vec2 v_texVertex;\n                varying vec3 v_color;\n                void main() {\n                   if(u_colorFilter) {\n                       v_color = a_color;\n                   }\n                   v_texVertex = a_texVertex;\n                   setPosition(a_vertex);\n                }\n            "
        });
        this.updateCode();
        this.updateClone();
        this.updateImage();
        this.updateSource();
        this.listenTo(this.main, "resize", this.handleResize);
        this.vertexBuffer = new Buffer_1["default"](rctx);
        this.texVertexBuffer = new Buffer_1["default"](rctx);
        this.colorBuffer = new Buffer_1["default"](rctx);
        this.indexBuffer = new Buffer_1["default"](rctx, true);
    };
    Texer.prototype.draw = function () {
        var _this = this;
        each_1["default"](this.code, function (code) {
            _this._drawScope(code, !_this.inited);
        });
        this.inited = true;
    };
    Texer.prototype.destroy = function () {
        var gl = this.main.getRctx().getGl();
        _super.prototype.destroy.call(this);
        this.program.destroy();
        gl.deleteTexture(this.texture);
        this.vertexBuffer.destroy();
        this.texVertexBuffer.destroy();
        this.colorBuffer.destroy();
        this.indexBuffer.destroy();
    };
    Texer.prototype.updateCode = function () {
        var code = compileExpr_1["default"](this.opts.code, ["init", "onBeat", "perFrame", "perPoint"]).codeInst;
        code.n = 100;
        code.setup(this.main);
        this.inited = false;
        this.code = [code];
    };
    Texer.prototype.updateClone = function () {
        this.code = CodeInstance_1["default"].clone(this.code, this.opts.clone);
    };
    Texer.prototype.updateImage = function () {
        var _this = this;
        var gl = this.main.getRctx().getGl();
        this.main.getRsrcMan().getImage(this.opts.imageSrc, function (image) {
            _this.imageWidth = image.width;
            _this.imageHeight = image.height;
            if (!_this.texture) {
                _this.texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, _this.texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }
            else {
                gl.bindTexture(gl.TEXTURE_2D, _this.texture);
            }
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        });
    };
    Texer.prototype.updateSource = function () {
        this.source = utils_1.Source[this.opts.source];
    };
    Texer.prototype._drawScope = function (code, runInit) {
        var gl = this.main.getRctx().getGl();
        if (runInit) {
            code.init();
        }
        var beat = this.main.getAnalyser().isBeat();
        code.b = beat ? 1 : 0;
        code.perFrame();
        if (beat) {
            code.onBeat();
        }
        var nPoints = Math.floor(code.n);
        var data;
        if (this.source === utils_1.Source.SPECTRUM) {
            data = this.main.getAnalyser().getSpectrum();
        }
        else {
            data = this.main.getAnalyser().getWaveform();
        }
        var bucketSize = data.length / nPoints;
        var vertexData = [];
        var texVertexData = [];
        var vertexIndices = [];
        var colorData = this.opts.colorFiltering ? [] : null;
        var index = 0;
        var addRect = function (cornx, corny, sizex, sizey, red, green, blue) {
            if (cornx < -1 - sizex || cornx > 1 ||
                corny < -1 - sizey || corny > 1) {
                return;
            }
            // screen coordinates
            vertexData.push(cornx, corny, cornx + sizex, corny, cornx + sizex, corny + sizey, cornx, corny + sizey);
            // texture coordinates
            texVertexData.push(0, 0, 1, 0, 1, 1, 0, 1);
            if (colorData) {
                // color data
                colorData.push(red, green, blue, red, green, blue, red, green, blue, red, green, blue);
            }
            // indices
            vertexIndices.push(index + 0, index + 1, index + 2, index + 0, index + 2, index + 3);
            index += 4;
        };
        var imageSizex = (this.imageWidth / gl.drawingBufferWidth) * 2;
        var imageSizey = (this.imageHeight / gl.drawingBufferHeight) * 2;
        for (var i = 0; i < nPoints; i++) {
            var value = 0;
            var size = 0;
            for (var j = Math.floor(i * bucketSize); j < (i + 1) * bucketSize; j++, size++) {
                value += data[j];
            }
            value = value / size;
            var pos = i / (nPoints - 1);
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
            if (this.opts.resizing) {
                sizex *= code.sizex;
                sizey *= code.sizey;
            }
            var cornx = code.x - sizex / 2;
            var corny = (-code.y) - sizey / 2;
            addRect(cornx, corny, sizex, sizey, code.red, code.green, code.blue);
            if (this.opts.wrapAround) {
                // wrapped around x value is 1-(-1-cornx) or -1-(1-cornx)
                // depending on the edge
                // ie. 2+cornx or -2+cornx
                var xwrap = (cornx < -1) ? 2 : ((cornx > (1 - sizex)) ? -2 : 0);
                var ywrap = (corny < -1) ? 2 : ((corny > (1 - sizey)) ? -2 : 0);
                if (xwrap) {
                    addRect(xwrap + cornx, corny, sizex, sizey, code.red, code.green, code.blue);
                }
                if (ywrap) {
                    addRect(cornx, ywrap + corny, sizex, sizey, code.red, code.green, code.blue);
                }
                if (xwrap && ywrap) {
                    addRect(xwrap + cornx, ywrap + corny, sizex, sizey, code.red, code.green, code.blue);
                }
            }
        }
        this.vertexBuffer.setData(vertexData);
        this.texVertexBuffer.setData(texVertexData);
        this.indexBuffer.setData(new Uint16Array(vertexIndices));
        if (colorData) {
            this.colorBuffer.setData(colorData);
        }
        this.program.run(this.parent.getTSM(), {
            colorFilter: colorData ? 1 : 0,
            colors: colorData ? this.colorBuffer : null,
            image: this.texture,
            indices: this.indexBuffer,
            texVertices: this.texVertexBuffer,
            vertices: this.vertexBuffer
        });
    };
    Texer.componentName = "Texer";
    Texer.componentTag = "render";
    Texer.optUpdateHandlers = {
        clone: "updateClone",
        code: "updateCode",
        imageSrc: "updateImage",
        source: "updateSource"
    };
    Texer.defaultOptions = {
        clone: 1,
        code: {
            init: "",
            onBeat: "",
            perFrame: "",
            perPoint: ""
        },
        colorFiltering: true,
        imageSrc: "avsres_texer_circle_edgeonly_19x19.bmp",
        resizing: false,
        source: "SPECTRUM",
        wrapAround: false
    };
    return Texer;
}(Component_1["default"]));
exports["default"] = Texer;


/***/ }),
/* 282 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var clone_1 = __webpack_require__(47);
var extend_1 = __webpack_require__(135);
var isArray_1 = __webpack_require__(1);
var pickBy_1 = __webpack_require__(283);
var Model_1 = __webpack_require__(76);
/**
 * ResourceManager manages async loading and caching of resources.
 *
 * ResourceManager Basically, it maintains a map of fileNames to URI for
 * the resource. When a request for resource fileName is received, the uri is looked up
 * and the file is either async loaded or served from cache. This also manages
 * a ready state with callbacks that tells when one or more resources are being loaded and
 * when all resources are ready.
 */
var ResourceManager = /** @class */ (function (_super) {
    __extends(ResourceManager, _super);
    function ResourceManager(packs) {
        var _this = _super.call(this) || this;
        _this.ready = true;
        _this.uris = {};
        _this.images = {};
        _this.waitImages = {};
        _this.waitCount = 0;
        if (packs) {
            if (!isArray_1["default"](packs)) {
                packs = [packs];
            }
            _this.packs = packs;
        }
        else {
            _this.packs = [];
        }
        _this.clear();
        return _this;
    }
    /**
     * Register a filename and a URI in the resource manager.
     *
     * @param fileName name of the file or map of filename: uri.
     * @param uri uri when string fileName is specified
     */
    ResourceManager.prototype.registerUri = function (fileName, uri) {
        if (typeof fileName === "string" && typeof uri === "string") {
            this.uris[fileName] = uri;
        }
        else {
            var inputUris = fileName;
            extend_1["default"](this.uris, inputUris);
        }
    };
    /**
     * Returns the attributes for this ResourceManager
     *
     * @param key the name of the attribute. Only `"uris"` is acceptable.
     */
    ResourceManager.prototype.get = function (key) {
        if (key === "uris") {
            return this.uris;
        }
    };
    /**
     * Returns JSON representation of the resource manager
     */
    ResourceManager.prototype.toJSON = function () {
        return {
            uris: clone_1["default"](this.uris)
        };
    };
    /**
     * Clears state, uri mappings and caches. Browser caches still apply.
     *
     * @param keys the keys which should be cleared. Default clears everything.
     */
    ResourceManager.prototype.clear = function (keys) {
        if (keys === void 0) { keys = null; }
        for (var fileName in this.waitImages) {
            if (!this.waitImages.hasOwnProperty(fileName)) {
                continue;
            }
            var image = this.waitImages[fileName];
            image.onload = null;
            image.onerror = null;
        }
        this.waitImages = {};
        if (keys) {
            var pickPredicate = function (val, key) { return keys.indexOf(key) === -1; };
            this.uris = pickBy_1["default"](this.uris, pickPredicate);
            this.images = pickBy_1["default"](this.images, pickPredicate);
        }
        else {
            this.uris = {};
            this.images = {};
        }
        this.waitCount = 0;
        this.ready = true;
    };
    /**
     * Loads an Image resource.
     *
     * @param fileName fileName of the image to be returned
     * @param success handler that'll be called on success
     * @param error handler that'll be called on error
     */
    ResourceManager.prototype.getImage = function (fileName, success, error) {
        var _this = this;
        var image = this.images[fileName];
        if (image) {
            if (success) {
                success(image);
            }
            return;
        }
        // load file
        var uri = this._getUri(fileName);
        if (!uri) {
            throw new Error("Unknown image file " + fileName);
        }
        image = new Image();
        if (uri.indexOf("data:") !== 0) {
            // add cross origin attribute for
            // remote images
            image.crossOrigin = "anonymous";
        }
        image.onload = function () {
            delete _this.waitImages[fileName];
            _this.images[fileName] = image;
            if (success) {
                success(image);
            }
            _this._loadEnd();
        };
        if (error) {
            image.onerror = function () {
                delete _this.waitImages[fileName];
                if (error()) {
                    // then we treat this load as complete
                    // and handled properly
                    _this._loadEnd();
                }
            };
        }
        this._loadStart();
        image.src = uri;
        this.waitImages[fileName] = image;
    };
    ResourceManager.prototype.setAttribute = function (key, value, options) {
        if (key === "uris") {
            this.uris = value;
            return true;
        }
        return false;
    };
    ResourceManager.prototype._getUri = function (fileName) {
        var uri = this.uris[fileName];
        if (uri) {
            return uri;
        }
        for (var i = this.packs.length - 1; i >= 0; i--) {
            var pack = this.packs[i];
            if (pack.fileNames.indexOf(fileName) !== -1) {
                return pack.prefix + fileName;
            }
        }
    };
    ResourceManager.prototype._loadStart = function () {
        this.waitCount++;
        if (this.waitCount === 1) {
            this.ready = false;
            this.emit("wait");
        }
    };
    ResourceManager.prototype._loadEnd = function () {
        this.waitCount--;
        if (this.waitCount === 0) {
            this.ready = true;
            this.emit("ready");
        }
    };
    return ResourceManager;
}(Model_1["default"]));
exports["default"] = ResourceManager;


/***/ }),
/* 283 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayMap_js__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseIteratee_js__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__basePickBy_js__ = __webpack_require__(104);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__getAllKeysIn_js__ = __webpack_require__(66);





/**
 * Creates an object composed of the `object` properties `predicate` returns
 * truthy for. The predicate is invoked with two arguments: (value, key).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The source object.
 * @param {Function} [predicate=_.identity] The function invoked per property.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.pickBy(object, _.isNumber);
 * // => { 'a': 1, 'c': 3 }
 */
function pickBy(object, predicate) {
  if (object == null) {
    return {};
  }
  var props = Object(__WEBPACK_IMPORTED_MODULE_0__arrayMap_js__["a" /* default */])(Object(__WEBPACK_IMPORTED_MODULE_3__getAllKeysIn_js__["a" /* default */])(object), function(prop) {
    return [prop];
  });
  predicate = Object(__WEBPACK_IMPORTED_MODULE_1__baseIteratee_js__["a" /* default */])(predicate);
  return Object(__WEBPACK_IMPORTED_MODULE_2__basePickBy_js__["a" /* default */])(object, props, function(value, path) {
    return predicate(value, path[0]);
  });
}

/* harmony default export */ __webpack_exports__["default"] = (pickBy);


/***/ }),
/* 284 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var flatMap_1 = __webpack_require__(285);
var Component_1 = __webpack_require__(2);
var utils_1 = __webpack_require__(0);
var ShaderProgram_1 = __webpack_require__(3);
/**
 * Channel shift mode for [[ChannelShift]] component
 */
var ChannelShiftMode;
(function (ChannelShiftMode) {
    ChannelShiftMode[ChannelShiftMode["RGB"] = 0] = "RGB";
    ChannelShiftMode[ChannelShiftMode["RBG"] = 1] = "RBG";
    ChannelShiftMode[ChannelShiftMode["BRG"] = 2] = "BRG";
    ChannelShiftMode[ChannelShiftMode["BGR"] = 3] = "BGR";
    ChannelShiftMode[ChannelShiftMode["GBR"] = 4] = "GBR";
    ChannelShiftMode[ChannelShiftMode["GRB"] = 5] = "GRB";
})(ChannelShiftMode || (ChannelShiftMode = {}));
var ShiftChannelsKeys = Object.keys(ChannelShiftMode).filter(function (s) { return isNaN(parseInt(s, 10)); });
/**
 * A component that swizzles the color component
 */
var ChannelShift = /** @class */ (function (_super) {
    __extends(ChannelShift, _super);
    function ChannelShift(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    ChannelShift.prototype.init = function () {
        this.program = new ShaderProgram_1["default"](this.main.getRctx(), {
            bindings: {
                uniforms: {
                    channel: { name: "u_channel", valueType: utils_1.WebGLVarType._1I }
                }
            },
            fragmentShader: "\n                uniform int u_channel;\n                void main() {\n                    vec3 color = getSrcColor().rgb;\n                    " + flatMap_1["default"](ShiftChannelsKeys, function (channel) { return "\n                            if(u_channel == " + ChannelShiftMode[channel] + ") {\n                                setFragColor(vec4(color." + channel.toLowerCase() + ", 1));\n                            }\n                        "; }).join("\n") + "\n                }\n            ",
            swapFrame: true
        });
        this.updateChannel();
    };
    ChannelShift.prototype.draw = function () {
        if (this.opts.onBeatRandom && this.main.getAnalyser().isBeat()) {
            this.channel = Math.floor(Math.random() * ShiftChannelsKeys.length);
        }
        this.program.run(this.parent.getTSM(), { channel: this.channel });
    };
    ChannelShift.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.program.destroy();
    };
    ChannelShift.prototype.updateChannel = function () {
        this.channel = ChannelShiftMode[this.opts.channel];
    };
    ChannelShift.componentName = "ChannelShift";
    ChannelShift.componentTag = "trans";
    ChannelShift.optUpdateHandlers = {
        channel: "updateChannel"
    };
    ChannelShift.defaultOptions = {
        channel: "RGB",
        onBeatRandom: false
    };
    return ChannelShift;
}(Component_1["default"]));
exports["default"] = ChannelShift;


/***/ }),
/* 285 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseFlatten_js__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__map_js__ = __webpack_require__(13);



/**
 * Creates a flattened array of values by running each element in `collection`
 * thru `iteratee` and flattening the mapped results. The iteratee is invoked
 * with three arguments: (value, index|key, collection).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the new flattened array.
 * @example
 *
 * function duplicate(n) {
 *   return [n, n];
 * }
 *
 * _.flatMap([1, 2], duplicate);
 * // => [1, 1, 2, 2]
 */
function flatMap(collection, iteratee) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__baseFlatten_js__["a" /* default */])(Object(__WEBPACK_IMPORTED_MODULE_1__map_js__["default"])(collection, iteratee), 1);
}

/* harmony default export */ __webpack_exports__["default"] = (flatMap);


/***/ }),
/* 286 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Component_1 = __webpack_require__(2);
var utils_1 = __webpack_require__(0);
var ShaderProgram_1 = __webpack_require__(3);
/**
 * Clipping moder for the [[ColorClip]] component
 */
var ColorClipMode;
(function (ColorClipMode) {
    ColorClipMode[ColorClipMode["BELOW"] = 0] = "BELOW";
    ColorClipMode[ColorClipMode["ABOVE"] = 1] = "ABOVE";
    ColorClipMode[ColorClipMode["NEAR"] = 2] = "NEAR";
})(ColorClipMode || (ColorClipMode = {}));
/**
 * A component that clips colors to a different color depending
 * on whether the source colors are above or below a reference color.
 */
var ColorClip = /** @class */ (function (_super) {
    __extends(ColorClip, _super);
    function ColorClip(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    ColorClip.prototype.init = function () {
        this.program = new ShaderProgram_1["default"](this.main.getRctx(), {
            bindings: {
                uniforms: {
                    color: { name: "u_color", valueType: utils_1.WebGLVarType._3FV },
                    level: { name: "u_level", valueType: utils_1.WebGLVarType._1F },
                    mode: { name: "u_mode", valueType: utils_1.WebGLVarType._1I },
                    outColor: { name: "u_outColor", valueType: utils_1.WebGLVarType._3FV }
                }
            },
            fragmentShader: "\n                uniform int u_mode;\n                uniform vec3 u_color;\n                uniform vec3 u_outColor;\n                uniform float u_level;\n\n                void main() {\n                   vec4 inColor4 = getSrcColor();\n                   vec3 inColor = inColor4.rgb;\n                   bool clip = false;\n                   if(u_mode == 0) {\n                        clip = all(lessThanEqual(inColor, u_color));\n                   }\n                   if(u_mode == 1) {\n                        clip = all(greaterThanEqual(inColor, u_color));\n                   }\n                   if(u_mode == 2) {\n                        clip = (distance(inColor, u_color) <= u_level*0.5);\n                   }\n                   if(clip) {\n                       setFragColor(vec4(u_outColor, inColor4.a));\n                   } else {\n                       setFragColor(inColor4);\n                   }\n                }\n            ",
            swapFrame: true
        });
        this.updateColor();
        this.updateMode();
    };
    ColorClip.prototype.draw = function () {
        this.program.run(this.parent.getTSM(), {
            color: this.color,
            level: this.opts.level,
            mode: this.mode,
            outColor: this.outColor
        });
    };
    ColorClip.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.program.destroy();
    };
    ColorClip.prototype.updateMode = function () {
        this.mode = ColorClipMode[this.opts.mode];
    };
    ColorClip.prototype.updateColor = function () {
        this.color = utils_1.parseColorNorm(this.opts.color);
        this.outColor = utils_1.parseColorNorm(this.opts.outColor);
    };
    ColorClip.componentName = "ColorClip";
    ColorClip.componentTag = "trans";
    ColorClip.optUpdateHandlers = {
        color: "updateColor",
        mode: "updateMode",
        outColor: "updateColor"
    };
    ColorClip.defaultOptions = {
        color: "#202020",
        level: 0,
        mode: "BELOW",
        outColor: "#202020"
    };
    return ColorClip;
}(Component_1["default"]));
exports["default"] = ColorClip;


/***/ }),
/* 287 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var each_1 = __webpack_require__(12);
var first_1 = __webpack_require__(288);
var last_1 = __webpack_require__(111);
var map_1 = __webpack_require__(13);
var sortBy_1 = __webpack_require__(290);
var take_1 = __webpack_require__(136);
var takeRight_1 = __webpack_require__(83);
var times_1 = __webpack_require__(137);
var uniq_1 = __webpack_require__(133);
var zip_1 = __webpack_require__(295);
var Component_1 = __webpack_require__(2);
var utils_1 = __webpack_require__(0);
var ShaderProgram_1 = __webpack_require__(3);
/**
 * Color mapping key for [[ColorMap]] component
 */
var ColorMapKey;
(function (ColorMapKey) {
    ColorMapKey[ColorMapKey["RED"] = 0] = "RED";
    ColorMapKey[ColorMapKey["GREEN"] = 1] = "GREEN";
    ColorMapKey[ColorMapKey["BLUE"] = 2] = "BLUE";
    ColorMapKey[ColorMapKey["(R+G+B)/2"] = 3] = "(R+G+B)/2";
    ColorMapKey[ColorMapKey["(R+G+B)/3"] = 4] = "(R+G+B)/3";
    ColorMapKey[ColorMapKey["MAX"] = 5] = "MAX";
})(ColorMapKey || (ColorMapKey = {}));
/**
 * Color map cycling modes for [[ColorMap]] component
 */
var ColorMapCycleMode;
(function (ColorMapCycleMode) {
    ColorMapCycleMode[ColorMapCycleMode["SINGLE"] = 0] = "SINGLE";
    ColorMapCycleMode[ColorMapCycleMode["ONBEATRANDOM"] = 1] = "ONBEATRANDOM";
    ColorMapCycleMode[ColorMapCycleMode["ONBEATSEQUENTIAL"] = 2] = "ONBEATSEQUENTIAL";
})(ColorMapCycleMode || (ColorMapCycleMode = {}));
/**
 * A component that changes colors according to a gradient map using
 * a key generated from the source colors
 */
var ColorMap = /** @class */ (function (_super) {
    __extends(ColorMap, _super);
    function ColorMap(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    ColorMap.prototype.init = function () {
        this.program = new ShaderProgram_1["default"](this.main.getRctx(), {
            bindings: {
                uniforms: {
                    colorMap: { name: "u_colorMap", valueType: utils_1.WebGLVarType.TEXTURE2D },
                    key: { name: "u_key", valueType: utils_1.WebGLVarType._1I }
                }
            },
            dynamicBlend: true,
            fragmentShader: "\n                uniform int u_key;\n                uniform sampler2D u_colorMap;\n                void main() {\n                   vec4 srcColor = getSrcColor();\n                   float key;\n                   if(u_key == " + ColorMapKey.RED + "          ) { key = srcColor.r; }\n                   if(u_key == " + ColorMapKey.GREEN + "        ) { key = srcColor.g; }\n                   if(u_key == " + ColorMapKey.BLUE + "         ) { key = srcColor.b; }\n                   if(u_key == " + ColorMapKey["(R+G+B)/2"] + " ) { key = min((srcColor.r+srcColor.g+srcColor.b)/2.0, 1.0); }\n                   if(u_key == " + ColorMapKey["(R+G+B)/3"] + " ) { key = (srcColor.r+srcColor.g+srcColor.b)/3.0; }\n                   if(u_key == " + ColorMapKey.MAX + "          ) { key = max(srcColor.r, max(srcColor.g, srcColor.b)); }\n                   setFragColor(texture2D(u_colorMap, vec2(key, 0)));\n                }\n            ",
            swapFrame: true
        });
        this.updateMap();
        this.updateKey();
        this.updateCycleMode();
        this.updateBlendMode();
    };
    ColorMap.prototype.draw = function () {
        if (this.main.getAnalyser().isBeat()) {
            if (this.mapCycleMode === ColorMapCycleMode.ONBEATRANDOM) {
                this.currentMap = Math.floor(Math.random() * this.opts.maps.length);
            }
            else if (this.mapCycleMode === ColorMapCycleMode.ONBEATSEQUENTIAL) {
                this.currentMap = (this.currentMap + 1) % this.colorMaps.length;
            }
        }
        this.program.run(this.parent.getTSM(), {
            colorMap: this.colorMaps[this.currentMap],
            key: this.key
        }, this.blendMode);
    };
    ColorMap.prototype.destroy = function () {
        var _this = this;
        _super.prototype.destroy.call(this);
        this.program.destroy();
        each_1["default"](this.colorMaps, function (tex) {
            _this.main.getRctx().getGl().deleteTexture(tex);
        });
    };
    ColorMap.prototype.updateMap = function () {
        var _this = this;
        if (this.colorMaps) {
            each_1["default"](this.colorMaps, function (tex) {
                _this.main.getRctx().getGl().deleteTexture(tex);
            });
        }
        this.colorMaps = map_1["default"](this.opts.maps, function (colorMap) { return _this._buildColorMap(colorMap); });
        this.currentMap = 0;
    };
    ColorMap.prototype.updateCycleMode = function () {
        this.mapCycleMode = ColorMapCycleMode[this.opts.mapCycleMode];
    };
    ColorMap.prototype.updateKey = function () {
        this.key = ColorMapKey[this.opts.key];
    };
    ColorMap.prototype.updateBlendMode = function () {
        this.blendMode = utils_1.BlendMode[this.opts.output];
    };
    ColorMap.prototype._buildColorMap = function (mapItems) {
        var gl = this.main.getRctx().getGl();
        mapItems = sortBy_1["default"](mapItems, function (mapItem) { return mapItem.index; });
        // check for repeated indices
        var indices = map_1["default"](mapItems, function (mapItem) { return mapItem.index; });
        if (uniq_1["default"](indices).length !== indices.length) {
            throw new Error("map cannot have repeated indices");
        }
        // parse all the colors
        var parsedMap = map_1["default"](mapItems, function (mapItem) {
            var color = utils_1.parseColor(mapItem.color);
            return { color: color, index: mapItem.index };
        });
        // add a cap entries at the ends
        var firstMap = first_1["default"](parsedMap);
        if (firstMap.index !== 0) {
            parsedMap.splice(0, 0, { color: firstMap.color, index: 0 });
        }
        var lastMap = last_1["default"](parsedMap);
        if (lastMap.index !== 255) {
            parsedMap.push({ color: lastMap.color, index: 255 });
        }
        // lerp intermediate values
        var colorMap = new Uint8Array(256 * 3);
        var cmi = 0;
        var pairs = zip_1["default"](take_1["default"](parsedMap, parsedMap.length - 1), takeRight_1["default"](parsedMap, parsedMap.length - 1));
        each_1["default"](pairs, function (pair) {
            var firstItem = pair[0];
            var secondItem = pair[1];
            var steps = secondItem.index - firstItem.index;
            times_1["default"](steps, function (i) {
                colorMap[cmi++] = Math.floor((firstItem.color[0] * (steps - i) + secondItem.color[0] * i) / steps);
                colorMap[cmi++] = Math.floor((firstItem.color[1] * (steps - i) + secondItem.color[1] * i) / steps);
                colorMap[cmi++] = Math.floor((firstItem.color[2] * (steps - i) + secondItem.color[2] * i) / steps);
            });
        });
        colorMap[cmi++] = lastMap.color[0];
        colorMap[cmi++] = lastMap.color[1];
        colorMap[cmi++] = lastMap.color[2];
        // put the color values into a 256x1 texture
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 256, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, colorMap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return texture;
    };
    ColorMap.componentName = "ColorMap";
    ColorMap.componentTag = "trans";
    ColorMap.optUpdateHandlers = {
        key: "updateKey",
        mapCycleMode: "updateCycleMode",
        maps: "updateMap",
        output: "updateBlendMode"
    };
    ColorMap.defaultOptions = {
        key: "RED",
        mapCycleMode: "SINGLE",
        maps: [
            [
                { index: 0, color: "#000000" },
                { index: 255, color: "#FFFFFF" },
            ],
        ],
        output: "REPLACE"
    };
    return ColorMap;
}(Component_1["default"]));
exports["default"] = ColorMap;


/***/ }),
/* 288 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__head_js__ = __webpack_require__(289);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return __WEBPACK_IMPORTED_MODULE_0__head_js__["a"]; });



/***/ }),
/* 289 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Gets the first element of `array`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @alias first
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the first element of `array`.
 * @example
 *
 * _.head([1, 2, 3]);
 * // => 1
 *
 * _.head([]);
 * // => undefined
 */
function head(array) {
  return (array && array.length) ? array[0] : undefined;
}

/* harmony default export */ __webpack_exports__["a"] = (head);


/***/ }),
/* 290 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseFlatten_js__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseOrderBy_js__ = __webpack_require__(291);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__baseRest_js__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__isIterateeCall_js__ = __webpack_require__(70);





/**
 * Creates an array of elements, sorted in ascending order by the results of
 * running each element in a collection thru each iteratee. This method
 * performs a stable sort, that is, it preserves the original sort order of
 * equal elements. The iteratees are invoked with one argument: (value).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {...(Function|Function[])} [iteratees=[_.identity]]
 *  The iteratees to sort by.
 * @returns {Array} Returns the new sorted array.
 * @example
 *
 * var users = [
 *   { 'user': 'fred',   'age': 48 },
 *   { 'user': 'barney', 'age': 36 },
 *   { 'user': 'fred',   'age': 40 },
 *   { 'user': 'barney', 'age': 34 }
 * ];
 *
 * _.sortBy(users, [function(o) { return o.user; }]);
 * // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 40]]
 *
 * _.sortBy(users, ['user', 'age']);
 * // => objects for [['barney', 34], ['barney', 36], ['fred', 40], ['fred', 48]]
 */
var sortBy = Object(__WEBPACK_IMPORTED_MODULE_2__baseRest_js__["a" /* default */])(function(collection, iteratees) {
  if (collection == null) {
    return [];
  }
  var length = iteratees.length;
  if (length > 1 && Object(__WEBPACK_IMPORTED_MODULE_3__isIterateeCall_js__["a" /* default */])(collection, iteratees[0], iteratees[1])) {
    iteratees = [];
  } else if (length > 2 && Object(__WEBPACK_IMPORTED_MODULE_3__isIterateeCall_js__["a" /* default */])(iteratees[0], iteratees[1], iteratees[2])) {
    iteratees = [iteratees[0]];
  }
  return Object(__WEBPACK_IMPORTED_MODULE_1__baseOrderBy_js__["a" /* default */])(collection, Object(__WEBPACK_IMPORTED_MODULE_0__baseFlatten_js__["a" /* default */])(iteratees, 1), []);
});

/* harmony default export */ __webpack_exports__["default"] = (sortBy);


/***/ }),
/* 291 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayMap_js__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseIteratee_js__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__baseMap_js__ = __webpack_require__(123);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__baseSortBy_js__ = __webpack_require__(292);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__baseUnary_js__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__compareMultiple_js__ = __webpack_require__(293);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__identity_js__ = __webpack_require__(18);








/**
 * The base implementation of `_.orderBy` without param guards.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
 * @param {string[]} orders The sort orders of `iteratees`.
 * @returns {Array} Returns the new sorted array.
 */
function baseOrderBy(collection, iteratees, orders) {
  var index = -1;
  iteratees = Object(__WEBPACK_IMPORTED_MODULE_0__arrayMap_js__["a" /* default */])(iteratees.length ? iteratees : [__WEBPACK_IMPORTED_MODULE_6__identity_js__["a" /* default */]], Object(__WEBPACK_IMPORTED_MODULE_4__baseUnary_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_1__baseIteratee_js__["a" /* default */]));

  var result = Object(__WEBPACK_IMPORTED_MODULE_2__baseMap_js__["a" /* default */])(collection, function(value, key, collection) {
    var criteria = Object(__WEBPACK_IMPORTED_MODULE_0__arrayMap_js__["a" /* default */])(iteratees, function(iteratee) {
      return iteratee(value);
    });
    return { 'criteria': criteria, 'index': ++index, 'value': value };
  });

  return Object(__WEBPACK_IMPORTED_MODULE_3__baseSortBy_js__["a" /* default */])(result, function(object, other) {
    return Object(__WEBPACK_IMPORTED_MODULE_5__compareMultiple_js__["a" /* default */])(object, other, orders);
  });
}

/* harmony default export */ __webpack_exports__["a"] = (baseOrderBy);


/***/ }),
/* 292 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * The base implementation of `_.sortBy` which uses `comparer` to define the
 * sort order of `array` and replaces criteria objects with their corresponding
 * values.
 *
 * @private
 * @param {Array} array The array to sort.
 * @param {Function} comparer The function to define sort order.
 * @returns {Array} Returns `array`.
 */
function baseSortBy(array, comparer) {
  var length = array.length;

  array.sort(comparer);
  while (length--) {
    array[length] = array[length].value;
  }
  return array;
}

/* harmony default export */ __webpack_exports__["a"] = (baseSortBy);


/***/ }),
/* 293 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__compareAscending_js__ = __webpack_require__(294);


/**
 * Used by `_.orderBy` to compare multiple properties of a value to another
 * and stable sort them.
 *
 * If `orders` is unspecified, all values are sorted in ascending order. Otherwise,
 * specify an order of "desc" for descending or "asc" for ascending sort order
 * of corresponding values.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {boolean[]|string[]} orders The order to sort by for each property.
 * @returns {number} Returns the sort order indicator for `object`.
 */
function compareMultiple(object, other, orders) {
  var index = -1,
      objCriteria = object.criteria,
      othCriteria = other.criteria,
      length = objCriteria.length,
      ordersLength = orders.length;

  while (++index < length) {
    var result = Object(__WEBPACK_IMPORTED_MODULE_0__compareAscending_js__["a" /* default */])(objCriteria[index], othCriteria[index]);
    if (result) {
      if (index >= ordersLength) {
        return result;
      }
      var order = orders[index];
      return result * (order == 'desc' ? -1 : 1);
    }
  }
  // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
  // that causes it, under certain circumstances, to provide the same value for
  // `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247
  // for more details.
  //
  // This also ensures a stable sort in V8 and other engines.
  // See https://bugs.chromium.org/p/v8/issues/detail?id=90 for more details.
  return object.index - other.index;
}

/* harmony default export */ __webpack_exports__["a"] = (compareMultiple);


/***/ }),
/* 294 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__isSymbol_js__ = __webpack_require__(25);


/**
 * Compares values to sort them in ascending order.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {number} Returns the sort order indicator for `value`.
 */
function compareAscending(value, other) {
  if (value !== other) {
    var valIsDefined = value !== undefined,
        valIsNull = value === null,
        valIsReflexive = value === value,
        valIsSymbol = Object(__WEBPACK_IMPORTED_MODULE_0__isSymbol_js__["a" /* default */])(value);

    var othIsDefined = other !== undefined,
        othIsNull = other === null,
        othIsReflexive = other === other,
        othIsSymbol = Object(__WEBPACK_IMPORTED_MODULE_0__isSymbol_js__["a" /* default */])(other);

    if ((!othIsNull && !othIsSymbol && !valIsSymbol && value > other) ||
        (valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol) ||
        (valIsNull && othIsDefined && othIsReflexive) ||
        (!valIsDefined && othIsReflexive) ||
        !valIsReflexive) {
      return 1;
    }
    if ((!valIsNull && !valIsSymbol && !othIsSymbol && value < other) ||
        (othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol) ||
        (othIsNull && valIsDefined && valIsReflexive) ||
        (!othIsDefined && valIsReflexive) ||
        !othIsReflexive) {
      return -1;
    }
  }
  return 0;
}

/* harmony default export */ __webpack_exports__["a"] = (compareAscending);


/***/ }),
/* 295 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseRest_js__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__unzip_js__ = __webpack_require__(296);



/**
 * Creates an array of grouped elements, the first of which contains the
 * first elements of the given arrays, the second of which contains the
 * second elements of the given arrays, and so on.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {...Array} [arrays] The arrays to process.
 * @returns {Array} Returns the new array of grouped elements.
 * @example
 *
 * _.zip(['a', 'b'], [1, 2], [true, false]);
 * // => [['a', 1, true], ['b', 2, false]]
 */
var zip = Object(__WEBPACK_IMPORTED_MODULE_0__baseRest_js__["a" /* default */])(__WEBPACK_IMPORTED_MODULE_1__unzip_js__["a" /* default */]);

/* harmony default export */ __webpack_exports__["default"] = (zip);


/***/ }),
/* 296 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayFilter_js__ = __webpack_require__(63);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__arrayMap_js__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__baseProperty_js__ = __webpack_require__(114);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__baseTimes_js__ = __webpack_require__(54);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__isArrayLikeObject_js__ = __webpack_require__(44);






/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * This method is like `_.zip` except that it accepts an array of grouped
 * elements and creates an array regrouping the elements to their pre-zip
 * configuration.
 *
 * @static
 * @memberOf _
 * @since 1.2.0
 * @category Array
 * @param {Array} array The array of grouped elements to process.
 * @returns {Array} Returns the new array of regrouped elements.
 * @example
 *
 * var zipped = _.zip(['a', 'b'], [1, 2], [true, false]);
 * // => [['a', 1, true], ['b', 2, false]]
 *
 * _.unzip(zipped);
 * // => [['a', 'b'], [1, 2], [true, false]]
 */
function unzip(array) {
  if (!(array && array.length)) {
    return [];
  }
  var length = 0;
  array = Object(__WEBPACK_IMPORTED_MODULE_0__arrayFilter_js__["a" /* default */])(array, function(group) {
    if (Object(__WEBPACK_IMPORTED_MODULE_4__isArrayLikeObject_js__["a" /* default */])(group)) {
      length = nativeMax(group.length, length);
      return true;
    }
  });
  return Object(__WEBPACK_IMPORTED_MODULE_3__baseTimes_js__["a" /* default */])(length, function(index) {
    return Object(__WEBPACK_IMPORTED_MODULE_1__arrayMap_js__["a" /* default */])(array, Object(__WEBPACK_IMPORTED_MODULE_2__baseProperty_js__["a" /* default */])(index));
  });
}

/* harmony default export */ __webpack_exports__["a"] = (unzip);


/***/ }),
/* 297 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var isArray_1 = __webpack_require__(1);
var reduce_1 = __webpack_require__(298);
var Component_1 = __webpack_require__(2);
var utils_1 = __webpack_require__(0);
var ShaderProgram_1 = __webpack_require__(3);
/**
 * Edge handling modes for [[Convolution]] component
 */
var ConvEdgeMode;
(function (ConvEdgeMode) {
    /**
     * Extend edge value beyond edge
     */
    ConvEdgeMode[ConvEdgeMode["EXTEND"] = 0] = "EXTEND";
    /**
     * Wrap around to opposite edge
     */
    ConvEdgeMode[ConvEdgeMode["WRAP"] = 1] = "WRAP";
})(ConvEdgeMode || (ConvEdgeMode = {}));
/**
 * A component that applies a convolution kernel
 */
var Convolution = /** @class */ (function (_super) {
    __extends(Convolution, _super);
    function Convolution(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    Convolution.prototype.init = function () {
        this.updateProgram();
        this.updateScale();
    };
    Convolution.prototype.draw = function () {
        this.program.run(this.parent.getTSM(), { scale: this.scale, bias: this.opts.bias });
    };
    Convolution.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.program.destroy();
    };
    Convolution.prototype.updateScale = function () {
        var opts = this.opts;
        if (opts.autoScale) {
            this.scale = reduce_1["default"](opts.kernel, function (memo, num) { return memo + num; }, 0);
        }
        else {
            this.scale = opts.scale;
        }
    };
    Convolution.prototype.updateProgram = function () {
        var opts = this.opts;
        if (!isArray_1["default"](opts.kernel) || opts.kernel.length % 2 !== 1) {
            throw new Error("Invalid convolution kernel");
        }
        var kernelSize = Math.floor(Math.sqrt(opts.kernel.length));
        if (kernelSize * kernelSize !== opts.kernel.length) {
            throw new Error("Invalid convolution kernel");
        }
        var edgeMode = ConvEdgeMode[this.opts.edgeMode];
        // generate edge correction function
        var edgeFunc = "";
        switch (edgeMode) {
            case ConvEdgeMode.WRAP:
                edgeFunc = "pos = vec2(pos.x<0?pos.x+1.0:pos.x%1, pos.y<0?pos.y+1.0:pos.y%1);";
                break;
            case ConvEdgeMode.EXTEND:
                edgeFunc = "pos = clamp(pos, vec2(0,0), vec2(1,1));";
                break;
        }
        // generate kernel multiplication code
        var colorSumEq = [];
        var mid = Math.floor(kernelSize / 2);
        for (var i = 0; i < kernelSize; i++) {
            for (var j = 0; j < kernelSize; j++) {
                var value = opts.kernel[(i * kernelSize + j)];
                if (value === 0) {
                    continue;
                }
                colorSumEq.push("pos = v_position + texel * vec2(" + (j - mid) + "," + (mid - i) + ");");
                colorSumEq.push(edgeFunc);
                colorSumEq.push("colorSum += texture2D(u_srcTexture, pos) * " + utils_1.glslFloatRepr(value) + ";");
            }
        }
        var program = new ShaderProgram_1["default"](this.main.getRctx(), {
            bindings: {
                uniforms: {
                    bias: { name: "u_bias", valueType: utils_1.WebGLVarType._1F },
                    scale: { name: "u_scale", valueType: utils_1.WebGLVarType._1F }
                }
            },
            fragmentShader: "\n                uniform float u_scale;\n                uniform float u_bias;\n                void main() {\n                   vec2 texel = 1.0/(u_resolution-vec2(1,1));\n                   vec2 pos;\n                   vec4 colorSum = vec4(0,0,0,0);\n                   " + colorSumEq.join("\n") + "\n                   setFragColor(vec4(((colorSum+u_bias)/u_scale).rgb, 1.0));\n                }\n            ",
            swapFrame: true
        });
        if (this.program) {
            this.program.destroy();
        }
        this.program = program;
    };
    Convolution.componentName = "Convolution";
    Convolution.componentTag = "trans";
    Convolution.optUpdateHandlers = {
        edgeMode: "updateProgram",
        kernel: ["updateProgram", "updateScale"],
        scale: "updateScale"
    };
    Convolution.defaultOptions = {
        autoScale: true,
        bias: 0,
        edgeMode: "EXTEND",
        kernel: [
            0, 0, 0,
            0, 1, 0,
            0, 0, 0,
        ],
        scale: 0
    };
    return Convolution;
}(Component_1["default"]));
exports["default"] = Convolution;


/***/ }),
/* 298 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrayReduce_js__ = __webpack_require__(299);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__baseEach_js__ = __webpack_require__(42);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__baseIteratee_js__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__baseReduce_js__ = __webpack_require__(300);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__isArray_js__ = __webpack_require__(1);






/**
 * Reduces `collection` to a value which is the accumulated result of running
 * each element in `collection` thru `iteratee`, where each successive
 * invocation is supplied the return value of the previous. If `accumulator`
 * is not given, the first element of `collection` is used as the initial
 * value. The iteratee is invoked with four arguments:
 * (accumulator, value, index|key, collection).
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.reduce`, `_.reduceRight`, and `_.transform`.
 *
 * The guarded methods are:
 * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `orderBy`,
 * and `sortBy`
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @returns {*} Returns the accumulated value.
 * @see _.reduceRight
 * @example
 *
 * _.reduce([1, 2], function(sum, n) {
 *   return sum + n;
 * }, 0);
 * // => 3
 *
 * _.reduce({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
 *   (result[value] || (result[value] = [])).push(key);
 *   return result;
 * }, {});
 * // => { '1': ['a', 'c'], '2': ['b'] } (iteration order is not guaranteed)
 */
function reduce(collection, iteratee, accumulator) {
  var func = Object(__WEBPACK_IMPORTED_MODULE_4__isArray_js__["default"])(collection) ? __WEBPACK_IMPORTED_MODULE_0__arrayReduce_js__["a" /* default */] : __WEBPACK_IMPORTED_MODULE_3__baseReduce_js__["a" /* default */],
      initAccum = arguments.length < 3;

  return func(collection, Object(__WEBPACK_IMPORTED_MODULE_2__baseIteratee_js__["a" /* default */])(iteratee, 4), accumulator, initAccum, __WEBPACK_IMPORTED_MODULE_1__baseEach_js__["a" /* default */]);
}

/* harmony default export */ __webpack_exports__["default"] = (reduce);


/***/ }),
/* 299 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initAccum) {
  var index = -1,
      length = array == null ? 0 : array.length;

  if (initAccum && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

/* harmony default export */ __webpack_exports__["a"] = (arrayReduce);


/***/ }),
/* 300 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * The base implementation of `_.reduce` and `_.reduceRight`, without support
 * for iteratee shorthands, which iterates over `collection` using `eachFunc`.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} accumulator The initial value.
 * @param {boolean} initAccum Specify using the first or last element of
 *  `collection` as the initial value.
 * @param {Function} eachFunc The function to iterate over `collection`.
 * @returns {*} Returns the accumulated value.
 */
function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
  eachFunc(collection, function(value, index, collection) {
    accumulator = initAccum
      ? (initAccum = false, value)
      : iteratee(accumulator, value, index, collection);
  });
  return accumulator;
}

/* harmony default export */ __webpack_exports__["a"] = (baseReduce);


/***/ }),
/* 301 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Component_1 = __webpack_require__(2);
var compileExpr_1 = __webpack_require__(28);
var utils_1 = __webpack_require__(0);
var Buffer_1 = __webpack_require__(29);
var ShaderProgram_1 = __webpack_require__(3);
/**
 * Coordinate Movement coordinate modes
 */
var DynamicMovementCoordMode;
(function (DynamicMovementCoordMode) {
    DynamicMovementCoordMode[DynamicMovementCoordMode["POLAR"] = 0] = "POLAR";
    DynamicMovementCoordMode[DynamicMovementCoordMode["RECT"] = 1] = "RECT";
})(DynamicMovementCoordMode || (DynamicMovementCoordMode = {}));
/**
 * A component that moves pixels according to user code
 */
var DynamicMovement = /** @class */ (function (_super) {
    __extends(DynamicMovement, _super);
    function DynamicMovement(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    DynamicMovement.prototype.init = function () {
        this.updateCode();
        this.updateGrid();
        this.listenTo(this.main, "resize", this.handleResize);
    };
    DynamicMovement.prototype.draw = function () {
        var code = this.code;
        // run init, if required
        if (!this.inited) {
            code.init();
            this.inited = true;
        }
        var beat = this.main.getAnalyser().isBeat();
        code.b = beat ? 1 : 0;
        // run per frame
        code.perFrame();
        // run on beat
        if (beat) {
            code.onBeat();
        }
        this.program.run(this.parent.getTSM(), this.opts.noGrid ? {} : { grid: this.gridVertexBuffer });
    };
    DynamicMovement.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.program.destroy();
        if (this.gridVertexBuffer) {
            this.gridVertexBuffer.destroy();
        }
    };
    DynamicMovement.prototype.updateCode = function () {
        var compileResult = compileExpr_1["default"](this.opts.code, ["init", "onBeat", "perFrame"], ["perPixel"], ["x", "y", "d", "r", "b", "alpha"]);
        // js code
        var code = compileResult.codeInst;
        code.setup(this.main);
        this.inited = false;
        this.code = code;
        // glsl code
        this.glslCode = compileResult.glslCode;
        this.updateProgram();
    };
    DynamicMovement.prototype.updateProgram = function () {
        var _this = this;
        var opts = this.opts;
        var coordMode = DynamicMovementCoordMode[this.opts.coord];
        var rctx = this.main.getRctx();
        var programOpts = {
            blendMode: opts.blend ? utils_1.BlendMode.ALPHA : utils_1.BlendMode.REPLACE,
            drawHook: function (values, gl, dmProgram) {
                // bind values from code instance into program
                _this.code.bindUniforms(dmProgram);
                // return true to indicate unhandled draw.
                // This lets ShaderProgram handle draw calls
                return true;
            },
            fragmentShader: "",
            swapFrame: true
        };
        if (opts.noGrid) {
            programOpts.fragmentShader = "\n                " + this.glslCode + "\n                " + glslFilter(opts.bFilter, opts.compat) + "\n                void main() {\n                    " + (this.code.hasRandom ? "__randSeed = v_position;" : "") + "\n                    x = v_position.x*2.0-1.0;\n                    y = -(v_position.y*2.0-1.0);\n                    " + glslRectToPolar(coordMode) + "\n                    alpha=0.5;\n                    perPixel();\n                    " + glslPolarToRect(coordMode) + "\n                    setFragColor(vec4(filter(vec2(x, -y)), " + (opts.blend ? "alpha" : "1.0") + "));\n                }\n            ";
        }
        else {
            programOpts.bindings = {
                attribs: {
                    grid: { name: "a_position", drawMode: rctx.getGl().TRIANGLES }
                }
            };
            programOpts.vertexShader = "\n                attribute vec2 a_position;\n                varying vec2 v_newPoint;\n                varying float v_alpha;\n                " + this.glslCode + "\n                void main() {\n                    " + (this.code.hasRandom ? "__randSeed = a_position;" : "") + "\n                    x = a_position.x;\n                    y = -a_position.y;\n                    " + glslRectToPolar(coordMode) + "\n                    alpha = 0.5;\n                    perPixel();\n                    v_alpha = alpha;\n                    " + glslPolarToRect(coordMode) + "\n                    v_newPoint = vec2(x,-y);\n                    setPosition(a_position);\n                }\n            ";
            programOpts.fragmentShader = "\n                varying vec2 v_newPoint;\n                varying float v_alpha;\n                " + glslFilter(opts.bFilter, opts.compat) + "\n                void main() {\n                   setFragColor(vec4(filter(v_newPoint), " + (opts.blend ? "v_alpha" : "1.0") + "));\n                }\n            ";
        }
        var program = new ShaderProgram_1["default"](rctx, programOpts);
        if (this.program) {
            this.program.destroy();
        }
        this.program = program;
    };
    DynamicMovement.prototype.updateGrid = function () {
        var opts = this.opts;
        var gl = this.main.getRctx().getGl();
        if (!opts.noGrid) {
            var gridW = utils_1.clamp(opts.gridW, 1, gl.drawingBufferWidth);
            var gridH = utils_1.clamp(opts.gridH, 1, gl.drawingBufferHeight);
            var nGridW = (gridW / gl.drawingBufferWidth) * 2;
            var nGridH = (gridH / gl.drawingBufferHeight) * 2;
            var gridCountAcross = Math.ceil(gl.drawingBufferWidth / gridW);
            var gridCountDown = Math.ceil(gl.drawingBufferHeight / gridH);
            var gridVertices = new Float32Array(gridCountAcross * gridCountDown * 6 * 2);
            var pbi = 0;
            var curx = -1;
            var cury = -1;
            for (var i = 0; i < gridCountDown; i++) {
                for (var j = 0; j < gridCountAcross; j++) {
                    var cornx = Math.min(curx + nGridW, 1);
                    var corny = Math.min(cury + nGridH, 1);
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
            if (!this.gridVertexBuffer) {
                this.gridVertexBuffer = new Buffer_1["default"](this.main.getRctx());
            }
            this.gridVertexBuffer.setData(gridVertices);
        }
    };
    DynamicMovement.prototype.handleResize = function () {
        this.code.updateDimVars(this.main.getRctx().getGl());
    };
    DynamicMovement.componentName = "DynamicMovement";
    DynamicMovement.componentTag = "trans";
    DynamicMovement.optUpdateHandlers = {
        bFilter: "updateProgram",
        blend: "updateProgram",
        code: "updateCode",
        compat: "updateProgram",
        coord: "updateProgram",
        gridH: "updateGrid",
        gridW: "updateGrid",
        noGrid: [
            "updateProgram",
            "updateGrid",
        ]
    };
    DynamicMovement.defaultOptions = {
        bFilter: true,
        blend: false,
        code: {
            init: "",
            onBeat: "",
            perFrame: "",
            perPixel: ""
        },
        compat: false,
        coord: "POLAR",
        gridH: 16,
        gridW: 16,
        noGrid: false
    };
    return DynamicMovement;
}(Component_1["default"]));
exports["default"] = DynamicMovement;
function glslRectToPolar(coordMode) {
    if (coordMode === DynamicMovementCoordMode.POLAR) {
        return "\n            float ar = u_resolution.x/u_resolution.y;\n            x=x*ar;\n            d = distance(vec2(x, y), vec2(0,0))/sqrt(2.0);\n            r = mod(atan(y, x)+PI*0.5, 2.0*PI);\n        ";
    }
    else {
        return "";
    }
}
function glslPolarToRect(coordMode) {
    if (coordMode === DynamicMovementCoordMode.POLAR) {
        return "\n            d = d*sqrt(2.0);\n            x = d*sin(r)/ar;\n            y = -d*cos(r);\n        ";
    }
    else {
        return "";
    }
}
function glslFilter(bFilter, compat) {
    if (bFilter && !compat) {
        return "\n            vec3 filter(vec2 point) {\n               vec2 texel = 1.0/(u_resolution-vec2(1,1));\n               vec2 coord = (point+1.0)/2.0;\n               vec2 cornoff = fract(coord/texel);\n               vec2 corn = floor(coord/texel)*texel;\n\n               vec3 tl = getSrcColorAtPos(corn).rgb;\n               vec3 tr = getSrcColorAtPos(corn + vec2(texel.x, 0)).rgb;\n               vec3 bl = getSrcColorAtPos(corn + vec2(0, texel.y)).rgb;\n               vec3 br = getSrcColorAtPos(corn + texel).rgb;\n\n               vec3 pt = mix(tl, tr, cornoff.x);\n               vec3 pb = mix(bl, br, cornoff.x);\n               return mix(pt, pb, cornoff.y);\n            }\n        ";
    }
    else if (bFilter && compat) {
        return "\n            vec3 filter(vec2 point) {\n               vec2 texel = 1.0/(u_resolution-vec2(1,1));\n               vec2 coord = (point+1.0)/2.0;\n               vec2 corn = floor(coord/texel)*texel;\n\n               ivec2 cornoff = (ivec2(fract(coord/texel)*255.0));\n\n               ivec3 tl = ivec3(255.0 * getSrcColorAtPos(corn).rgb);\n               ivec3 tr = ivec3(255.0 * getSrcColorAtPos(corn + vec2(texel.x, 0)).rgb);\n               ivec3 bl = ivec3(255.0 * getSrcColorAtPos(corn + vec2(0, texel.y)).rgb);\n               ivec3 br = ivec3(255.0 * getSrcColorAtPos(corn + texel).rgb);\n\n               #define bt(i, j) int((float(i)/255.0)*float(j))\n\n               int a1 = bt(255-cornoff.x,255-cornoff.y);\n               int a2 = bt(cornoff.x    ,255-cornoff.y);\n               int a3 = bt(255-cornoff.x,cornoff.y);\n               int a4 = bt(cornoff.x    ,cornoff.y);\n               float r = float(bt(a1,tl.r) + bt(a2,tr.r) + bt(a3,bl.r) + bt(a4,br.r))/255.0;\n               float g = float(bt(a1,tl.g) + bt(a2,tr.g) + bt(a3,bl.g) + bt(a4,br.g))/255.0;\n               float b = float(bt(a1,tl.b) + bt(a2,tr.b) + bt(a3,bl.b) + bt(a4,br.b))/255.0;\n               return vec3(r,g,b);\n            }\n        ";
    }
    else {
        return "\n            vec3 filter(vec2 point) {\n               return getSrcColorAtPos((point+1.0)/2.0).rgb;\n            }\n        ";
    }
}


/***/ }),
/* 302 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Component_1 = __webpack_require__(2);
var utils_1 = __webpack_require__(0);
var ClearScreenProgram_1 = __webpack_require__(139);
// A component that slowly fades the screen to a specified color
var FadeOut = /** @class */ (function (_super) {
    __extends(FadeOut, _super);
    function FadeOut(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    FadeOut.prototype.init = function () {
        this.program = new ClearScreenProgram_1["default"](this.main.getRctx(), utils_1.BlendMode.AVERAGE);
        this.updateSpeed();
        this.updateColor();
    };
    FadeOut.prototype.draw = function () {
        this.frameCount++;
        if (this.frameCount === this.maxFrameCount) {
            this.frameCount = 0;
            this.program.run(this.parent.getTSM(), { color: this.color });
        }
    };
    FadeOut.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.program.destroy();
    };
    FadeOut.prototype.updateSpeed = function () {
        this.frameCount = 0;
        this.maxFrameCount = Math.floor(1 / this.opts.speed);
    };
    FadeOut.prototype.updateColor = function () {
        this.color = utils_1.parseColorNorm(this.opts.color);
    };
    FadeOut.componentName = "FadeOut";
    FadeOut.componentTag = "trans";
    FadeOut.optUpdateHandlers = {
        color: "updateColor",
        speed: "updateSpeed"
    };
    FadeOut.defaultOptions = {
        color: "#000000",
        speed: 1
    };
    return FadeOut;
}(Component_1["default"]));
exports["default"] = FadeOut;


/***/ }),
/* 303 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Component_1 = __webpack_require__(2);
var ShaderProgram_1 = __webpack_require__(3);
var Invert = /** @class */ (function (_super) {
    __extends(Invert, _super);
    function Invert(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    Invert.prototype.init = function () {
        this.program = new ShaderProgram_1["default"](this.main.getRctx(), {
            fragmentShader: "\n                void main() {\n                   setFragColor(vec4(1,1,1,1)-getSrcColor());\n                }\n            ",
            swapFrame: true
        });
    };
    Invert.prototype.draw = function () {
        this.program.run(this.parent.getTSM(), null);
    };
    Invert.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.program.destroy();
    };
    Invert.componentName = "Invert";
    Invert.componentTag = "trans";
    return Invert;
}(Component_1["default"]));
exports["default"] = Invert;


/***/ }),
/* 304 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Component_1 = __webpack_require__(2);
var utils_1 = __webpack_require__(0);
var ShaderProgram_1 = __webpack_require__(3);
// A component that mirror between quandrants
var Mirror = /** @class */ (function (_super) {
    __extends(Mirror, _super);
    function Mirror(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    Mirror.prototype._setMix = function (noTransition) {
        if (this.opts.smoothTransition && !noTransition) {
            // set mix vectors to second format if we are not already
            // in the middle of a transition
            if (this.animFrameCount === 0) {
                for (var i = 0; i < 4; i++) {
                    var quad = this.mix[i][0];
                    this.mix[i][0] = 0;
                    this.mix[i][quad] = 1;
                }
            }
            // calculate the mix delta values
            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    var endValue = (j === this.map[i]) ? 1 : 0;
                    this.mixDelta[i][j] = (endValue - this.mix[i][j]) / this.opts.transitionDuration;
                }
            }
            this.animFrameCount = this.opts.transitionDuration;
        }
        else {
            // set mix value to first format
            for (var i = 0; i < 4; i++) {
                this.mix[i][0] = this.map[i];
                for (var j = 1; j < 4; j++) {
                    this.mix[i][j] = 0;
                }
            }
        }
    };
    Mirror.prototype.init = function () {
        this.program = new ShaderProgram_1["default"](this.main.getRctx(), {
            bindings: {
                uniforms: {
                    mix0: { name: "u_mix0", valueType: utils_1.WebGLVarType._4FV },
                    mix1: { name: "u_mix1", valueType: utils_1.WebGLVarType._4FV },
                    mix2: { name: "u_mix2", valueType: utils_1.WebGLVarType._4FV },
                    mix3: { name: "u_mix3", valueType: utils_1.WebGLVarType._4FV },
                    transition: { name: "u_mode", valueType: utils_1.WebGLVarType._1I }
                }
            },
            fragmentShader: "\n                uniform int u_mode;\n                uniform vec4 u_mix0;\n                uniform vec4 u_mix1;\n                uniform vec4 u_mix2;\n                uniform vec4 u_mix3;\n\n                #define getQuadrant(pos) ( (pos.x<0.5) ? (pos.y<0.5?2:0) : (pos.y<0.5?3:1) )\n                #define check(a,b, c,d,e,f) ( ((a==c || a==d) && (b==e || b==f)) || ((a==e || a==f) && (b==c || b==d)) )\n                #define xFlip(qa, qb) (check(qa,qb, 0,2, 1,3)?-1:1)\n                #define yFlip(qa, qb) (check(qa,qb, 0,1, 2,3)?-1:1)\n                #define mirrorPos(pos,qa,qb) ((pos-vec2(0.5,0.5))*vec2(xFlip(qa,qb),yFlip(qa,qb))+vec2(0.5,0.5))\n                #define getMirrorColor(pos,qa,qb) (getSrcColorAtPos(mirrorPos(pos,qa,qb)))\n\n                void main() {\n                    int quadrant = getQuadrant(v_position);\n                    vec4 mix;\n                    if(quadrant == 0)      { mix = u_mix0; }\n                    else if(quadrant == 1) { mix = u_mix1; }\n                    else if(quadrant == 2) { mix = u_mix2; }\n                    else if(quadrant == 3) { mix = u_mix3; }\n                    if(u_mode == 0) {\n                        int otherQuadrant = int(mix.x);\n                        setFragColor(getMirrorColor(v_position, quadrant, otherQuadrant));\n                    } else {\n                        vec4 c0 = getMirrorColor(v_position, quadrant, 0);\n                        vec4 c1 = getMirrorColor(v_position, quadrant, 1);\n                        vec4 c2 = getMirrorColor(v_position, quadrant, 2);\n                        vec4 c3 = getMirrorColor(v_position, quadrant, 3);\n\n                        setFragColor(vec4(\n                            dot(vec4(c0.r,c1.r,c2.r,c3.r), mix),\n                            dot(vec4(c0.g,c1.g,c2.g,c3.g), mix),\n                            dot(vec4(c0.b,c1.b,c2.b,c3.b), mix),\n                            1.0\n                        ));\n                    }\n                }\n            ",
            swapFrame: true
        });
        this.animFrameCount = 0;
        this.mix = [
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [2, 0, 0, 0],
            [3, 0, 0, 0],
        ];
        this.mixDelta = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ];
        this.updateMap();
    };
    Mirror.prototype.draw = function () {
        if (this.opts.onBeatRandom && this.main.getAnalyser().isBeat()) {
            this._setQuadrantMap(true);
        }
        this.program.run(this.parent.getTSM(), {
            mix0: this.mix[0],
            mix1: this.mix[1],
            mix2: this.mix[2],
            mix3: this.mix[3],
            transition: this._inTransition() ? 1 : 0
        });
        if (this._inTransition()) {
            this.animFrameCount--;
            if (this.animFrameCount === 0) {
                this._setMix(true);
            }
            else {
                for (var i = 0; i < 4; i++) {
                    for (var j = 0; j < 4; j++) {
                        this.mix[i][j] += this.mixDelta[i][j];
                    }
                }
            }
        }
    };
    Mirror.prototype.updateMap = function () {
        this._setQuadrantMap();
    };
    Mirror.prototype._inTransition = function () {
        return (this.opts.smoothTransition && this.animFrameCount !== 0);
    };
    Mirror.prototype._setQuadrantMap = function (random) {
        if (random === void 0) { random = false; }
        var map = [0, 1, 2, 3];
        var mirrorDirs = this.opts;
        if (random) {
            var randVal = Math.floor(Math.random() * 16);
            mirrorDirs = {
                bottomToTop: (randVal & 2) && this.opts.bottomToTop,
                leftToRight: (randVal & 4) && this.opts.leftToRight,
                rightToLeft: (randVal & 8) && this.opts.rightToLeft,
                topToBottom: (randVal & 1) && this.opts.topToBottom
            };
        }
        if (mirrorDirs.topToBottom) {
            map[2] = map[0];
            map[3] = map[1];
        }
        if (mirrorDirs.bottomToTop) {
            map[0] = map[2];
            map[1] = map[3];
        }
        if (mirrorDirs.leftToRight) {
            map[1] = map[0];
            map[3] = map[2];
        }
        if (mirrorDirs.rightToLeft) {
            map[0] = map[1];
            map[2] = map[3];
        }
        this.map = map;
        this._setMix(false);
    };
    Mirror.componentName = "Mirror";
    Mirror.componentTag = "trans";
    Mirror.optUpdateHandlers = {
        bottomToTop: "updateMap",
        leftToRight: "updateMap",
        rightToLeft: "updateMap",
        topToBottom: "updateMap"
    };
    Mirror.defaultOptions = {
        bottomToTop: false,
        leftToRight: false,
        onBeatRandom: false,
        rightToLeft: false,
        smoothTransition: false,
        topToBottom: true,
        transitionDuration: 4
    };
    return Mirror;
}(Component_1["default"]));
exports["default"] = Mirror;


/***/ }),
/* 305 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Component_1 = __webpack_require__(2);
var utils_1 = __webpack_require__(0);
var ShaderProgram_1 = __webpack_require__(3);
var Mosaic = /** @class */ (function (_super) {
    __extends(Mosaic, _super);
    function Mosaic(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    Mosaic.prototype.init = function () {
        this.frameCount = 0;
        this.size = this.opts.squareSize;
        this.updateProgram();
    };
    Mosaic.prototype.draw = function () {
        var gl = this.main.getRctx().getGl();
        if (this.opts.onBeatSizeChange && this.main.getAnalyser().isBeat()) {
            this.size = this.opts.onBeatSquareSize;
            this.frameCount = this.opts.onBeatSizeDuration;
        }
        if (this.size !== 0) {
            var sizeX = 1 / Math.floor(this.size * (gl.drawingBufferWidth - 1) + 1);
            var sizeY = 1 / Math.floor(this.size * (gl.drawingBufferHeight - 1) + 1);
            this.program.run(this.parent.getTSM(), { size: [sizeX, sizeY] });
        }
        if (this.frameCount > 0) {
            this.frameCount--;
            if (this.frameCount === 0) {
                this.size = this.opts.squareSize;
            }
            else {
                var incr = Math.abs(this.opts.squareSize - this.opts.onBeatSquareSize) /
                    this.opts.onBeatSizeDuration;
                this.size += incr * (this.opts.onBeatSquareSize > this.opts.squareSize ? -1 : 1);
            }
        }
    };
    Mosaic.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.program.destroy();
    };
    Mosaic.prototype.updateProgram = function () {
        var blendMode = utils_1.BlendMode[this.opts.blendMode];
        var program = new ShaderProgram_1["default"](this.main.getRctx(), {
            bindings: {
                uniforms: {
                    size: { name: "u_size", valueType: utils_1.WebGLVarType._2FV }
                }
            },
            blendMode: blendMode,
            fragmentShader: "\n                uniform vec2 u_size;\n                void main() {\n                    vec2 samplePos = u_size * ( floor(v_position/u_size) + vec2(0.5,0.5) );\n                    setFragColor(getSrcColorAtPos(samplePos));\n                }\n            ",
            swapFrame: true
        });
        if (this.program) {
            this.program.destroy();
        }
        this.program = program;
    };
    Mosaic.componentName = "Mosaic";
    Mosaic.componentTag = "trans";
    Mosaic.defaultOptions = {
        blendMode: "REPLACE",
        onBeatSizeChange: false,
        onBeatSizeDuration: 10,
        onBeatSquareSize: 1,
        squareSize: 0.5
    };
    Mosaic.optUpdateHandlers = {
        blendMode: "updateProgram"
    };
    return Mosaic;
}(Component_1["default"]));
exports["default"] = Mosaic;


/***/ }),
/* 306 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Component_1 = __webpack_require__(2);
var utils_1 = __webpack_require__(0);
var ShaderProgram_1 = __webpack_require__(3);
// A Component that applies a unique color tone
var UniqueTone = /** @class */ (function (_super) {
    __extends(UniqueTone, _super);
    function UniqueTone(main, parent, opts) {
        return _super.call(this, main, parent, opts) || this;
    }
    UniqueTone.prototype.init = function () {
        this.updateColor();
        this.updateProgram();
    };
    UniqueTone.prototype.draw = function () {
        this.program.run(this.parent.getTSM(), {
            invert: this.opts.invert ? 1 : 0,
            tone: this.tone
        });
    };
    UniqueTone.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.program.destroy();
    };
    UniqueTone.prototype.updateColor = function () {
        this.tone = utils_1.parseColorNorm(this.opts.color);
    };
    UniqueTone.prototype.updateProgram = function () {
        var blendMode = utils_1.BlendMode[this.opts.blendMode];
        var program = new ShaderProgram_1["default"](this.main.getRctx(), {
            bindings: {
                uniforms: {
                    invert: { name: "u_invert", valueType: utils_1.WebGLVarType._1F },
                    tone: { name: "u_tone", valueType: utils_1.WebGLVarType._3FV }
                }
            },
            blendMode: blendMode,
            fragmentShader: "\n                uniform vec3 u_tone;\n                uniform bool u_invert;\n                void main() {\n                   vec4 srcColor = getSrcColor();\n                   float depth = max(srcColor.r, max(srcColor.g, srcColor.b));\n                   if(u_invert) {\n                       depth = 1.0-depth;\n                   }\n                   setFragColor(vec4(depth*u_tone, 1));\n                }\n            ",
            swapFrame: true
        });
        if (this.program) {
            this.program.destroy();
        }
        this.program = program;
    };
    UniqueTone.componentName = "UniqueTone";
    UniqueTone.componentTag = "trans";
    UniqueTone.defaultOptions = {
        blendMode: "REPLACE",
        color: "#ffffff",
        invert: false
    };
    UniqueTone.optUpdateHandlers = {
        blendMode: "updateProgram",
        color: "updateColor"
    };
    return UniqueTone;
}(Component_1["default"]));
exports["default"] = UniqueTone;


/***/ }),
/* 307 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var utils_1 = __webpack_require__(0);
var ShaderProgram_1 = __webpack_require__(3);
/**
 * A Shader that copies given texture onto current buffer
 */
var CopyProgram = /** @class */ (function (_super) {
    __extends(CopyProgram, _super);
    /**
     * Creates new ClearScreenProgram
     * @param rctx the rendering context in which to create this shader
     * @param dynamicBlend enable or disable dynamicBlend
     */
    function CopyProgram(rctx, dynamicBlend) {
        if (dynamicBlend === void 0) { dynamicBlend = false; }
        return _super.call(this, rctx, {
            bindings: {
                uniforms: {
                    srcTexture: { name: "u_copySource", valueType: utils_1.WebGLVarType.TEXTURE2D }
                }
            },
            dynamicBlend: dynamicBlend,
            fragmentShader: "\n                uniform sampler2D u_copySource;\n                void main() {\n                setFragColor(texture2D(u_copySource, v_position));\n                }\n            "
        }) || this;
    }
    return CopyProgram;
}(ShaderProgram_1["default"]));
exports["default"] = CopyProgram;


/***/ }),
/* 308 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
/**
 * Rendering Context wraps WebGLRenderingContext and
 * a cache for shared Buffers.
 */
var RenderingContext = /** @class */ (function () {
    /**
     * Creates a new RenderingContext
     * @param gl the WebGLRenderingContext to be used
     */
    function RenderingContext(gl) {
        this.gl = gl;
        this.buffers = {};
    }
    /**
     * Returns the WebGLRenderingContext
     */
    RenderingContext.prototype.getGl = function () {
        return this.gl;
    };
    /**
     * Caches given buffer in this context
     * @param name cache key for the buffer
     * @param buffer the buffer to be cached
     */
    RenderingContext.prototype.cacheBuffer = function (name, buffer) {
        this.buffers[name] = buffer;
    };
    /**
     * Returns a buffer that was previously cached with a
     * [[RenderingContext.cacheBuffer]] call
     * @param name cache key
     */
    RenderingContext.prototype.getBuffer = function (name) {
        return this.buffers[name];
    };
    return RenderingContext;
}());
exports["default"] = RenderingContext;


/***/ }),
/* 309 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var defaults_1 = __webpack_require__(24);
var utils_1 = __webpack_require__(0);
var AnalyserAdapter_1 = __webpack_require__(140);
/**
 * WebAudioAnalyser is an AnalyserAdapter that supports `audio` tag sources
 */
var WebAudioAnalyser = /** @class */ (function (_super) {
    __extends(WebAudioAnalyser, _super);
    /**
     * Initializes a WebAudioAnalyser
     * @param options options for analyser
     */
    function WebAudioAnalyser(options) {
        var _this = _super.call(this) || this;
        _this.movingThreshold = 0;
        options = defaults_1["default"](options || {}, {
            decay: 0.02,
            fftSize: 512,
            threshold: 0.125
        });
        if (options.context) {
            _this.context = options.context;
        }
        else if (window.webkitAudioContext) {
            _this.context = new window.webkitAudioContext();
        }
        else if (window.AudioContext) {
            _this.context = new window.AudioContext();
        }
        else {
            throw new Error("Cannot create webaudio context");
        }
        _this.fftSize = options.fftSize;
        _this.threshold = options.threshold;
        _this.decay = options.decay;
        _this.visData = [null, null, null];
        for (var ch = 0; ch < 3; ch++) {
            var spectrum = new Float32Array(_this.fftSize / 2);
            var waveform = new Float32Array(_this.fftSize);
            _this.visData[ch] = { spectrum: spectrum, waveform: waveform };
        }
        return _this;
    }
    /**
     * Connect this analyser to any WebAudio Node
     * @param sourceNode node which will be used as audio source
     */
    WebAudioAnalyser.prototype.connectToNode = function (sourceNode) {
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
        this.analysers = [null, null];
        for (var ch = 0; ch < 2; ch++) {
            var analyser = this.context.createAnalyser();
            analyser.fftSize = this.fftSize;
            this.channelSplit.connect(analyser, ch);
            this.analysers[ch] = analyser;
        }
    };
    // Called every frame. Override and implement analyser code
    WebAudioAnalyser.prototype.update = function () {
        if (!this.analysers) {
            return; // analysers not ready. nothing update
        }
        var byteBuffer = new Uint8Array(this.fftSize);
        for (var ch = 0; ch < 2; ch++) {
            var visData = this.visData[ch + 1];
            var analyser = this.analysers[ch];
            analyser.getByteFrequencyData(byteBuffer);
            for (var i = 0; i < visData.spectrum.length; i++) {
                visData.spectrum[i] = byteBuffer[i] / 255;
            }
            analyser.getByteTimeDomainData(byteBuffer);
            for (var i = 0; i < visData.waveform.length; i++) {
                visData.waveform[i] = (byteBuffer[i] / 255) * 2 - 1;
            }
        }
        // center channel is average of left and right
        var centerVisData = this.visData[0];
        for (var i = 0; i < centerVisData.spectrum.length; i++) {
            centerVisData.spectrum[i] = (this.visData[1].spectrum[i] / 2 + this.visData[2].spectrum[i] / 2);
        }
        for (var i = 0; i < centerVisData.waveform.length; i++) {
            centerVisData.waveform[i] = (this.visData[1].waveform[i] / 2 + this.visData[2].waveform[i] / 2);
        }
        // Simple kick detection
        this.beat = false;
        var peakLeft = 0;
        var peakRight = 0;
        for (var i = 0; i < this.fftSize; i++) {
            peakLeft += Math.abs(this.visData[1].waveform[i]);
            peakRight += Math.abs(this.visData[2].waveform[i]);
        }
        var peak = Math.max(peakLeft, peakRight) / this.fftSize;
        if (peak >= this.movingThreshold && peak >= this.threshold) {
            this.movingThreshold = peak;
            this.beat = true;
        }
        else {
            this.movingThreshold = this.movingThreshold * (1 - this.decay) + peak * this.decay;
        }
    };
    /**
     * Helper for Webvs.WebAudioAnalyser#connectToNode. This creates Audio object
     * for the audio file and connects this analyser to its mediaElementSource
     * @param source source for the audio. Use an audio tag element or a url
     * @param readyFunc a callback that'll be called when ready to play
     */
    WebAudioAnalyser.prototype.load = function (source, readyFunc) {
        var _this = this;
        var element;
        if (source instanceof HTMLMediaElement) {
            element = source;
            this.source = this.context.createMediaElementSource(element);
        }
        else {
            element = new Audio();
            element.src = source;
            this.source = this.context.createMediaElementSource(element);
        }
        var onCanPlay = function () {
            _this.connectToNode(_this.source);
            _this.source.connect(_this.context.destination);
            if (readyFunc) {
                readyFunc(element);
            }
            element.removeEventListener("canplay", onCanPlay);
        };
        if (element.readyState < 3) {
            element.addEventListener("canplay", onCanPlay);
        }
        else {
            onCanPlay();
        }
        return element;
    };
    // Returns array of waveform values
    WebAudioAnalyser.prototype.getWaveform = function (channel) {
        if (channel === void 0) { channel = utils_1.Channels.CENTER; }
        return this.visData[channel].waveform;
    };
    // Returns array of spectrum values
    WebAudioAnalyser.prototype.getSpectrum = function (channel) {
        if (channel === void 0) { channel = utils_1.Channels.CENTER; }
        return this.visData[channel].spectrum;
    };
    // boolean value indicating whether a beat
    // is in progress or not
    WebAudioAnalyser.prototype.isBeat = function () {
        return this.beat;
    };
    return WebAudioAnalyser;
}(AnalyserAdapter_1["default"]));
exports["default"] = WebAudioAnalyser;


/***/ })
/******/ ]);