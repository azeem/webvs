import { makeSinglePreset, mainTest } from "../funcTestUtils";

describe('ColorMap', () => {
    const makePreset = (opts) => makeSinglePreset('ColorMap', opts, 0);
    const maps = [
        [{index:0, color: "#000000"},{index:255, color: "#FFFFFF"}]
    ];

    it('should map RED', () => {
        return mainTest({
            preset: makePreset({
                maps, key: "RED"
            }),
            expectImageSrc: 'ColorMap_0.png'
        });
    });

    it('should blend output', () => {
        return mainTest({
            preset: makePreset({
                maps, key: "RED", output: "AVERAGE"
            }),
            expectImageSrc: 'ColorMap_1.png'
        });
    });

    it('should map GREEN', () => {
        return mainTest({
            preset: makePreset({
                maps, key: "GREEN"
            }),
            expectImageSrc: 'ColorMap_2.png'
        });
    });

    it('should map (R+G+B)/2', () => {
        return mainTest({
            preset: makePreset({
                maps, key: "(R+G+B)/2"
            }),
            expectImageSrc: 'ColorMap_3.png'
        });
    });

    it('should map (R+G+B)/3', () => {
        return mainTest({
            preset: makePreset({
                maps, key: "(R+G+B)/3"
            }),
            expectImageSrc: 'ColorMap_4.png'
        });
    });

    it('should map MAX', () => {
        return mainTest({
            preset: makePreset({
                maps, key: "MAX"
            }),
            expectImageSrc: 'ColorMap_5.png'
        });
    });

    it('should map BLUE', () => {
        return mainTest({
            preset: makePreset({
                maps, key: "BLUE"
            }),
            expectImageSrc: 'blank.png'
        });
    });
});