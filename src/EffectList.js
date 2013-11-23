/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * Effectlist is a container that renders components to a separate buffer. and blends
 * it in with the parent buffer. Its also used as the root component in Webvs.Main
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
function EffectList(gl, main, parent, opts) {
    EffectList.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.EffectList = Webvs.defineClass(EffectList, Webvs.Container, {
    defaultOptions: _.extend({
        code: {
            init: "",
            perFrame: ""
        },
        output: "REPLACE",
        input: "IGNORE",
        clearFrame: false,
        enableOnBeat: false,
        enableOnBeatFor: 1
    }, Webvs.Container.prototype.defaultOptions),

    onChange: {
        code: "updateCode",
        output: "updateBlendMode",
        input: "updateBlendMode"
    },

    init: function() {
        EffectList.super.init.call(this);
        this.fm = new Webvs.FrameBufferManager(this.main.canvas.width, this.main.canvas.height,
                                               this.gl, this.main.copier, this.parent?true:false);
        this.updateCode();
        this.updateBlendMode(this.opts.input, "input");
        this.updateBlendMode(this.opts.output, "output");
        this.frameCounter = 0;
        this.first = true;
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
        if(this.input !== -1) {
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
        if(this.output != -1) {
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
        var codeGen = new Webvs.ExprCodeGenerator(this.opts.code, ["beat", "enabled", "clear", "w", "h", "cid"]);
        this.code = codeGen.generateJs(["init", "perFrame"]);
        this.code.setup(this.main, this);
        this.inited = false;
    },

    updateBlendMode: function(value, name) {
        this[name] = (value=="IGNORE")?-1:Webvs.getBlendMode(value);
    }
});

})(Webvs);
