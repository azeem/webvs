import * as seedrandom from "seedrandom";
import Component from "../../../src/Component";
import IMain from "../../../src/IMain";
import ShaderProgram from "../../../src/webgl/ShaderProgram";
import { mainTest, MockAnalyser } from "../funcTestUtils";

class QuadrantColorComponent extends Component {
    public static componentName: string = "QuadrantColor";
    public static componentTag: string = "render";
    private program: ShaderProgram;

    public init() {
        this.program = new ShaderProgram(this.main.getRctx(), {
            fragmentShader: `
                void main() {
                    if(v_position.x < 0.5 && v_position.y < 0.5) {
                        setFragColor(vec4(1.0,0.0,0.0,1.0));
                    }
                    if(v_position.x < 0.5 && v_position.y > 0.5) {
                        setFragColor(vec4(0.0,1.0,0.0,1.0));
                    }
                    if(v_position.x > 0.5 && v_position.y > 0.5) {
                        setFragColor(vec4(0.0,0.0,1.0,1.0));
                    }
                    if(v_position.x > 0.5 && v_position.y < 0.5) {
                        setFragColor(vec4(1.0,1.0,0.0,1.0));
                    }
                }
            `,
        });
    }

    public draw() {
        this.program.run(this.parent.getTSM(), {});
    }
}

describe("Mirror", () => {
    before(() => {
        seedrandom("mirror_test2", {global: true});
    });

    after(() => {
        seedrandom(undefined, {global: true});
    });

    function mirrorTest(
        opts: any,
        expectImageSrc: string,
        frameCount?: number,
        onFrame?: (main: IMain, frame: number) => void,
    ) {
        const mirrorOpts = Object.assign({type: "Mirror"}, opts);
        return mainTest({
            expectImageSrc,
            frameCount,
            onFrame,
            onInit: (main: IMain) => {
                main.getComponentRegistry().addComponent(QuadrantColorComponent);
            },
            preset: {
                components: [
                    {type: "QuadrantColor"},
                    mirrorOpts,
                ],
            },
        });
    }

    it("Should mirror topToBottom", () => mirrorTest({topToBottom: true}, "Mirror_0.png"));
    it("Should mirror bottomToTop", () => mirrorTest({topToBottom: false, bottomToTop: true}, "Mirror_1.png"));
    it("Should mirror leftToRight", () => mirrorTest({topToBottom: false, leftToRight: true}, "Mirror_2.png"));
    it("Should mirror rightToLeft", () => mirrorTest({topToBottom: false, rightToLeft: true}, "Mirror_3.png"));
    it("Should onBeatRandom with transition #1", () => {
        return mirrorTest(
            {topToBottom: true, rightToLeft: true, onBeatRandom: true, smoothTransition: true, transitionDuration: 10},
            "Mirror_4.png",
            5,
            (main, frame) => {
                if (frame === 0) {
                    (main.getAnalyser() as MockAnalyser).setBeat(true);
                } else {
                    (main.getAnalyser() as MockAnalyser).setBeat(false);
                }
            },
        );
    });
    it("Should onBeatRandom with transition #2", () => {
        return mirrorTest(
            {
                bottomToTop: true,
                leftToRight: true,
                onBeatRandom: true,
                rightToLeft: true,
                smoothTransition: true,
                topToBottom: true,
                transitionDuration: 15,
            },
            "Mirror_5.png",
            15,
            (main, frame) => {
                if (frame === 0 || frame === 10) {
                    (main.getAnalyser() as MockAnalyser).setBeat(true);
                } else {
                    (main.getAnalyser() as MockAnalyser).setBeat(false);
                }
            },
        );
    });
    it("Should mirror topToBottom and rightToLeft", () => {
        return mirrorTest({topToBottom: true, rightToLeft: true}, "Blue.png");
    });
});
