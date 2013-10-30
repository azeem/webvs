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
    },

    /**
     * Searches through the tree and returns the component
     * with given id
     * @memberof Webvs.Main
     * @param {string} id - id to be searched for
     * @returns {Webvs.Component} the component if found, undefined otherwise
     */
    getComponent: function(id, component) {
        component = component || this.rootComponent;
        if(id == component.id) {
            return component;
        }
        var children = component.components;
        for(var i = 0;i < children.length;i++) {
            var child = children[i];
            if(child.id == id) {
                return child;
            }
            if(child instanceof Webvs.Container) {
                // search through sub containers also
                child = this.getComponent(id, child);
                if(child) {
                    return child;
                }
            }
        }
    },

    /**
     * Adds a new component in the tree under a given parent
     * @memberof Webvs.Main
     * @param {object} options - options object for initializing the new component
     * @parent {string} parentId - id of the parent under which the new component
     *                             will be inserted
     */
    addComponent: function(options, parentId) {
        var parent = this.getComponent(parentId);
        if(parent) {
            parent.addComponent(options);
        }
    },

    /**
     * Moves a component from one parent to another
     * @memberof Webvs.Main
     * @param {string} componentId - id of component to be moved
     * @param {string} newParentId - id of the new parent
     * @param {number} pos - the position component under the new parent
     */
    moveComponent: function(componentId, newParentId, pos) {
        var component = this.getComponent(componentId);
        var newParent = this.getComponent(newParentId);
        if(component && newParent) {
            component.parent.detachComponent(component.id);
            newParent.addComponent(component, pos);
            component.move(newParent);
        }
    },

    /**
     * Removes a component and cleans up all resources
     * @memberof Webvs.Main
     * @param {string} componentId - id of the component to be removed
     */
    removeComponent: function(componentId) {
        var component = this.getComponent(componentId);
        if(component) {
            component.parent.detachComponent(component.id);
            component.destroy();
        }
    },

    /**
     * Updates a component with new set of options
     * @memberof Webvs.Main
     * @oaram {string} componentId - id of the component to be updated
     * @param {object} options - updated options object
     */
    updateComponent: function(componentId, options) {
        if(componentId == this.rootComponent.id) {
            // since root component does not have a parent
            // we have to manually create new root and move
            // all its children
            var children = this.rootComponent.detachAllComponents();
            options = _.clone(options);
            options.id = componentId;
            options.components = undefined;

            var newRoot = new EffectList(options);
            _.each(children, function(component) {
                newRoot.addComponent(component);
                component.move(newRoot);
            });
            this.rootComponent.destroy();
            this.rootComponent = newRoot;
        } else {
            var component = this.getComponent(componentId);
            if(component) {
                var parent = component.parent;
                parent.updateComponent(component.id, options);
            }
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




