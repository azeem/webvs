import { mainTest } from "../funcTestUtils";

describe("FadeOut", () => {
    function makePreset(opts) {
        const fadeOutOpts = Object.assign({
            type: "FadeOut",
        }, opts);
        return {
            components: [
                {
                    code: {
                        init: "n=1",
                        perPoint: [
                            "x=0;",
                            "y=0;",
                            "red  =0;",
                            "green=1;",
                            "blue =1;",
                            "n=0;",
                        ],
                    },
                    drawMode: "DOTS",
                    thickness: 50,
                    type: "SuperScope",
                },
                fadeOutOpts,
            ],
        };
    }

    it("should fade to color", () => {
        return mainTest({
            expectImageSrc: "FadeOut_0.png",
            frameCount: 2,
            preset: makePreset({speed: 1, color: "#FF0000"}),
        });
    });

    it("should fade to color at slower speed", () => {
        return mainTest({
            expectImageSrc: "FadeOut_0.png",
            frameCount: 20,
            preset: makePreset({speed: 0.1, color: "#FF0000"}),
        });
    });
});
