import { makeSinglePreset, mainTest } from "../funcTestUtils";

describe('ColorClip', () => {
    const makePreset = (opts) => makeSinglePreset('ColorClip', opts, 1);

    it('should clip below', () => {
        return mainTest({
            preset: makePreset({
                mode: "BELOW", color: "#7F7FFF", outColor: "#000000"
            }),
            expectImageSrc: 'ColorClip_0.png'
        });
    });

    it('should clip above', () => {
        return mainTest({
            preset: makePreset({
                mode: "ABOVE", color: "#7F7FFF", outColor: "#000000"
            }),
            expectImageSrc: 'ColorClip_1.png'
        });
    });

    it('should clip near #1', () => {
        return mainTest({
            preset: makePreset({
                mode: "NEAR", color: "#7F7FFF", outColor: "#000000", level: 0.5
            }),
            expectImageSrc: 'ColorClip_2.png'
        });
    });

    it('should clip near #2', () => {
        return mainTest({
            preset: makePreset({
                mode: "NEAR", color: "#7F7FFF", outColor: "#000000", level: 1
            }),
            expectImageSrc: 'ColorClip_3.png',
            mismatchThreshold: 10
        });
    });
});