/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A SuperScope like component that places images at points.
function Texer(gl, main, parent, opts) {
    Texer.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(Texer, {
    name: "Texer",
    menu: "Render"
});

Webvs.defineClass(Texer, Webvs.Component, {
    defaultOptions: {
        code: {
            init: "",
            onBeat: "",
            perFrame: "",
            perPoint: ""
        },
        imageSrc: "avsres_texer_circle_edgeonly_19x19.bmp",
        source: "SPECTRUM",
        resizing: false,
        wrapAround: false,
        clone: 1,
        colorFiltering: true
    },

    onChange: {
        code: "updateCode",
        clone: "updateClone",
        imageSrc: "updateImage",
        source: "updateSource"
    },

    init: function() {
        this.program = new TexerProgram(this.gl);
        this.updateCode();
        this.updateClone();
        this.updateImage();
        this.updateSource();
        this.listenTo(this.main, "resize", this.handleResize);
    },

    draw: function() {
        _.each(this.code, function(code) {
            this._drawScope(code, !this.inited);
        }, this);
        this.inited = true;
    },

    destroy: function() {
        this.program.destroy();
        this.gl.deleteTexture(this.texture);
    },

    updateCode: function() {
        var code = Webvs.compileExpr(this.opts.code, ["init", "onBeat", "perFrame", "perPoint"]).codeInst;
        code.n = 100;
        code.setup(this.main, this);
        this.inited = false;
        this.code = [code];
    },

    updateClone: function() {
        this.code = Webvs.CodeInstance.clone(this.code, this.opts.clone);
    },

    updateImage: function() {
        var gl = this.gl;
        this.main.rsrcMan.getImage(
            this.opts.imageSrc,
            function(image) {
                this.imagewidth = image.width;
                this.imageHeight = image.height;
                if(!this.texture) {
                    this.texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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
    },

    updateSource: function() {
        this.source = Webvs.getEnumValue(this.opts.source, Webvs.Source);
    },

    _drawScope: function(code, runInit) {
        if(runInit) {
            code.init();
        }

        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        code.perFrame();
        if(beat) {
            code.onBeat();
        }

        var nPoints = Math.floor(code.n);
        var data;
        if(this.source == Webvs.Source.SPECTRUM) {
            data = this.main.analyser.getSpectrum();
        } else {
            data = this.main.analyser.getWaveform();
        }
        var bucketSize = data.length/nPoints;

        var vertexData = [];
        var texVertexData = [];
        var vertexIndices = [];
        var colorData = this.opts.colorFiltering?[]:null;
        var index = 0;
        function addRect(cornx, corny, sizex, sizey, red, green, blue) {
            if(cornx < -1-sizex || cornx > 1||
               corny < -1-sizey || corny > 1) {
                return;
            }
            // screen coordinates
            vertexData.push(
                cornx,       corny,
                cornx+sizex, corny,
                cornx+sizex, corny+sizey,
                cornx,       corny+sizey
            );

            // texture coordinates
            texVertexData.push(
                0, 0,
                1, 0,
                1, 1,
                0, 1
            );

            if(colorData) {
                // color data
                colorData.push(
                    red, green, blue,
                    red, green, blue,
                    red, green, blue,
                    red, green, blue
                );
            }

            // indices
            vertexIndices.push(
                index+0, index+1, index+2,
                index+0, index+2, index+3
            );
            index += 4;
        }

        var imageSizex = (this.imagewidth/this.gl.drawingBufferWidth)*2;
        var imageSizey = (this.imageHeight/this.gl.drawingBufferHeight)*2;

        for(var i = 0;i < nPoints;i++) {
            var value = 0;
            var size = 0;
            for(var j = Math.floor(i*bucketSize);j < (i+1)*bucketSize;j++,size++) {
                value += data[j];
            }
            value = value/size;

            var pos = i/(nPoints-1);
            code.i = pos;
            code.v = value;
            code.sizex = 1;
            code.sizey = 1;
            code.red = 1;
            code.green = 1;
            code.blue = 1;
            code.perPoint();

            var sizex = imageSizex;
            var sizey = imageSizey;
            if(this.opts.resizing) {
                sizex *= code.sizex;
                sizey *= code.sizey;
            }
            var cornx = code.x-sizex/2;
            var corny = (-code.y)-sizey/2;
            
            addRect(cornx, corny, sizex, sizey, code.red, code.green, code.blue);
            if(this.opts.wrapAround) {
                // wrapped around x value is 1-(-1-cornx) or -1-(1-cornx)
                // depending on the edge
                // ie. 2+cornx or -2+cornx
                var xwrap = (cornx < -1)?2:((cornx > (1-sizex))?-2:0);
                var ywrap = (corny < -1)?2:((corny > (1-sizey))?-2:0);
                if(xwrap) {
                    addRect(xwrap+cornx, corny, sizex, sizey, code.red, code.green, code.blue);
                }
                if(ywrap) {
                    addRect(cornx, ywrap+corny, sizex, sizey, code.red, code.green, code.blue);
                }
                if(xwrap && ywrap) {
                    addRect(xwrap+cornx, ywrap+corny, sizex, sizey, code.red, code.green, code.blue);
                }
            }
        }

        this.program.run(this.parent.fm, null,
                         new Float32Array(vertexData),
                         new Float32Array(texVertexData),
                         new Uint16Array(vertexIndices),
                         colorData?new Float32Array(colorData):null,
                         this.texture);
    },

    handleResize: function() {
        this.code.updateDimVars(this.gl);
    }
});

function TexerProgram(gl) {
    TexerProgram.super.constructor.call(this, gl, {
        copyOnSwap: true,
        vertexShader: [
            "uniform bool u_colorFilter;",
            "attribute vec2 a_texVertex;",
            "attribute vec2 a_vertex;",
            "attribute vec3 a_color;",
            "varying vec2 v_texVertex;",
            "varying vec3 v_color;",
            "void main() {",
            "   if(u_colorFilter) {",
            "       v_color = a_color;",
            "   }",
            "   v_texVertex = a_texVertex;",
            "   setPosition(a_vertex);",
            "}"
        ],
        fragmentShader: [
            "uniform bool u_colorFilter;",
            "uniform sampler2D u_image;",
            "varying vec2 v_texVertex;",
            "varying vec3 v_color;",
            "void main() {",
            "   vec3 outColor = texture2D(u_image, v_texVertex).rgb;",
            "   if(u_colorFilter) {",
            "       outColor = outColor*v_color;",
            "   }",
            "   setFragColor(vec4(outColor, 1));",
            "}"
        ]
    });
}
Webvs.TexerProgram = Webvs.defineClass(TexerProgram, Webvs.ShaderProgram, {
    draw: function(vertices, texVertices, indices, colors, image) {
        this.setUniform("u_image", "texture2D", image);
        this.setVertexAttribArray("a_vertex", vertices);
        this.setVertexAttribArray("a_texVertex", texVertices);
        if(colors) {
            this.setUniform("u_colorFilter", "1f", 1);
            this.setVertexAttribArray("a_color", colors, 3);
        } else {
            this.setUniform("u_colorFilter", "1f", 0);
        }

        this.setElementArray(indices);
        this.gl.drawElements(this.gl.TRIANGLES, indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
});

})(Webvs);
