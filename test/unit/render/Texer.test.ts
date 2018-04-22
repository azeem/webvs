/* tslint:disable:no-unused-expression ban-types */
import { expect } from "chai";
import { It, Times } from "typemoq";
import Texer from "../../../src/render/Texer";
import { IComponentTestSetup, makeComponentTestSetup } from "../../unitTestUtils";

describe("Texer", () => {
    let setup: IComponentTestSetup<Texer>;
    beforeEach(() => {
        setup = makeComponentTestSetup<Texer>(
            require("inject-loader!../../../src/render/Texer"),
            {
                compileExpr: "../expr/compileExpr",
                shader: "../webgl/ShaderProgram",
            },
        );
    });

    it("Should handle resize event properly", () => {
        const { componentClass: TexerClass, mockMain, mockParent, mockGl, mockCodeInstance, mockRsrcMan } = setup;
        let getImageCb = null;
        mockRsrcMan
            .setup((x) => x.getImage(It.isAnyString(), It.is((a) => typeof(a) === "function")))
            .callback((src, cb) => getImageCb = cb);
        let resizeHandle = null; mockMain
            .setup((x) => x.addListener(It.is((a) => a === "resize"), It.is((a) => typeof(a) === "function")))
            .callback((event, cb) => resizeHandle = cb);
        const texer = new TexerClass(mockMain.object, mockParent.object, {});
        expect(resizeHandle).to.be.not.null;
        resizeHandle();
        mockCodeInstance.verify((x) => x.updateDimVars(mockGl.object), Times.once());
    });
});
