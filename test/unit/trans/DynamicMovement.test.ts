/* tslint:disable:no-unused-expression ban-types */
import { expect } from "chai";
import { IMock, It, Mock, Times } from "typemoq";
import DynamicMovement from "../../../src/trans/DynamicMovement";
import ShaderProgram from "../../../src/webgl/ShaderProgram";
import { IComponentTestSetup, makeComponentTestSetup } from "../../unitTestUtils";

describe("DynamicMovement", () => {
    let setup: IComponentTestSetup<DynamicMovement>;
    let drawHook: (values: any, gl: WebGLRenderingContext, shader: ShaderProgram) => any;

    beforeEach(() => {
        setup = makeComponentTestSetup<DynamicMovement>(
            require("inject-loader!../../../src/trans/DynamicMovement"),
            {
                compileExpr: "../expr/compileExpr",
                shader: "../webgl/ShaderProgram",
                shaderInit: (rctx, opts) => {
                    drawHook = opts.drawHook;
                },
            },
        );
    });

    it("drawHook should bind uniforms for codeInstance", () => {
        const { componentClass: DMClass, mockMain, mockParent, mockGl, mockShaderProgram, mockCodeInstance } = setup;
        const dmComponent = new DMClass(mockMain.object, mockParent.object, {});
        expect(drawHook).to.be.ok;
        drawHook({}, mockGl.object, mockShaderProgram.object);
        mockCodeInstance.verify((x) => x.bindUniforms(mockShaderProgram.object), Times.once());
    });

    it("Should handle resize events properly", () => {
        const { componentClass: DMClass, mockCodeInstance, mockMain, mockParent, mockGl } = setup;
        let resizeHandle = null; mockMain
            .setup((x) => x.addListener(It.is((a) => a === "resize"), It.is((a) => typeof(a) === "function")))
            .callback((event, cb) => resizeHandle = cb);
        const dmComponent = new DMClass(mockMain.object, mockParent.object, {});
        expect(resizeHandle).to.be.not.null;
        resizeHandle();
        mockCodeInstance.verify((x) => x.updateDimVars(mockGl.object), Times.once());
    });
});
