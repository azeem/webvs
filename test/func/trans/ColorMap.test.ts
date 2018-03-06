import { mainTest, makeSinglePreset } from "../funcTestUtils";

describe("ColorMap", () => {
    const makePreset = (opts) => makeSinglePreset("ColorMap", opts, 0);
    const maps = [
        [{index: 0, color: "#000000"}, {index: 255, color: "#FFFFFF"}],
    ];

    it("should map RED", () => {
        return mainTest({
            expectImageSrc: "ColorMap_0.png",
            preset: makePreset({
                key: "RED", maps,
            }),
        });
    });

    it("should blend output", () => {
        return mainTest({
            expectImageSrc: "ColorMap_1.png",
            preset: makePreset({
                key: "RED", maps, output: "AVERAGE",
            }),
        });
    });

    it("should map GREEN", () => {
        return mainTest({
            expectImageSrc: "ColorMap_2.png",
            preset: makePreset({
                key: "GREEN", maps,
            }),
        });
    });

    it("should map (R+G+B)/2", () => {
        return mainTest({
            expectImageSrc: "ColorMap_3.png",
            preset: makePreset({
                key: "(R+G+B)/2", maps,
            }),
        });
    });

    it("should map (R+G+B)/3", () => {
        return mainTest({
            expectImageSrc: "ColorMap_4.png",
            preset: makePreset({
                key: "(R+G+B)/3", maps,
            }),
        });
    });

    it("should map MAX", () => {
        return mainTest({
            expectImageSrc: "ColorMap_5.png",
            preset: makePreset({
                key: "MAX", maps,
            }),
        });
    });

    it("should map BLUE", () => {
        return mainTest({
            expectImageSrc: "blank.png",
            preset: makePreset({
                key: "BLUE", maps,
            }),
        });
    });
});
