/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function Texer(options) {
    Webvs.checkRequiredOptions(options, ["code", "imageSrc"]);
    options = _.defaults(options, {
        source: "SPECTRUM",
        wrapAround: false
    });

    this.colorFiltering = options.colorFiltering;
    this.wrapAround = options.wrapAround;
    this.imageSrc = options.imageSrc;

    var codeGen = new Webvs.ExprCodeGenerator(options.code, ["n", "v", "i", "x", "y", "b", "sizex", "sizey", "w", "h", "red", "green", "blue", "cid"]);
    var genResult = codeGen.generateCode(["init", "onBeat", "perFrame", "perPoint"], [], []);
    this.code = genResult[0];
    this.code.n = 100;
    this.spectrum = options.source == "SPECTRUM";

    this._inited = false;

    this.program = new TexerProgram();
}
Webvs.Texer = Webvs.defineClass(Texer, Webvs.Component, {
    componentName: "Texer",

    init: function(gl, main, parent) {
        Texer.super.init.call(this, gl, main, parent);

        this.program.init(gl);
        this.code.setup(main, this);

        var _this = this;
        var image = new Image();
        image.src = this.imageSrc;
        var promise = new Webvs.Promise();
        image.onload = function() {
            _this.imagewidth = image.width;
            _this.imageHeight = image.height;
            _this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, _this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            promise.resolve();
        };

        return promise;
    },

    update: function() {
        var code = this.code;
        if(!this._inited) {
            code.init();
        }

        var beat = this.main.analyser.beat;
        code.b = beat?1:0;
        code.perFrame();
        if(beat) {
            code.onBeat();
        }

        var nPoints = Math.floor(code.n);
        var data = this.spectrum ? this.main.analyser.getSpectrum() : this.main.analyser.getWaveform();
        var bucketSize = data.length/nPoints;

        var vertexData = [];
        var texVertexData = [];
        var vertexIndices = [];
        var index = 0;
        function addRect(cornx, corny, sizex, sizey) {
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
            vertexIndices.push(
                index+0, index+1, index+2,
                index+0, index+2, index+3
            );
            index += 4;
        }

        var imageSizex = (this.imagewidth/this.parent.fm.width)*2;
        var imageSizey = (this.imageHeight/this.parent.fm.height)*2;

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
            code.perPoint();

            var sizex = code.sizex*imageSizex;
            var sizey = code.sizey*imageSizey;
            var cornx = code.x-sizex/2;
            var corny = (-code.y)-sizey/2;
            
            addRect(cornx, corny, sizex, sizey);
            if(this.wrapAround) {
                // wrapped around x value is 1-(-1-cornx) or -1-(1-cornx)
                // depending on the edge
                // ie. 2+cornx or -2+cornx
                var xwrap = (cornx < -1)?2:((cornx > (1-sizex))?-2:0);
                var ywrap = (corny < -1)?2:((corny > (1-sizey))?-2:0);
                if(xwrap) {
                    addRect(xwrap+cornx, corny, sizex, sizey);
                }
                if(ywrap) {
                    addRect(cornx, ywrap+corny, sizex, sizey);
                }
                if(xwrap && ywrap) {
                    addRect(xwrap+cornx, ywrap+corny, sizex, sizey);
                }
            }
        }

        this.program.run(this.parent.fm, null,
                         new Float32Array(vertexData),
                         new Float32Array(texVertexData),
                         new Uint16Array(vertexIndices),
                         this.texture);
    },

    destroy: function() {
        Texer.super.destroy.call(this);
        this.program.cleanup();
    }
});

function TexerProgram() {
    TexerProgram.super.constructor.call(this, {
        vertexShader: [
            "attribute vec2 a_texVertex;",
            "attribute vec2 a_vertex;",
            "varying vec2 v_texVertex;",
            "void main() {",
            "   v_texVertex = a_texVertex;",
            "   setPosition(a_vertex);",
            "}"
        ],
        fragmentShader: [
            "uniform sampler2D u_image;",
            "varying vec2 v_texVertex;",
            "void main() {",
            "   setFragColor(texture2D(u_image, v_texVertex));",
            "}"
        ]
    });
}
Webvs.TexerProgram = Webvs.defineClass(TexerProgram, Webvs.ShaderProgram, {
    draw: function(vertices, texVertices, indices, image) {
        this.setUniform("u_image", "texture2D", image);
        this.setVertexAttribArray("a_vertex", vertices);
        this.setVertexAttribArray("a_texVertex", texVertices);
        this.setElementArray(indices);
        this.gl.drawElements(this.gl.TRIANGLES, indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
});

})(Webvs);
