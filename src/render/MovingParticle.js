/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// A particle that moves around depending on beat changes
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
        blendMode: "updateBlendMode"
    },

    init: function() {
        this.centerX = 0;
        this.centerY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.posX = 0;
        this.posY = 0;

        this.updateBlendMode();
        this.program = new MovingParticleShader(this.gl);
        this.updateColor();
    },

    _getCircleGeometry: function() {
        if(this.main.__circleGeometry) {
            return this.main.__circleGeometry;
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

        var buffer = new Webvs.Buffer(this.gl, false, points);
        this.main.__circleGeometry = buffer;
        return buffer;
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
        scaleX = 2*scaleX/this.gl.drawingBufferWidth;
        scaleY = 2*scaleY/this.gl.drawingBufferHeight;

        this.program.run(this.parent.fm, this.blendMode,
                         this._getCircleGeometry(),
                         scaleX, scaleY, x, y, this.color);
    },

    updateBlendMode: function() {
        this.blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
    },

    updateColor: function() {
        this.color = Webvs.parseColorNorm(this.opts.color);
    },

    destroy: function() {
        MovingParticle.super.destroy.call(this);
        this.program.destroy();
    }
});

function MovingParticleShader(gl) {
    MovingParticleShader.super.constructor.call(this, gl, {
        copyOnSwap: true,
        dynamicBlend: true,
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
    setPoints: function(points) {
        this.setVertexAttribData("a_point", points);
        this.pointsLength = points.length;
    },

    draw: function(points, scaleX, scaleY, x, y, color) {
        this.setUniform("u_scale", "2f", scaleX, scaleY);
        this.setUniform("u_position", "2f", x, y);
        this.setUniform("u_color", "3fv", color);
        this.setAttrib("a_point", points);
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, points.length/2);
    }
});

})(Webvs);
