import { expect, vi } from "vitest";
import DynamicMovement from "../../../src/trans/DynamicMovement";
import ShaderProgram from "../../../src/webgl/ShaderProgram";
import { getResizeHandler, makeComponentTestSetup } from "../../unitTestUtils";

vi.mock("../../../src/expr/compileExpr");
vi.mock("../../../src/webgl/ShaderProgram");

describe("DynamicMovement", () => {
    it("drawHook should bind uniforms for codeInstance", () => {
        const { mockMain, mockParent, mockGl, mockCodeInstance } = makeComponentTestSetup();
        new DynamicMovement(mockMain, mockParent, {});
        const { calls, instances } = vi.mocked(ShaderProgram).mock;
        const drawHook = calls[0][1].drawHook;
        expect(drawHook).toBeTypeOf("function");
        drawHook({}, mockGl, instances[0]);
        expect(mockCodeInstance.bindUniforms).toHaveBeenCalledExactlyOnceWith(instances[0]);
    });

    it("Should handle resize events properly", () => {
        const { mockCodeInstance, mockMain, mockParent, mockGl } = makeComponentTestSetup();
        new DynamicMovement(mockMain, mockParent, {});
        const resizeHandle = getResizeHandler(mockMain);
        expect(resizeHandle).toBeTypeOf("function");
        resizeHandle();
        expect(mockCodeInstance.updateDimVars).toHaveBeenCalledExactlyOnceWith(mockGl);
    });
});
