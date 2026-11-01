import { expect, vi } from "vitest";
import Texer from "../../../src/render/Texer";
import { getResizeHandler, makeComponentTestSetup } from "../../unitTestUtils";

vi.mock("../../../src/expr/compileExpr");
vi.mock("../../../src/webgl/ShaderProgram");

describe("Texer", () => {
    it("Should handle resize event properly", () => {
        const { mockMain, mockParent, mockGl, mockCodeInstance } = makeComponentTestSetup();
        new Texer(mockMain, mockParent, {});
        const resizeHandle = getResizeHandler(mockMain);
        expect(resizeHandle).toBeTypeOf("function");
        resizeHandle();
        expect(mockCodeInstance.updateDimVars).toHaveBeenCalledExactlyOnceWith(mockGl);
    });
});
