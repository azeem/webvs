import { IMock, It, Mock, Times } from "typemoq";
import EffectList from "../../src/EffectList";
import TextureSetManager from "../../src/webgl/TextureSetManager";
import { IComponentTestSetup, makeComponentTestSetup } from "../unitTestUtils";

describe("EffectList", () => {
    let setup: IComponentTestSetup<EffectList>;
    beforeEach(() => {
        setup = makeComponentTestSetup<EffectList>(
            require("inject-loader!../../src/EffectList"),
            {
                compileExpr: "./expr/compileExpr",
                tsm: "./webgl/TextureSetManager",
            },
        );
    });

    it("Should handle resize events properly", () => {
        const { componentClass: EffectListClass, mockTSM, mockGl, mockCodeInstance, mockMain, mockParent } = setup;
        let resizeHandle = null;
        mockMain
            .setup((x) => x.addListener(It.is((a) => a === "resize"), It.is((a) => typeof(a) === "function")))
            .callback((event, cb) => resizeHandle = cb);
        const elComponent = new EffectListClass(mockMain.object, mockParent.object, {});
        resizeHandle();
        mockTSM.verify((x) => x.resize(), Times.once());
        mockCodeInstance.verify((x) => x.updateDimVars(mockGl.object), Times.once());
    });
});
