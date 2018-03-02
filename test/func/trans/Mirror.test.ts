import * as seedrandom from 'seedrandom';
import QuadBoxProgram from "../../../src/webgl/QuadBoxProgram";
import Component from "../../../src/Component";
import { mainTest } from "../funcTestUtils";
import IMain from "../../../src/IMain";

class QuadrantColorProgram extends QuadBoxProgram {
    constructor(rctx) {
        super(rctx, {
            fragmentShader: [
                "void main() {",
                "    if(v_position.x < 0.5 && v_position.y < 0.5) {",
                "        setFragColor(vec4(1.0,0.0,0.0,1.0));",
                "    }",
                "    if(v_position.x < 0.5 && v_position.y > 0.5) {",
                "        setFragColor(vec4(0.0,1.0,0.0,1.0));",
                "    }",
                "    if(v_position.x > 0.5 && v_position.y > 0.5) {",
                "        setFragColor(vec4(0.0,0.0,1.0,1.0));",
                "    }",
                "    if(v_position.x > 0.5 && v_position.y < 0.5) {",
                "        setFragColor(vec4(1.0,1.0,0.0,1.0));",
                "    }",
                "}"
            ]
        })
    }
};
class QuadrantColorComponent extends Component {
    public static componentName: string = "QuadrantColor";
    public static componentTag: string = "render";
    private program: QuadrantColorProgram;

    init() {
        this.program = new QuadrantColorProgram(this.main.rctx);
    }

    draw() {
        this.program.run(this.parent.fm, null);
    }
}

describe('Mirror', () => {
    before(() => {
        seedrandom('mirror_test2', {global: true});
    });

    after(() => {
        seedrandom(undefined, {global: true});
    })

    function mirrorTest(opts: any, expectImageSrc: string, frameCount?: number, onFrame?: (main: IMain, frame: number) => void) {
        const mirrorOpts = Object.assign({type: "Mirror"}, opts);
        return mainTest({
            onInit: (main: IMain) => {
                main.componentRegistry.addComponent(QuadrantColorComponent);
            },
            preset: {
                components: [
                    {type: "QuadrantColor"},
                    mirrorOpts
                ]
            },
            expectImageSrc,
            frameCount,
            onFrame
        });
    }

    it('Should mirror topToBottom', () => mirrorTest({topToBottom: true}, 'Mirror_0.png'));
    it('Should mirror bottomToTop', () => mirrorTest({topToBottom: false, bottomToTop: true}, 'Mirror_1.png'));
    it('Should mirror leftToRight', () => mirrorTest({topToBottom: false, leftToRight: true}, 'Mirror_2.png'));
    it('Should mirror rightToLeft', () => mirrorTest({topToBottom: false, rightToLeft: true}, 'Mirror_3.png'));
    it('Should onBeatRandom with transition #1', () => {
        return mirrorTest(
            {topToBottom: true, rightToLeft: true, onBeatRandom: true, smoothTransition: true, transitionDuration: 10},
            'Mirror_4.png',
            5,
            (main, frame) => {
                if(frame === 0) {
                    main.analyser.beat = true;
                } else {
                    main.analyser.beat = false;
                }
            }
        );
    });
    it('Should onBeatRandom with transition #2', () => {
        return mirrorTest(
            {topToBottom: true, bottomToTop: true, rightToLeft: true, leftToRight: true, onBeatRandom: true, smoothTransition: true, transitionDuration: 15},
            'Mirror_5.png',
            15,
            (main, frame) => {
                if(frame === 0 || frame === 10) {
                    main.analyser.beat = true;
                } else {
                    main.analyser.beat = false;
                }
            }
        );
    });
    it('Should mirror topToBottom and rightToLeft', () => mirrorTest({topToBottom: true, rightToLeft: true}, 'Blue.png'));
});