import IMain from "../../../src/IMain";
import { mainTest } from "../funcTestUtils";

describe("ClearScreen", () => {
    function makeClearScreenPreset(beatCount = 0) {
        return {
            components: [
                { type: "TestPattern", blue: 0 },
                {
                    type: "ClearScreen",
                    color: "#00FFFF",
                    beatCount,
                },
            ],
        };
    }

    it("clear screen to color", () => {
        return mainTest({preset: makeClearScreenPreset(), expectImageSrc: "Cyan.png"});
    });

    it("should not clear screen till beatCount is reached", () => {
        return mainTest({
            preset: makeClearScreenPreset(5),
            expectImageSrc: "ClearScreen_1.png",
            onFrame: (main: IMain, frame: number) => {
                main.analyser.beat = (frame % 2) === 0;
            },
            frameCount: 8,
        });
    });

    it("should clear screen when beatCount is reached", () => {
        return mainTest({
            preset: makeClearScreenPreset(5),
            expectImageSrc: "Cyan.png",
            onFrame: (main: IMain, frame: number) => {
                main.analyser.beat = (frame % 2) === 0;
            },
            frameCount: 9,
        });
    });
});
