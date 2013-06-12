/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/12/13
 * Time: 12:38 AM
 * To change this template use File | Settings | File Templates.
 */

/**
 * Utility component that copies a texture to the screen
 * @constructor
 */
function Copy() {
    var fragmentSrc = [
        "precision mediump float;",
        "uniform sampler2D u_curRender;",
        "varying vec2 v_texCoord;",
        "void main() {",
        "   gl_FragColor = texture2D(u_curRender, v_texCoord);",
        "}"
    ].join("\n");
    Copy.super.constructor.call(this, fragmentSrc);
}
extend(Copy, Trans);

function EffectList(options) {
    checkRequiredOptions(options, ["components"]);

    this.components = options.components;
    this.output = options.output?options.output:constants.BLEND_REPLACE;
    this.clearFrame = options.clearFrame?options.clearFrame:false;
    this.first = true;

    EffectList.super.constructor.call(this);
}
extend(EffectList, Component, {
    swapFrame: true,

    initComponent: function(gl, resolution, analyser) {
        EffectList.super.initComponent.call(this, gl, resolution, analyser);
        this._initFrameBuffer();

        var components = this.components;
        var copyComponent = new Copy();

        // initialize all the components
        var initPromises = [];
        for(var i = 0;i < components.length;i++) {
            var res = components[i].initComponent(gl, resolution, analyser);
            if(res) {
                initPromises.push(res);
            }
        }
        copyComponent.initComponent(gl, this.resolution, analyser);

        this.copyComponent = copyComponent;
        return D.all(initPromises);
    },

    updateComponent: function(texture) {
        EffectList.super.updateComponent.call(this, texture);
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
            gl.useProgram(component.program);
            if(component.swapFrame) {
                var oldTexture = this._getCurrentTextrue();
                this._swapFBAttachment();
                component.updateComponent(oldTexture);
            } else {
                component.updateComponent();
            }
        }

        // switch to old framebuffer and copy the data
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFrameBuffer);
        gl.useProgram(this.copyComponent.program);
        gl.viewport(0, 0, this.resolution.width, this.resolution.height);

        if(this.output != constants.BLEND_REPLACE) {
            gl.enable(gl.BLEND);
            setBlendMode(gl, this.output);
        }
        this.copyComponent.updateComponent(this.frameAttachments[this.currAttachment].texture);
        gl.disable(gl.BLEND);
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
    }
});

window.Webvs.EffectList = EffectList;
