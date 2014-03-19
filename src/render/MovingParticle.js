/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A particle that moves around depending on beat changes
 *
 * @param {WebGLContext} gl - the webgl context
 * @param {Webvs.Main} main - the Webvs Main object
 * @param {Webvs.Container} parent - this parent for this component
 * @param {object} options - the options object
 * @param {string} [options.color="#FFFFFF"] - color of the particle
 * @param {number} [options.distance=0.7] - maximum distance of particle from center. 0 being center and 1 the screen edge.
 * @param {number} [options.particleSize=10] - radius of the particle in pixels
 * @param {boolean} [options.onBeatSizeChange=false] - if set, then the particle size changes on beat
 * @param {number} [options.onBeatParticleSize=10] - radius of the particle in pixels during beats. ignored if onBeatSizeChange is false
 * @param {string} [options.blendMode="REPLACE"] - blending mode
 *
 * @memberof Webvs
 * @augments Webvs.Component
 * @constructor
 */
function MovingParticle(gl, main, parent, opts) {
    MovingParticle.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(MovingParticle, {
    name: "MovingParticle",
    menu: "Render"
});

Webvs.defineClass(MovingParticle, Webvs.Component, {
    defaultOptions: {
        color: "#FFFFFF",
        distance: 0.7,
        particleSize: 10,
        onBeatSizeChange: false,
        onBeatParticleSize: 10,
        blendMode: "REPLACE"
    },

    onChange: {
        color: "updateColor",
        blendMode: "updateProgram"
    },

    init: function() {
        this.centerX = 0;
        this.centerY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.posX = 0;
        this.posY = 0;

        this._computeGeometry();
        this.updateProgram();
        this.updateColor();
    },

    _computeGeometry: function() {
        if(Webvs.MovingParticle.circleGeometry) {
            return;
        }
        var pointCount = 100;
        var points = new Float32Array((pointCount+2)*2);
        var pbi = 0;
        points[pbi++] = 0; // center
        points[pbi++] = 0;
        for(var i = 0;i < pointCount;i++) {
            points[pbi++] = Math.sin(i*2*Math.PI/pointCount);
            points[pbi++] = Math.cos(i*2*Math.PI/pointCount);
        }
        points[pbi++] = points[2]; // repeat last point again
        points[pbi++] = points[3];
        Webvs.MovingParticle.circleGeometry = points;
    },

    draw: function() {
        if(this.main.analyser.beat) {
            this.centerX = (Math.random()*2-1)*0.3;
            this.centerY = (Math.random()*2-1)*0.3;
        }

        this.velocityX -= 0.004*(this.posX-this.centerX);
        this.velocityY -= 0.004*(this.posY-this.centerY);

        this.posX += this.velocityX;
        this.posY += this.velocityY;

        this.velocityX *= 0.991;
        this.velocityY *= 0.991;
        
        var x = this.posX*this.opts.distance;
        var y = this.posY*this.opts.distance;

        var scaleX, scaleY;
        if(this.opts.onBeatSizeChange && this.main.analyser.beat) {
            scaleX = this.opts.onBeatParticleSize;
            scaleY = this.opts.onBeatParticleSize;
        } else {
            scaleX = this.opts.particleSize;
            scaleY = this.opts.particleSize;
        }
        scaleX = 2*scaleX/this.main.canvas.width;
        scaleY = 2*scaleY/this.main.canvas.height;

        this.program.run(this.parent.fm, null, Webvs.MovingParticle.circleGeometry,
                         scaleX, scaleY, x, y, this.color);
    },

    updateProgram: function() {
        var blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
        var program = new MovingParticleShader(this.gl, blendMode);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    },

    updateColor: function() {
        this.color = Webvs.parseColorNorm(this.opts.color);
    },

    destroy: function() {
        this.program.destroy();
    }
});

function MovingParticleShader(gl, blendMode) {
    MovingParticleShader.super.constructor.call(this, gl, {
        copyOnSwap: true,
        blendMode: blendMode,
        vertexShader: [
            "attribute vec2 a_point;",
            "uniform vec2 u_position;",
            "uniform vec2 u_scale;",
            "void main() {",
            "   setPosition((a_point*u_scale)+u_position);",
            "}"
        ],
        fragmentShader: [
            "uniform vec3 u_color;",
            "void main() {",
            "   setFragColor(vec4(u_color, 1));",
            "}"
        ]
    });
}
Webvs.MovingParticleShader = Webvs.defineClass(MovingParticleShader, Webvs.ShaderProgram, {
    draw: function(points, scaleX, scaleY, x, y, color) {
        this.setUniform("u_scale", "2f", scaleX, scaleY);
        this.setUniform("u_position", "2f", x, y);
        this.setUniform.apply(this, ["u_color", "3f"].concat(color));
        this.setVertexAttribArray("a_point", points);
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, points.length/2);
    }
});

})(Webvs);
