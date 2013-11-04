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

        var rootComponent = this.rootComponent;

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

        if(rootComponent.componentInited) {
            this.animReqId = requestAnimationFrame(drawFrame);
        } else {
            this.registerBank = {};
            this.bootTime = (new Date()).getTime();
            var promise = rootComponent.init(this.gl, this);

            // start rendering when the promise is  done
            promise.onResolve(function() {
                that.animReqId = requestAnimationFrame(drawFrame);
            });
        }
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
        this.stop();
        options = _.clone(options); // use our own copy
        var res = this.rootComponent.addComponent(parentId, options, pos);
        if(res) {
            var _this = this;
            res[1].onResolve(function() {
                _this.start();
            });
            return res[0];
        }
    },

    /**
     * Updates a component.
     * @param {string} id - id of the component
     * @param {object} options - options to be updated.
     * @returns {boolean} - success of the operation
     * @memberof Webvs.Main#
     */
    updateComponent: function(id, options) {
        this.stop();
        var _this = this;
        options = _.clone(options); // use our own copy
        if(id != "root") {
            var promise = this.rootComponent.updateComponent();
            if(promise) {
                promises.onResolve(function() {
                    _this.start();
                });
                return true;
            }
        } else {
            var factories = this.rootComponent.detachAllComponents();
            var preset = this.rootComponent.preset;
            this.rootComponent.destroy();
            this.rootComponent = new EffectList(preset, factories);
            _.each(factories, function(factory) {
                factory.destroyPool();
            });
            _this.start();
            return true;
        }
        return false;
    },


    /**
     * Removes a component
     * @param {string} id - id of the component to be removed
     * @returns {boolean} - success of the operation
     * @memberof Webvs.Main#
     */
    removeComponent: function(id) {
        var factory = this.rootComponent.detachComponent(id);
        if(factory) {
            factory.destroyPool();
            return true;
        }
        return false;
    },

    /**
     * Moves a component to a different parent
     * @param {string} id - id of the component to be moved
     * @param {string} newParentId - id of the new parent
     * @returns {boolean} - success of the operation
     * @memberof Webvs.Main#
     */
    moveComponent: function(id, newParentId) {
        var factory = this.rootComponent.detachComponent(id);
        if(factory) {
            var res = this.rootComponent.addComponent(newParentId, factory);
            factory.destroyPool();
            if(res) {
                return true;
            }
        }
        return false;
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




