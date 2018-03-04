import { mainTest, makeSinglePreset } from "../funcTestUtils";

describe('SuperScope', () => {
    const code = {
        init: "n=4",
        perFrame: "c=0",
        perPoint: [
            "x=select(c, -0.75, -0.15, 0.5, 0);",
            "y=select(c, -0.5,  0.5, -0.23, -1);",
            "red  =select(c, 1, 0, 0, 1);",
            "green=select(c, 0, 1, 0, 1);",
            "blue =select(c, 0, 0, 1, 1);",
            "c=c+1;"
        ]
    };

    const code2 = {
        init: "n=3",
        perFrame: "c=0",
        perPoint: [
            "x=select(c, -0.75, -0.15, 0.8);",
            "y=select(c, -0.5,  0.5, 0);",
            "red  =select(c, 1, 0, 0);",
            "green=select(c, 0, 1, 0);",
            "blue =select(c, 0, 0, 1);",
            "c=c+1;"
        ]
    };

    const makePreset = makeSinglePreset.bind(this, 'SuperScope');

    it('should render dots', () => {
        return mainTest({
            preset: makePreset({code, thickness: 1, drawMode: "DOTS"}),
            expectImageSrc: 'SuperScope_0.png'
        });
    });

    it('should render thick dots', () => {
        return mainTest({
            preset: makePreset({code, thickness: 3, drawMode: "DOTS"}),
            expectImageSrc: 'SuperScope_1.png'
        });
    });

    it('should render extremely thick dots', () => {
        return mainTest({
            preset: makePreset({code, thickness: 300, drawMode: "DOTS"}),
            expectImageSrc: 'SuperScope_2.png'
        });
    });

    it('should render lines', () => {
        return mainTest({
            preset: makePreset({code, thickness: 1, drawMode: "LINES"}),
            expectImageSrc: 'SuperScope_3.png',
            mismatchThreshold: 2
        });
    });

    it('should render lines', () => {
        return mainTest({
            preset: makePreset({code, thickness: 1, drawMode: "LINES"}),
            expectImageSrc: 'SuperScope_3.png',
            mismatchThreshold: 4
        });
    });

    it('should render thick lines', () => {
        return mainTest({
            preset: makePreset({code, thickness: 3, drawMode: "LINES"}),
            expectImageSrc: 'SuperScope_4.png',
        });
    });

    it('should render very thick lines', () => {
        return mainTest({
            preset: makePreset({code, thickness: 25, drawMode: "LINES"}),
            expectImageSrc: 'SuperScope_5.png',
        });
    });

    it('should render very thick lines #1', () => {
        return mainTest({
            preset: makePreset({code, thickness: 25, drawMode: "LINES"}),
            expectImageSrc: 'SuperScope_5.png',
        });
    });

    it('should render very thick lines #2', () => {
        return mainTest({
            preset: makePreset({code: code2, thickness: 25, drawMode: "LINES"}),
            expectImageSrc: 'SuperScope_6.png',
        });
    });
});