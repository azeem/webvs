import { expect, vi } from "vitest";
import EffectList from "../../src/EffectList";
import TextureSetManager from "../../src/webgl/TextureSetManager";
import { getResizeHandler, makeComponentTestSetup } from "../unitTestUtils";

vi.mock("../../src/expr/compileExpr");
vi.mock("../../src/webgl/TextureSetManager");

describe("EffectList", () => {
    it("Should handle resize events properly", () => {
        const { mockGl, mockCodeInstance, mockMain, mockParent } = makeComponentTestSetup();
        new EffectList(mockMain, mockParent, {});
        const mockTSM = vi.mocked(TextureSetManager).mock.instances[0];
        getResizeHandler(mockMain)();
        expect(mockTSM.resize).toHaveBeenCalledTimes(1);
        expect(mockCodeInstance.updateDimVars).toHaveBeenCalledExactlyOnceWith(mockGl);
    });
});
