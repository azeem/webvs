import { mainTest, makeSinglePreset } from "../funcTestUtils";

describe("ChannelShift", () => {
    const makePreset = (opts) => makeSinglePreset("ChannelShift", opts, 1);
    it("should shift RBG", () => {
        return mainTest({
            expectImageSrc: "ChannelShift_0.png",
            preset: makePreset({ mode: "RBG" }),
        });
    });

    it("should shift BRG", () => {
        return mainTest({
            expectImageSrc: "ChannelShift_1.png",
            preset: makePreset({ mode: "BRG" }),
        });
    });

    it("should shift BGR", () => {
        return mainTest({
            expectImageSrc: "ChannelShift_2.png",
            preset: makePreset({ mode: "BGR" }),
        });
    });

    it("should shift GBR", () => {
        return mainTest({
            expectImageSrc: "ChannelShift_3.png",
            preset: makePreset({ mode: "GBR" }),
        });
    });

    it("should shift GRB", () => {
        return mainTest({
            expectImageSrc: "ChannelShift_4.png",
            preset: makePreset({ mode: "GRB" }),
        });
    });
});
