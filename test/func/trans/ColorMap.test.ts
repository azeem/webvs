import { mainTest, makeSinglePreset } from "../funcTestUtils";

describe("ColorMap", () => {
    const makePreset = (opts) => makeSinglePreset("ColorMap", opts, 0);
    const maps = [
        {
            colors: [
                {position: 0, color: "#000000"},
                {position: 255, color: "#FFFFFF"},
            ],
            enabled: true,
        },
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
                blendMode: "FIFTY_FIFTY", key: "RED", maps,
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

    it("should map CHANNEL_SUM_HALF", () => {
        return mainTest({
            expectImageSrc: "ColorMap_3.png",
            preset: makePreset({
                key: "CHANNEL_SUM_HALF", maps,
            }),
        });
    });

    it("should map CHANNEL_AVERAGE", () => {
        return mainTest({
            expectImageSrc: "ColorMap_4.png",
            preset: makePreset({
                key: "CHANNEL_AVERAGE", maps,
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
