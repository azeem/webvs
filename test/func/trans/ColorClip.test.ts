import { mainTest, makeSinglePreset } from "../funcTestUtils";

describe("ColorClip", () => {
    const makePreset = (opts) => makeSinglePreset("ColorClip", opts, 1);

    it("should clip below", () => {
        return mainTest({
            expectImageSrc: "ColorClip_0.png",
            preset: makePreset({
                color: "#7F7FFF", mode: "BELOW", outColor: "#000000",
            }),
        });
    });

    it("should clip above", () => {
        return mainTest({
            expectImageSrc: "ColorClip_1.png",
            preset: makePreset({
                color: "#7F7FFF", mode: "ABOVE", outColor: "#000000",
            }),
        });
    });

    it("should clip near #1", () => {
        return mainTest({
            expectImageSrc: "ColorClip_2.png",
            preset: makePreset({
                color: "#7F7FFF", level: 0.5, mode: "NEAR", outColor: "#000000",
            }),
        });
    });

    it("should clip near #2", () => {
        return mainTest({
            expectImageSrc: "ColorClip_3.png",
            mismatchThreshold: 10,
            preset: makePreset({
                color: "#7F7FFF", level: 1, mode: "NEAR", outColor: "#000000",
            }),
        });
    });
});
