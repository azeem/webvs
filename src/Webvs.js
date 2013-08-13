/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(window) {

/**
 * Main Webvs class
 * @param options
 * @constructor
 */
function Webvs(options) {
    checkRequiredOptions(options, ["canvas", "analyser"]);
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
window.Webvs = Webvs;
_.extend(Webvs.prototype, {
    _initGl: function() {
        try {
            this.gl = this.canvas.getContext("experimental-webgl", {alpha: false});
            this.resolution = {
                width: this.canvas.width,
                height: this.canvas.height
            };
        } catch(e) {
            throw new Error("Couldnt get webgl context" + e);
        }
    },

    /**
     * Loads a preset JSON
     * @param preset JSON representation of the preset
     */
    loadPreset: function(preset) {
        var newRoot = new EffectList(preset);
        this.stop();
        this.preset = preset;
        if(this.rootComponent) {
            this.rootComponent.destroyComponent();
        }
        this.rootComponent = newRoot;
    },

    /**
     * Reset all the components, call this when canvas
     * dimensions changes
     */
    resetCanvas: function() {
        this.stop();
        if(this.rootComponent) {
            this.rootComponent.destroyComponent();
            this.rootComponent = null;
        }
        this._initGl();
        if(this.preset) {
            this.rootComponent = new EffectList(this.preset);
        }
    },

    /**
     * Starts the animation
     */
    start: function() {
        if(!this.rootComponent) {
            return; // no preset loaded yet. cannot start!
        }

        this.registerBank = {};
        var rootComponent = this.rootComponent;
        var bootTime = (new Date()).getTime();
        var promise = rootComponent.initComponent(this.gl, this.resolution, this.analyser, this.registerBank, bootTime);

        var _this = this;
        var drawFrame = function() {
            if(_this.analyser.isPlaying()) {
                rootComponent.updateComponent();
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

        // start rendering when the promise is  done
        promise.then(function() {
            _this.animReqId = requestAnimationFrame(drawFrame);
        });
    },

    /**
     * Stops the animation
     */
    stop: function() {
        if(typeof this.animReqId !== "undefined") {
            cancelAnimationFrame(this.animReqId);
        }
    }
});

Webvs.ui = {
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
    form: [
        "clearFrame",
        "name",
        "author",
        { key: "description", type: "textarea" }
    ]
};

})(window);



// Webvs constants
var blendModes = {
    REPLACE: 1,
    MAXIMUM: 2,
    AVERAGE: 3,
    ADDITIVE: 4,
    SUBTRACTIVE1: 5,
    SUBTRACTIVE2: 6
};

function setBlendMode(gl, mode) {
    switch(mode) {
        case blendModes.ADDITIVE:
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.blendEquation(gl.FUNC_ADD);
            break;
        case blendModes.SUBTRACTIVE1:
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
            break;
        case blendModes.SUBTRACTIVE2:
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.blendEquation(gl.FUNC_SUBTRACT);
            break;
        case blendModes.AVERAGE:
            gl.blendColor(0.5, 0.5, 0.5, 1);
            gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);
            gl.blendEquation(gl.FUNC_ADD);
            break;
        default: throw new Error("Invalid blend mode");
    }
}
