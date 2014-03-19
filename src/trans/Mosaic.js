/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function Mosaic(gl, main, parent, opts) {
    Mosaic.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(Mosiac, {
    name: "Mosaic",
    menu: "Trans"
});

Webvs.defineClass(Mosaic, Webvs.Component, {
    defaultOptions: {
        blendMode: "REPLACE",
        squareSize: 0.5,
        onBeatSizeChange: false,
        onBeatSquareSize: 1,
        onBeatSizeDuration: 10
    },

    onChange: {
        blendMode: "updateProgram"
    },

    init: function() {
        this.frameCount = 0;
        this.size = this.opts.squareSize;
        this.updateProgram();
    },

    draw: function() {
        if(this.opts.onBeatSizeChange && this.main.analyser.beat) {
            this.size = this.opts.onBeatSquareSize;
            this.frameCount = this.opts.onBeatSizeDuration;
        }

        if(this.size !== 0) {
            var sizeX = 1/Math.floor(this.size*(this.main.canvas.width-1)+1);
            var sizeY = 1/Math.floor(this.size*(this.main.canvas.height-1)+1);
            this.program.run(this.parent.fm, null, sizeX, sizeY);
        }

        if(this.frameCount > 0) {
            this.frameCount--;
            if(this.frameCount === 0) {
                this.size = this.opts.squareSize;
            } else {
                var incr = Math.abs(this.opts.squareSize-this.opts.onBeatSquareSize)/
                           this.opts.onBeatSizeDuration;
                this.size += incr * (this.opts.onBeatSquareSize>this.opts.squareSize?-1:1);
            }
        }
    },

    destroy: function() {
        this.program.destroy();
    },

    updateProgram: function() {
        var blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
        var program = new Webvs.MosaicProgram(this.gl, blendMode);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    }
});

function MosaicProgram(gl, blendMode) {
    MosaicProgram.super.constructor.call(this, gl, {
        swapFrame: true,
        blendMode: blendMode,
        fragmentShader: [
            "uniform vec2 u_size;",
            "void main() {",
            "    vec2 samplePos = u_size * ( floor(v_position/u_size) + vec2(0.5,0.5) );",
            "    setFragColor(getSrcColorAtPos(samplePos));",
            "}"
        ]
    });
}
Webvs.MosaicProgram = Webvs.defineClass(MosaicProgram, Webvs.QuadBoxProgram, {
    draw: function(sizeX, sizeY) {
        this.setUniform("u_size", "2f", sizeX, sizeY);
        MosaicProgram.super.draw.call(this);
    }
});

})(Webvs);
