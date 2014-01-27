/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A component that mirror between quandrants
 *
 * @param {WebGLContext} gl - a webgl context
 * @param {Webvs.Main} main - the main object for this component
 * @param {Webvs.Container} parent - this components parent
 * @param {object} opts - the options object
 * @param {boolean} [opts.onBeatRandom=false] - if set then the mirror flips (between the enabled ones) are randomized
 * @param {boolean} [opts.topToBottom=true] - if set then top half is mirrored to bottom
 * @param {boolean} [opts.bottomToTop=false] - if set then bottom half is mirrored to top
 * @param {boolean} [opts.leftRight=false] - if set then left half is mirrored to right
 * @param {boolean} [opts.rightToLeft=false] - if set then right half is mirrored to left
 * @param {boolean} [opts.smoothTransition=false] - if set then mirror flip changes are animated
 * @param {boolean} [opts.transitionDuration=4] - the number of frames for a flip transition animation
 * @constructor
 * @augments Webvs.Component
 * @memberof Webvs
 */
function Mirror(gl, main, parent, opts) {
    Mirror.super.constructor.call(this, gl, main, parent, opts);
}
Webvs.Mirror = Webvs.defineClass(Mirror, Webvs.Component, {
    defaultOptions: {
        onBeatRandom: false,
        topToBottom: true,
        bottomToTop: false,
        leftToRight: false,
        rightToLeft: false,
        smoothTransition: false,
        transitionDuration: 4
    },
    
    onChange: {
        topToBottom: "updateMap",
        bottomToTop: "updateMap",
        leftToRight: "updateMap",
        rightToLeft: "updateMap"
    },

    init: function() {
        this.program = new MirrorProgram(this.gl);
        this.animFrameCount = 0;
        this.mix = [
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [2, 0, 0, 0],
            [3, 0, 0, 0]
        ];
        this.mixDelta = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];
        this.updateMap();
    },
    
    draw: function() {
        if(this.opts.onBeatRandom && this.main.analyser.beat) {
            this._setQuadrantMap(true);
        }

        this.program.run(this.parent.fm, null, this._inTransition(), this.mix);

        if(this._inTransition()) {
            this.animFrameCount--;
            if(this.animFrameCount === 0) {
                this._setMix(true);
            } else {
                for(var i = 0;i < 4;i++) {
                    for(var j = 0;j < 4;j++) {
                        this.mix[i][j] += this.mixDelta[i][j];
                    }
                }
            }
        }
    },
    
    updateMap: function(random) {
        this._setQuadrantMap(false);
    },

    _inTransition: function() {
        return (this.opts.smoothTransition && this.animFrameCount !== 0);
    },

    _setQuadrantMap: function(random) {
        var map = [0, 1, 2, 3];
        var mirrorOpts = this.opts;
        if(random) {
            var randVal = Math.floor(Math.random()*16);
            mirrorOpts = {
                topToBottom: (randVal & 1) && this.opts.topToBottom,
                bottomToTop: (randVal & 2) && this.opts.bottomToTop,
                leftToRight: (randVal & 4) && this.opts.leftToRight,
                rightToLeft: (randVal & 8) && this.opts.rightToLeft
            };
        }
        if(mirrorOpts.topToBottom) {
            map[2] = map[0]; map[3] = map[1];
        }
        if(mirrorOpts.bottomToTop) {
            map[0] = map[2]; map[1] = map[3];
        }
        if(mirrorOpts.leftToRight) {
            map[1] = map[0]; map[3] = map[2];
        }
        if(mirrorOpts.rightToLeft) {
            map[0] = map[1]; map[2] = map[3];
        }
        this.map = map;

        this._setMix(false);
    },

    _setMix: function(noTransition) {
        var i, j;
        if(this.opts.smoothTransition && !noTransition) {
            // set mix vectors to second format if we are not already
            // in the middle of a transition
            if(this.animFrameCount === 0) {
                for(i = 0;i < 4;i++) {
                    var quad = this.mix[i][0];
                    this.mix[i][0] = 0;
                    this.mix[i][quad] = 1;
                }
            }

            // calculate the mix delta values
            for(i = 0;i < 4;i++) {
                for(j = 0;j < 4;j++) {
                    var endValue = (j  == this.map[i])?1:0;
                    this.mixDelta[i][j] = (endValue - this.mix[i][j])/this.opts.transitionDuration;
                }
            }

            this.animFrameCount = this.opts.transitionDuration;
        } else {
            // set mix value to first format
            for(i = 0;i < 4;i++) {
                this.mix[i][0] = this.map[i];
                for(j = 1;j < 4;j++) {
                    this.mix[i][j] = 0;
                }
            }
        }
    }
});

