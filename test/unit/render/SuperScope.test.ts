import { expect } from "chai";
import { It, Times } from "typemoq";
import SuperScope from "../../../src/render/SuperScope";
import { IComponentTestSetup, makeComponentTestSetup } from "../../unitTestUtils";

describe("SuperScope", () => {
    let setup: IComponentTestSetup<SuperScope>;
    beforeEach(() => {
        setup = makeComponentTestSetup<SuperScope>(
            require("inject-loader!../../../src/render/SuperScope"),
            {
                compileExpr: "../expr/compileExpr",
                shader: "../webgl/ShaderProgram",
            },
        );
        setup.mockGl.setup((x) => x.getParameter(It.isAny())).returns(() => [0, 10]);
    });

    it("Should handle resize events properly", () => {
        const { componentClass: SuperScopeClass, mockMain, mockParent, mockCodeInstance, mockGl } = setup;
        let resizeHandle = null;
        mockMain
            .setup((x) => x.addListener(It.is((a) => a === "resize"), It.is((a) => typeof(a) === "function")))
            .callback((event, cb) => resizeHandle = cb);
        const superScope = new SuperScopeClass(mockMain.object, mockParent.object, {});
        // tslint:disable-next-line:no-unused-expression
        expect(resizeHandle).to.be.not.null;
        resizeHandle();
        mockCodeInstance.verify((x) => x.updateDimVars(mockGl.object), Times.once());
    });
});
