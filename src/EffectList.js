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
    this._inited = false;

    var codeGen = new Webvs.ExprCodeGenerator(options.code, ["beat", "enabled", "clear", "w", "h", "cid"]);
    var genResult = codeGen.generateCode(["init", "perFrame"], [], []);
    this.code = genResult[0];

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

        this.code.setup(main, this);

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

        this.code.beat = this.main.analyser.beat;
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
            this.components[i].destroy();
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
