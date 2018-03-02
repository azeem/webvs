import { mainTest, makeSinglePreset } from "../funcTestUtils";
import IMain from "../../../src/IMain";

describe('Mosaic', () => {
    const makeMosaicPreset = (opts) => makeSinglePreset('Mosaic', opts, 1);
    it('should run with squareSize=1', () => {
        return mainTest({
            preset: makeMosaicPreset({squareSize: 1}),
            expectImageSrc: 'Mosaic_0.png'
        });
    });
    it('should run with squareSize=0.2', () => {
        return mainTest({
            preset: makeMosaicPreset({squareSize: 0.2}),
            expectImageSrc: 'Mosaic_1.png'
        });
    });
    it('should run with squareSize=0.011', () => {
        return mainTest({
            preset: makeMosaicPreset({squareSize: 0.011}),
            expectImageSrc: 'Mosaic_2.png'
        });
    });
    it('should onBeatSizeChange', () => {
        return mainTest({
            preset: makeMosaicPreset({
                squareSize: 0.01,
                onBeatSizeChange: true,
                onBeatSquareSize: 0.07,
                onBeatSizeDuration: 10
            }),
            expectImageSrc: 'Mosaic_3.png',
            onFrame: (main: IMain, frame: number) => {
                main.analyser.beat = frame === 0;
            },
            frameCount: 5
        });
    });
});