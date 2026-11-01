import { expect, vi } from "vitest";
import SuperScope from "../../../src/render/SuperScope";
import { getResizeHandler, makeComponentTestSetup } from "../../unitTestUtils";

vi.mock("../../../src/expr/compileExpr");
vi.mock("../../../src/webgl/ShaderProgram");

describe("SuperScope", () => {
    it("Should handle resize events properly", () => {
        const { mockMain, mockParent, mockCodeInstance, mockGl } = makeComponentTestSetup();
        vi.mocked(mockGl.getParameter).mockReturnValue([0, 10]);
        new SuperScope(mockMain, mockParent, {});
        const resizeHandle = getResizeHandler(mockMain);
        expect(resizeHandle).toBeTypeOf("function");
        resizeHandle();
        expect(mockCodeInstance.updateDimVars).toHaveBeenCalledExactlyOnceWith(mockGl);
    });
});
