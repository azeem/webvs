import IMain from "../../../src/IMain";
import { mainTest, MockAnalyser } from "../funcTestUtils";

describe("ClearScreen", () => {
    function makeClearScreenPreset(beatCount = 0) {
        return {
            components: [
                { type: "TestPattern", blue: 0 },
                {
                    beatCount,
                    color: "#00FFFF",
                    type: "ClearScreen",
                },
            ],
        };
    }

    it("clear screen to color", () => {
        return mainTest({preset: makeClearScreenPreset(), expectImageSrc: "Cyan.png"});
    });

    it("should not clear screen till beatCount is reached", () => {
        return mainTest({
            expectImageSrc: "ClearScreen_1.png",
            frameCount: 8,
            onFrame: (main: IMain, frame: number) => {
                (main.getAnalyser() as MockAnalyser).setBeat((frame % 2) === 0);
            },
            preset: makeClearScreenPreset(5),
        });
    });

    it("should clear screen when beatCount is reached", () => {
        return mainTest({
            expectImageSrc: "Cyan.png",
            frameCount: 9,
            onFrame: (main: IMain, frame: number) => {
                (main.getAnalyser() as MockAnalyser).setBeat((frame % 2) === 0);
            },
            preset: makeClearScreenPreset(5),
        });
    });
});
