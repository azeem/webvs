import { expect, vi } from "vitest";
import GlobalVar from "../../../src/misc/GlobalVar";
import { getResizeHandler, makeComponentTestSetup } from "../../unitTestUtils";

vi.mock("../../../src/expr/compileExpr");

describe("GlobalVar", () => {
    it("Should handle resize events properly", () => {
        const { mockMain, mockParent, mockCodeInstance, mockGl } = makeComponentTestSetup();
        new GlobalVar(mockMain, mockParent, {});
        const resizeHandle = getResizeHandler(mockMain);
        expect(resizeHandle).toBeTypeOf("function");
        resizeHandle();
        expect(mockCodeInstance.updateDimVars).toHaveBeenCalledExactlyOnceWith(mockGl);
    });
});
