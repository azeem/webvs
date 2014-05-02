/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that renders an image onto the screen
 *
 * @param {object} options - options object
 * @param {string} src - image file source
 * @param {number} x - image x position
 * @param {number} y - image y position
 * @augments Webvs.Component
 * @constructor
 * @memberof Webvs
 */
function Picture(gl, main, parent, opts) {
    Picture.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(Picture, {
    name: "Picture",
    menu: "Render"
});

Webvs.defineClass(Picture, Webvs.Component, {
    defaultOptions: {
        src: "avsres_texer_circle_edgeonly_19x19.bmp",
        x: 0,
        y: 0
    },

    onChange: {
        src: "updateImage"
    },

    init: function() {
        this.program = new Webvs.PictureProgram(this.gl);
        this.updateImage();
    },

    draw: function() {
        this.program.run(this.parent.fm, null, 
                         this.opts.x, this.opts.y,
                         this.texture, this.width, this.height);
    },

    destroy: function() {
        this.program.destroy();
        this.gl.deleteTexture(this.texture);
    },

    updateImage: function() {
        var gl = this.gl;
        this.main.rsrcMan.getImage(
            this.opts.src, 
            function(image) {
                this.width = image.width;
                this.height = image.height;
                if(!this.texture) {
                    this.texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                }
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            },
            null,
            this
        );
    }
});

function PictureProgram(gl) {
    PictureProgram.super.constructor.call(this, gl, {
        copyOnSwap: true,
        vertexShader: [
            "attribute vec2 a_texVertex;",
            "uniform vec2 u_pos;",
            "uniform vec2 u_texRes;",
            "varying vec2 v_texCoord;",

            "void main() {",
            "   v_texCoord = a_texVertex;",
            "   setPosition(a_texVertex*(u_texRes/u_resolution)*vec2(2,-2)+u_pos);",
            "}"
        ],
        fragmentShader: [
            "uniform sampler2D u_image;",
            "varying vec2 v_texCoord;",
            "void main() {",
            "   setFragColor(texture2D(u_image, v_texCoord));",
            "}"
        ]
    });
}
Webvs.PictureProgram = Webvs.defineClass(PictureProgram, Webvs.ShaderProgram, {
    draw: function(x, y, image, imgw, imgh) {
        this.setUniform("u_pos", "2f", x, -y);
        this.setUniform("u_texRes", "2f", imgw, imgh);
        this.setUniform("u_image", "texture2D", image);
        this.setVertexAttribArray(
            "a_texVertex", 
            new Float32Array([
                0,  0,
                0,  1,
                1,  1,
                0,  0,
                1,  1,
                1,  0
            ])
        );
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
});

})(Webvs);
