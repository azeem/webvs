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
function Picture(options) {
    Webvs.checkRequiredOptions(options, ["src", "x", "y"]);

    this.x = options.x;
    this.y = options.y;
    this.src = options.src;

    this.program = new Webvs.PictureProgram();
    Picture.super.constructor.apply(this, arguments);
}
Webvs.Picture = Webvs.defineClass(Picture, Webvs.Component, {
    /**
     * initializes the ClearScreen component
     * @memberof Webvs.Picture
     */
    init: function(gl, main, parent) {
        Picture.super.init.call(this, gl, main, parent);

        this.program.init(gl);

        var _this = this;
        var image = new Image();
        image.src = this.src;
        var promise = new Webvs.Promise();
        image.onload = function() {
            _this.width = image.width;
            _this.height = image.height;
            _this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, _this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            promise.resolve();
        };

        return promise;
    },

    /**
     * renders the image
     * @memberof Webvs.Picture
     */
    update: function() {
        this.program.run(this.parent.fm, null, this.x, this.y, this.texture, this.width, this.height);
    },

    /**
     * releases resources
     * @memberof Webvs.Picture
     */
    destroy: function() {
        this.program.cleanup();
        this.gl.deleteTexture(this.texture);
    }
});

function PictureProgram() {
    PictureProgram.super.constructor.call(this, {
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
