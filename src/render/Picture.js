/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * Picture - Renders a picture at given coordinate
 * @param options
 * @constructor
 */
function Picture(options) {
    Webvs.checkRequiredOptions(options, ["src", "x", "y"]);
    this.src = options.src;
    this.x = options.x;
    this.y = options.y;
    var vertexSrc = [
        "attribute vec2 a_texCoord;",
        "varying vec2 v_texCoord;",
        "uniform vec2 u_imageResolution;",
        "uniform vec2 u_imagePos;",

        "void main() {",
        "    v_texCoord = a_texCoord*vec2(1,-1);",
        "    vec2 clipSpace = ((a_texCoord*u_imageResolution+u_imagePos)/u_resolution)*2.0-1.0;",
        "    setPosition(vec4(clipSpace*vec2(1, -1), 0, 1));",
        "}"
    ].join("\n");

    var fragmentSrc = [
        "uniform sampler2D u_image;",
        "varying vec2 v_texCoord;",

        "void main() {",
        "   setFragColor(texture2D(u_image, v_texCoord));",
        "}"
    ].join("\n");
    Picture.super.constructor.call(this, vertexSrc, fragmentSrc);
}
Webvs.Picture = Webvs.defineClass(Picture, Webvs.ShaderComponent, {
    componentName: "Picture",

    init: function() {
        var gl = this.gl;

        var imageTexture = gl.createTexture();
        var deferred = D();
        var image = new Image();
        image.src = this.src;
        this.imageTexture = imageTexture;
        var self = this;
        image.onload = function() {
            self.imageResolution = [image.width, image.height];
            gl.bindTexture(gl.TEXTURE_2D, imageTexture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            deferred.resolve();
        };

        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                0.0,  0.0,
                1.0,  0.0,
                0.0,  1.0,
                0.0,  1.0,
                1.0,  0.0,
                1.0,  1.0
            ]),
            gl.STATIC_DRAW
        );

        this.imageLocation = gl.getUniformLocation(this.program, "u_image");
        this.imagePosLocation = gl.getUniformLocation(this.program, "u_imagePos");
        this.imageResLocation = gl.getUniformLocation(this.program, "u_imageResolution");
        this.texCoordLocation = gl.getAttribLocation(this.program, "a_texCoord");
        return deferred.promise;
    },

    update: function() {
        var gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
        gl.uniform1i(this.imageLocation, 0);

        gl.uniform2f(this.imagePosLocation, this.x, this.y);
        gl.uniform2f(this.imageResLocation, this.imageResolution[0], this.imageResolution[1]);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.texCoordLocation);
        gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    },

    destroyComponent: function() {
        Picture.super.destroyComponent.call(this);
        var gl = this.gl;

        gl.deleteTexture(this.imageTexture);
        gl.dleteBuffer(this.texCoordBuffer);
    }
});

})(Webvs);
