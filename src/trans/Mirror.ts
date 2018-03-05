import Component, { IContainer } from '../Component';
import RenderingContext from '../webgl/RenderingContext';
import { WebGLVarType } from '../utils';
import IMain from '../IMain';
import ShaderProgram from '../webgl/ShaderProgram';

export interface MirrorDirs {
    topToBottom: boolean,
    bottomToTop: boolean,
    leftToRight: boolean,
    rightToLeft: boolean,
}

export interface MirrorOpts extends MirrorDirs {
    onBeatRandom: boolean,
    smoothTransition: boolean,
    transitionDuration: number
}

// A component that mirror between quandrants
export default class Mirror extends Component {
    public static componentName: string = "Mirror";
    public static componentTag: string = "trans";
    protected static optUpdateHandlers = {
        topToBottom: "updateMap",
        bottomToTop: "updateMap",
        leftToRight: "updateMap",
        rightToLeft: "updateMap"
    };
    protected static defaultOptions: MirrorOpts = {
        onBeatRandom: false,
        topToBottom: true,
        bottomToTop: false,
        leftToRight: false,
        rightToLeft: false,
        smoothTransition: false,
        transitionDuration: 4
    };

    protected opts: MirrorOpts;
    private program: ShaderProgram;
    private animFrameCount: number;
    private map: number[];
    private mix: number[][];
    private mixDelta: number[][];

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.program = new ShaderProgram(this.main.rctx, {
            swapFrame: true,
            bindings: {
                uniforms: {
                    transition: { name: 'u_mode', valueType: WebGLVarType._1I },
                    mix0: { name: 'u_mix0', valueType: WebGLVarType._4FV },
                    mix1: { name: 'u_mix1', valueType: WebGLVarType._4FV },
                    mix2: { name: 'u_mix2', valueType: WebGLVarType._4FV },
                    mix3: { name: 'u_mix3', valueType: WebGLVarType._4FV },
                }
            },
            fragmentShader: `
                uniform int u_mode;
                uniform vec4 u_mix0;
                uniform vec4 u_mix1;
                uniform vec4 u_mix2;
                uniform vec4 u_mix3;

                #define getQuadrant(pos) ( (pos.x<0.5) ? (pos.y<0.5?2:0) : (pos.y<0.5?3:1) )
                #define check(a,b, c,d,e,f) ( ((a==c || a==d) && (b==e || b==f)) || ((a==e || a==f) && (b==c || b==d)) )
                #define xFlip(qa, qb) (check(qa,qb, 0,2, 1,3)?-1:1)
                #define yFlip(qa, qb) (check(qa,qb, 0,1, 2,3)?-1:1)
                #define mirrorPos(pos,qa,qb) ((pos-vec2(0.5,0.5))*vec2(xFlip(qa,qb),yFlip(qa,qb))+vec2(0.5,0.5))
                #define getMirrorColor(pos,qa,qb) (getSrcColorAtPos(mirrorPos(pos,qa,qb)))

                void main() {
                    int quadrant = getQuadrant(v_position);
                    vec4 mix;
                    if(quadrant == 0)      { mix = u_mix0; }
                    else if(quadrant == 1) { mix = u_mix1; }
                    else if(quadrant == 2) { mix = u_mix2; }
                    else if(quadrant == 3) { mix = u_mix3; }
                    if(u_mode == 0) {
                        int otherQuadrant = int(mix.x);
                        setFragColor(getMirrorColor(v_position, quadrant, otherQuadrant));
                    } else {
                        vec4 c0 = getMirrorColor(v_position, quadrant, 0);
                        vec4 c1 = getMirrorColor(v_position, quadrant, 1);
                        vec4 c2 = getMirrorColor(v_position, quadrant, 2);
                        vec4 c3 = getMirrorColor(v_position, quadrant, 3);

                        setFragColor(vec4(
                            dot(vec4(c0.r,c1.r,c2.r,c3.r), mix),
                            dot(vec4(c0.g,c1.g,c2.g,c3.g), mix),
                            dot(vec4(c0.b,c1.b,c2.b,c3.b), mix),
                            1.0
                        ));
                    }
                }
            `
        });
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
    }
    
    draw() {
        if(this.opts.onBeatRandom && this.main.analyser.beat) {
            this._setQuadrantMap(true);
        }

        this.program.run(this.parent.fm, {
            transition: this._inTransition() ? 1 : 0,
            mix0: this.mix[0],
            mix1: this.mix[1],
            mix2: this.mix[2],
            mix3: this.mix[3],
        });

        if(this._inTransition()) {
            this.animFrameCount--;
            if(this.animFrameCount === 0) {
                this._setMix(true);
            } else {
                for(let i = 0;i < 4;i++) {
                    for(let j = 0;j < 4;j++) {
                        this.mix[i][j] += this.mixDelta[i][j];
                    }
                }
            }
        }
    }
    
    private updateMap() {
        this._setQuadrantMap();
    }

    private _inTransition() {
        return (this.opts.smoothTransition && this.animFrameCount !== 0);
    }

    private _setQuadrantMap(random: boolean = false) {
        const map = [0, 1, 2, 3];
        let mirrorDirs: MirrorDirs = this.opts;
        if(random) {
            var randVal = Math.floor(Math.random()*16);
            mirrorDirs = {
                topToBottom: (randVal & 1) && this.opts.topToBottom,
                bottomToTop: (randVal & 2) && this.opts.bottomToTop,
                leftToRight: (randVal & 4) && this.opts.leftToRight,
                rightToLeft: (randVal & 8) && this.opts.rightToLeft
            };
        }
        if(mirrorDirs.topToBottom) {
            map[2] = map[0]; map[3] = map[1];
        }
        if(mirrorDirs.bottomToTop) {
            map[0] = map[2]; map[1] = map[3];
        }
        if(mirrorDirs.leftToRight) {
            map[1] = map[0]; map[3] = map[2];
        }
        if(mirrorDirs.rightToLeft) {
            map[0] = map[1]; map[2] = map[3];
        }
        this.map = map;

        this._setMix(false);
    }

    _setMix(noTransition: boolean) {
        if(this.opts.smoothTransition && !noTransition) {
            // set mix vectors to second format if we are not already
            // in the middle of a transition
            if(this.animFrameCount === 0) {
                for(let i = 0;i < 4;i++) {
                    const quad = this.mix[i][0];
                    this.mix[i][0] = 0;
                    this.mix[i][quad] = 1;
                }
            }

            // calculate the mix delta values
            for(let i = 0;i < 4;i++) {
                for(let j = 0;j < 4;j++) {
                    const endValue = (j  == this.map[i])?1:0;
                    this.mixDelta[i][j] = (endValue - this.mix[i][j])/this.opts.transitionDuration;
                }
            }

            this.animFrameCount = this.opts.transitionDuration;
        } else {
            // set mix value to first format
            for(let i = 0;i < 4;i++) {
                this.mix[i][0] = this.map[i];
                for(let j = 1;j < 4;j++) {
                    this.mix[i][j] = 0;
                }
            }
        }
    }
}