/**
 * Working:
 * The program accepts a mode and 4 mix vectors, one for each of the 4 quadrants.
 * The mode decides between two scenarios Case 1. a simple
 * mapping ie. one quadrant is copied over to another.
 * In this case the first value of each vec4 will contain the
 * id of the quadrant from where the pixels will be copied
 * Case 2. This is used during transition animation. Here, the
 * final color of pixels in each quadrant is a weighted mix
 * of colors of corresponding mirrored points in all quadrants.
 * Each of the vec4 contains a mix weight for each 4 quadrants. As
 * the animation proceeds, one of the 4 in the vec4 becomes 1 while others
 * become 0. This two mode allows to make fewer texture sampling when
 * not doing transition animation.
 *
 * The quadrant ids are as follows
 *       |
 *    0  |  1
 *  -----------
 *    2  |  3
 *       |
 */
function MirrorProgram(gl) {
    MirrorProgram.super.constructor.call(this, gl, {
        swapFrame: true,
        fragmentShader: [
            "uniform int u_mode;",
            "uniform vec4 u_mix0;",
            "uniform vec4 u_mix1;",
            "uniform vec4 u_mix2;",
            "uniform vec4 u_mix3;",

            "#define getQuadrant(pos) ( (pos.x<0.5) ? (pos.y<0.5?2:0) : (pos.y<0.5?3:1) )",
            "#define check(a,b, c,d,e,f) ( ((a==c || a==d) && (b==e || b==f)) || ((a==e || a==f) && (b==c || b==d)) )",
            "#define xFlip(qa, qb) (check(qa,qb, 0,2, 1,3)?-1:1)",
            "#define yFlip(qa, qb) (check(qa,qb, 0,1, 2,3)?-1:1)",
            "#define mirrorPos(pos,qa,qb) ((pos-vec2(0.5,0.5))*vec2(xFlip(qa,qb),yFlip(qa,qb))+vec2(0.5,0.5))",
            "#define getMirrorColor(pos,qa,qb) (getSrcColorAtPos(mirrorPos(pos,qa,qb)))",

            "void main() {",
            "    int quadrant = getQuadrant(v_position);",
            "    vec4 mix;",
            "    if(quadrant == 0)      { mix = u_mix0; }",
            "    else if(quadrant == 1) { mix = u_mix1; }",
            "    else if(quadrant == 2) { mix = u_mix2; }",
            "    else if(quadrant == 3) { mix = u_mix3; }",
            "    if(u_mode == 0) {",
            "        int otherQuadrant = int(mix.x);",
            "        setFragColor(getMirrorColor(v_position, quadrant, otherQuadrant));",
            "    } else {",
            "        vec4 c0 = getMirrorColor(v_position, quadrant, 0);",
            "        vec4 c1 = getMirrorColor(v_position, quadrant, 1);",
            "        vec4 c2 = getMirrorColor(v_position, quadrant, 2);",
            "        vec4 c3 = getMirrorColor(v_position, quadrant, 3);",

            "        setFragColor(vec4(",
            "            dot(vec4(c0.r,c1.r,c2.r,c3.r), mix),",
            "            dot(vec4(c0.g,c1.g,c2.g,c3.g), mix),",
            "            dot(vec4(c0.b,c1.b,c2.b,c3.b), mix),",
            "            1.0",
            "        ));",
            "    }",
            "}"
        ]
    });
}
Webvs.MirrorProgram = Webvs.defineClass(MirrorProgram, Webvs.QuadBoxProgram, {
    draw: function(transition, mix) {
        this.setUniform("u_mode", "1i", transition?1:0);
        for(var i = 0;i < 4;i++) {
            this.setUniform.apply(this, ["u_mix"+i, "4f"].concat(mix[i]));
        }
        MirrorProgram.super.draw.call(this);
    }
});

    
})(Webvs);
