/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

/**
 * Special component that copies texture to target.
 * Also blends in additional texture if provided
 * @constructor
 */
function Copy(blendMode) {
    var fragmentSrc = [
        "precision mediump float;",
        "void main() {",
        "   setFragColor(getSrcColor());",
        "}"
    ].join("\n");
    Copy.super.constructor.call(this, fragmentSrc, blendMode);
}
extend(Copy, Trans, {componentName: "Copy"});

/**
 * EffectList component. Effectlist
 * is the core component that doesnt lot of the rendering
 * work
 * @param options
 * @constructor
 */
function EffectList(options) {
    checkRequiredOptions(options, ["components"]);

    this._constructComponent(options.components);
    this.output = options.output?blendModes[options.output]:blendModes.REPLACE;
    this.clearFrame = options.clearFrame?options.clearFrame:false;
    this.first = true;

    EffectList.super.constructor.call(this);
}
extend(EffectList, Component, {
    componentName: "EffectList",

    swapFrame: true,

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
            _.times(cloneCount, function() {
                var component = new Webvs[type](componentOptions);
                component.id = i;
                component.parent = that;
                components.push(component);
            });
        });
        this.components = components;
    },

    initComponent: function(gl, resolution, analyser, registerBank, bootTime) {
        EffectList.super.initComponent.apply(this, arguments);
        this._initFrameBuffer();

        var components = this.components;
        var outCopyComponent = new Copy(this.output);
        var copyComponent = new Copy();

        // initialize all the components
        var initPromises = [];
        for(var i = 0;i < components.length;i++) {
            var res = components[i].initComponent.apply(components[i], arguments);
            if(res) {
                initPromises.push(res);
            }
        }
        outCopyComponent.initComponent.apply(outCopyComponent, arguments);
        copyComponent.initComponent.apply(copyComponent, arguments);

        this.copyComponent = copyComponent;
        this.outCopyComponent = outCopyComponent;
        return D.all(initPromises);
    },

    updateComponent: function(inputTexture) {
        EffectList.super.updateComponent.call(this, inputTexture);
        var gl = this.gl;

        // save the current framebuffer
        var targetFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

        // switch to internal framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.resolution.width, this.resolution.height);
        this._setFBAttachment();

        if(this.clearFrame || this.first) {
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            this.first = false;
        }

        // render all the components
        var components = this.components;
        for(var i = 0;i < components.length;i++) {
            var component = components[i];
            if(component.swapFrame) {
                var oldTexture = this._getCurrentTextrue();
                this._swapFBAttachment();
                if(component.copyOnSwap) {
                    this.copyComponent.updateComponent(oldTexture);
                }
                component.updateComponent(oldTexture);
            } else {
                component.updateComponent();
            }
        }

        // switch to old framebuffer and copy the data
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFrameBuffer);
        gl.viewport(0, 0, this.resolution.width, this.resolution.height);
        assert(inputTexture || this.output == blendModes.REPLACE, "Cannot blend");
        this.outCopyComponent.updateComponent(this._getCurrentTextrue());
    },

    destroyComponent: function() {
        EffectList.super.destroyComponent.call(this);
        var gl = this.gl;
        var i;

        // destory all the sub-components
        for(i = 0;i < this.components.length;i++) {
            this.components[i].destroyComponent();
        }
        this.copyComponent.destroyComponent();

        // delete the framebuffer
        for(i = 0;i < 2;i++) {
            gl.deleteRenderbuffer(this.frameAttachments[i].renderbuffer);
            gl.deleteTexture(this.frameAttachments[i].texture);
        }
        gl.deleteFramebuffer(this.framebuffer);
    },

    _initFrameBuffer: function() {
        var gl = this.gl;

        var framebuffer = gl.createFramebuffer();
        var attachments = [];
        for(var i = 0;i < 2;i++) {
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.resolution.width, this.resolution.height,
                0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            var renderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.resolution.width, this.resolution.height);

            attachments[i] = {
                texture: texture,
                renderbuffer: renderbuffer
            };
        }

        this.framebuffer = framebuffer;
        this.frameAttachments = attachments;
        this.currAttachment = 0;
    },

    _setFBAttachment: function() {
        var attachment = this.frameAttachments[this.currAttachment];
        var gl = this.gl;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, attachment.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, attachment.renderbuffer);
    },

    _getCurrentTextrue: function() {
        return this.frameAttachments[this.currAttachment].texture;
    },

    _swapFBAttachment: function() {
        this.currAttachment = (this.currAttachment + 1) % 2;
        this._setFBAttachment();
    },
});

window.Webvs.EffectList = EffectList;
