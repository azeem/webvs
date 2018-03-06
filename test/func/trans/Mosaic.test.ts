import IMain from "../../../src/IMain";
import { mainTest, makeSinglePreset } from "../funcTestUtils";

describe("Mosaic", () => {
    const makeMosaicPreset = (opts) => makeSinglePreset("Mosaic", opts, 1);
    it("should run with squareSize=1", () => {
        return mainTest({
            expectImageSrc: "Mosaic_0.png",
            preset: makeMosaicPreset({squareSize: 1}),
        });
    });
    it("should run with squareSize=0.2", () => {
        return mainTest({
            expectImageSrc: "Mosaic_1.png",
            preset: makeMosaicPreset({squareSize: 0.2}),
        });
    });
    it("should run with squareSize=0.011", () => {
        return mainTest({
            expectImageSrc: "Mosaic_2.png",
            preset: makeMosaicPreset({squareSize: 0.011}),
        });
    });
    it("should onBeatSizeChange", () => {
        return mainTest({
            expectImageSrc: "Mosaic_3.png",
            frameCount: 5,
            onFrame: (main: IMain, frame: number) => {
                main.analyser.beat = frame === 0;
            },
            preset: makeMosaicPreset({
                onBeatSizeChange: true,
                onBeatSizeDuration: 10,
                onBeatSquareSize: 0.07,
                squareSize: 0.01,
            }),
        });
    });
});
