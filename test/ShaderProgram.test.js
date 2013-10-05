/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

/*function FrameBufferManager(width, height, gl) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this._initFrameBuffers();
}
Webvs.FrameBufferManager = Webvs.defineClass(FrameBufferManager, Object, {
    _initFrameBuffers: function() {
        var gl = this.gl;

        var framebuffer = gl.createFrameBuffer();
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

    getCurrentTexture: function() {
        return this.frameAttachments[this.currAttachment].texture;
    },

    copyCurrentTexture: function() {
    },

    _setFBAttachment: function() {
        var attachment = this.frameAttachments[this.currAttachment];
        var gl = this.gl;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, attachment.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, attachment.renderbuffer);
    },

    swapAttachment : function() {
        this.currAttachment = (this.currAttachment + 1) % 2;
        this._setFBAttachment();
    }
});*/

function ShaderTest() {
    var testFunc = arguments[arguments.length-1];
    var wrapper = function() {
        var canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        canvas.width = 100;
        canvas.height = 100;
        var gl = canvas.getContext("webgl", {
            alpha: false,
            preserveDrawingBuffer: true
        });
        testFunc(canvas, gl);
    }
    var testArgs = Array.prototype.slice.call(arguments, 0, arguments.length-1);
    testArgs.push(wrapper);
    test.apply(window, testArgs);
}

ShaderTest("ShaderProgram BasicTest", 1, function(canvas, gl) {
    var program = new Webvs.ShaderProgram({
        vertexShader: [
            "attribute vec2 a_position;",
            "void main() {",
            "   setPosition(a_position);",
            "}"
        ],
        fragmentShader: [
            "void main() {",
            "   setFragColor(vec4(0,0,1.0,1.0));",
            "}"
        ]
    });
    program.init(gl);
    program.setVertexAttribArray(
        "a_position", 
        new Float32Array([
            -0.8, -0.6,
            0.46, -0.5,
            -0.7, 0.7
        ])
    );
    program.run({width: canvas.width, height: canvas.height}, Webvs.REPLACE, gl.TRIANGLES, 0, 3);
    equal(
        canvas.toDataURL(),
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACuUlEQVR4Xu3aYXKCMBCGYbyZPVntyWpP1iYdmaEWlWxC+LL7MsOfqnTdhy/g6mmapu+0s4l04ASIiMStDEC0PCZAABHrgFg5JAQQsQ6IlUNCABHrgFg5JAQQsQ6IlUNCABHrgFg5JAQQsQ6IlVOZkEt6O3lna9WBCpBzquEz7R+gtNJIx2kAkqsBpZVJIxBQBEFAaYFSkZB8MX9fqYHlqwZmBxCSIggCihWlIiH5ljff+j7b3tKDV2ttIV+3M0juKSglZ1YHEFA6gZT+4JGkbIGpSEgpCEkRBAHlFYoxIfnuKt9lWTeWr0edOwgk3wpnFLb7DhwEkssAZe10PBAElIYgl3SstcGiZQkiKcuuGRPSEoSkCIKAMqMYE7JlsMjyZemAGEh+C7G/4BIEiY1iBLHMsUoDHDMpwiAxkyIOEg/FAHJOXaoZLJYuXbFQBgGJgzIQSAyUwUD8oxhAWs+xuKZUzrIUQPwmZdCEzOeUvw+PBpC9BouWpctfUhyA+EJxAuIHxQDSY7AYd/lyBpIhx/7Nl0OQsVEKQY4YLFqXrzGT4hhkzKQ4BxkPJQDIWCiFICpzLMt1ZYxrSiCQ6+2W2ILZ7zWBQHJT9VEKQdQGi5YzVxslIIh2UoKC6KIUgigPFn0sX8FB9JICyG+wdL4KLgAZabBoWb40UAD5Y3c8CiD/wnQsCiCrq9txKAUgIw8Wx7mmAPLUqn9SAHkZnr4oBSAeBovL7uch47x93bHMjy2f81KuyROcgGxp7vypvEnfdjuIKMijBi//3v/s3U1hceACEOtgccvZ67O5FkADyNy8R+vuGEuDpVk9XlMA0qMc/gcgYucAIICIdUCsHBICiFgHxMohIYCIdUCsHBICiFgHxMohIYCIdUCsHBICiFgHxMohIYCIdUCsHBICiFgHxMohIYCIdUCsnB88eO8BxQEqiwAAAABJRU5ErkJggg==",
        "canvas should display a blue triangle"
    );
    program.cleanup();
});
