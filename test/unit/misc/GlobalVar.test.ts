import { expect } from "chai";
import { It, Times } from "typemoq";
import GlobalVar from "../../../src/misc/GlobalVar";
import { IComponentTestSetup, makeComponentTestSetup } from "../../unitTestUtils";

describe("GlobalVar", () => {
    let setup: IComponentTestSetup<GlobalVar>;
    beforeEach(() => {
        setup = makeComponentTestSetup<GlobalVar>(
            require("inject-loader!../../../src/misc/GlobalVar"),
            {
                compileExpr: "../expr/compileExpr",
            },
        );
    });

    it("Should handle resize events properly", () => {
        const { componentClass: GlobalVarClass, mockMain, mockParent, mockCodeInstance, mockGl } = setup;
        let resizeHandle = null;
        mockMain
            .setup((x) => x.addListener(It.is((a) => a === "resize"), It.is((a) => typeof(a) === "function")))
            .callback((event, cb) => resizeHandle = cb);
        const globalVar = new GlobalVarClass(mockMain.object, mockParent.object, {});
        // tslint:disable-next-line:no-unused-expression
        expect(resizeHandle).to.be.not.null;
        resizeHandle();
        mockCodeInstance.verify((x) => x.updateDimVars(mockGl.object), Times.once());
    });
});
