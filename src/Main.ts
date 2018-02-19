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
import Buffer from './webgl/Buffer';
import CopyProgram from './webgl/CopyProgram';
import FrameBufferManager from './webgl/FrameBufferManager';
import EffectList from './EffectList';
import { IComponent } from './componentInterfaces';
import IMain from './IMain';
import RenderingContext from './webgl/RenderingContext';

// Main Webvs object, that represents a running webvs instance.
export default class Main extends Model implements IMain {
    private canvas: HTMLCanvasElement;
    private msgElement: HTMLElement;
    public analyser: AnalyserAdapter;
    private isStarted: boolean;
    private stats: Stats;
    private meta: any;
    public rsrcMan: ResourceManager;
    public rctx: RenderingContext;
    public copier: CopyProgram;
    private fm: FrameBufferManager;
    private registerBank: {[key: string]: number};
    private bootTime: number;
    private rootComponent: IComponent;
    private animReqId: number;
    private buffers: {[name: string]: Buffer};

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
            this.rctx = new RenderingContext(this.canvas.getContext("webgl", {alpha: false}));
            this.copier = new CopyProgram(this.rctx, {dynamicBlend: true});
            this.fm = new FrameBufferManager(this.rctx, this.copier, true, 0);
        } catch(e) {
            throw new Error("Couldnt get webgl context" + e);
        }
    }

    private _setupRoot(preset: any) {
        this.registerBank = {};
        this.bootTime = (new Date()).getTime();
        this.rootComponent = new EffectList(this, null, preset);
    }

    private _startAnimation() {
        let drawFrame = () => {
            this.analyser.update();
            this.rootComponent.draw();
            this.animReqId = window.requestAnimationFrame(drawFrame);
        };

        // Wrap drawframe in stats collection if required
        if(this.stats) {
            const oldDrawFrame = drawFrame;
            drawFrame = () => {
                this.stats.begin();
                oldDrawFrame.call(this, arguments);
                this.stats.end();
            };
        }
        this.animReqId = requestAnimationFrame(drawFrame);
    }

    private _stopAnimation() {
        window.cancelAnimationFrame(this.animReqId);
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
    loadPreset(preset: any) {
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
        const preset = this.rootComponent.toJSON();
        this.rootComponent.destroy();
        this.fm.destroy();
        this._initGl();
        this._setupRoot(preset);
    }

    notifyResize() {
        const gl = this.rctx.gl;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        this.fm.resize();
        this.emit("resize", gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    cacheBuffer(name: string, buffer: Buffer) {
        this.buffers[name] = buffer;
    }

    getBuffer(name: string): Buffer {
        return this.buffers[name];
    }

    setAttribute(key: string, value: any, options: any) {
        if(key == "meta") {
            this.meta = value;
            return true;
        }
        return false;
    }

    get(key: string) {
        if(key == "meta") {
            return this.meta;
        }
    }

    // Generates and returns the instantaneous preset JSON 
    // representation
    toJSON(): any {
        let preset = this.rootComponent.toJSON();
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
            const statsDomElement = this.stats.domElement;
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