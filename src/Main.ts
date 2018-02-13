/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

import {checkRequiredOptions} from './utils';
import AnalyserAdapter from './analyser/AnalyserAdapter';
import Model from './Model';
import Stats from 'stats.js';
import _ from 'lodash';
import ResourcePack from './ResourcePack';
import ResourceManager from './ResourceManager';
import CopyProgram from './webgl/CopyProgram';
import FrameBufferManager from './webgl/FrameBufferManager';

// Main Webvs object, that represents a running webvs instance.
class Main extends Model {
    private canvas: HTMLCanvasElement;
    private msgElement: HTMLElement;
    private analyser: AnalyserAdapter;
    private isStarted: boolean;
    private stats: Stats;
    private meta: any;
    private rsrcMan: ResourceManager;
    private gl: WebGLRenderingContext;
    private copier: CopyProgram;
    private buffers: FrameBufferManager;

    constructor(options) {
        super();
        checkRequiredOptions(options, ["canvas", "analyser"]);
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

    private _initResourceManager(prefix: string): void {
        let builtinPack = ResourcePack;
        if(prefix) {
            builtinPack = _.clone(builtinPack);
            builtinPack.prefix = prefix;
        }
        this.rsrcMan = new ResourceManager(builtinPack);
        this.listenTo(this.rsrcMan, "wait", this.handleRsrcWait);
        this.listenTo(this.rsrcMan, "ready", this.handleRsrcReady);
    }

    private _registerContextEvents() {
        this.canvas.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            this.stop();
        });

        this.canvas.addEventListener("webglcontextrestored", (event) => {
            this.resetCanvas();
        });
    }

    private _initGl() {
        try {
            this.gl = this.canvas.getContext("webgl", {alpha: false});
            this.copier = new CopyProgram(this.gl, {dynamicBlend: true});
            this.buffers = new FrameBufferManager(this.gl, this.copier, true, 0);
        } catch(e) {
            throw new Error("Couldnt get webgl context" + e);
        }
    }

    _setupRoot(preset) {
        this.registerBank = {};
        this.bootTime = (new Date()).getTime();
        this.rootComponent = new Webvs.EffectList(this.gl, this, null, preset);
    }

    _startAnimation() {
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
    }

    _stopAnimation() {
        cancelAnimationFrame(this.animReqId);
    }

    // Starts the animation if not already started
    start() {
        if(this.isStarted) {
            return;
        }
        this.isStarted = true;
        if(this.rsrcMan.ready) {
            this._startAnimation();
        }
    }

    // Stops the animation
    stop() {
        if(!this.isStarted) {
            return;
        }
        this.isStarted = false;
        if(this.rsrcMan.ready) {
            this._stopAnimation();
        }
    }

    // Loads a preset JSON. If a preset is already loaded and running, then
    // the animation is stopped, and the new preset is loaded.
    loadPreset(preset) {
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
    }

    // Reset all the components.
    resetCanvas() {
        var preset = this.rootComponent.generateOptionsObj();
        this.rootComponent.destroy();
        this.copier.cleanup();
        this.buffers.destroy();
        this._initGl();
        this._setupRoot(preset);
    }

    notifyResize() {
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.buffers.resize();
        this.trigger("resize", this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    }

    setAttribute(key, value, options) {
        if(key == "meta") {
            this.meta = value;
            return true;
        }
        return false;
    }

    get(key, value) {
        if(key == "meta") {
            return this.meta;
        }
    }

    // Generates and returns the instantaneous preset JSON 
    // representation
    toJSON() {
        var preset = this.rootComponent.toJSON();
        preset = _.pick(preset, "clearFrame", "components");
        preset.resources = this.rsrcMan.toJSON();
        preset.meta = _.clone(this.meta);
        return preset;
    }

    destroy() {
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
    }

    // event handlers
    handleRsrcWait() {
        if(this.isStarted) {
            this._stopAnimation();
        }
    }
    
    handleRsrcReady() {
        if(this.isStarted) {
            this._startAnimation();
        }
    }
}

})(Webvs);




