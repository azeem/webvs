import { makeSinglePreset, mainTest } from "../funcTestUtils";

describe('Invert', () => {
    it('should invert', () => {
        return mainTest({
            preset: makeSinglePreset("Invert", {}, 1),
            expectImageSrc: 'Invert_0.png'
        });
    });
})