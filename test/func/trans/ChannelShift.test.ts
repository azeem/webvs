import { mainTest, makeSinglePreset } from "../funcTestUtils";

describe("ChannelShift", () => {
    const makePreset = (opts) => makeSinglePreset("ChannelShift", opts, 1);
    it("should shift RBG", () => {
        return mainTest({
            preset: makePreset({ channel: "RBG" }),
            expectImageSrc: "ChannelShift_0.png",
        });
    });

    it("should shift BRG", () => {
        return mainTest({
            preset: makePreset({ channel: "BRG" }),
            expectImageSrc: "ChannelShift_1.png",
        });
    });

    it("should shift BGR", () => {
        return mainTest({
            preset: makePreset({ channel: "BGR" }),
            expectImageSrc: "ChannelShift_2.png",
        });
    });

    it("should shift GBR", () => {
        return mainTest({
            preset: makePreset({ channel: "GBR" }),
            expectImageSrc: "ChannelShift_3.png",
        });
    });

    it("should shift GRB", () => {
        return mainTest({
            preset: makePreset({ channel: "GRB" }),
            expectImageSrc: "ChannelShift_4.png",
        });
    });
});
