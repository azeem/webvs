import { mainTest, makeSinglePreset } from "../funcTestUtils";

describe("Invert", () => {
    it("should invert", () => {
        return mainTest({
            expectImageSrc: "Invert_0.png",
            preset: makeSinglePreset("Invert", {}, 1),
        });
    });
});
