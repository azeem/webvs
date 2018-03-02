import { mainTest } from "../funcTestUtils";

describe.only('UniqueTone', () => {
    function makePreset(opts: any) {
        const uniqueToneOpts = Object.assign({
            type: "UniqueTone"
        }, opts);

        return {
            components: [
                {
                    type: "SuperScope",
                    drawMode: "DOTS",
                    thickness: 50,
                    code: {
                        init: "n=1",
                        perPoint: [
                            "x=0;y=0;",
                            "red=0;green=0.5;blue=0;"
                        ]
                    },
                },
                uniqueToneOpts
            ]
        }
    }

    it('should run with !invert and REPLACE', () => {
        return mainTest({
            preset: makePreset({color: "#800000", invert: false, blendMode: "REPLACE"}),
            expectImageSrc: 'UniqueTone_0.png',
            frameCount: 1
        });
    })

    it('should run with !invert and ADDITIVE', () => {
        return mainTest({
            preset: makePreset({color: "#800000", invert: false, blendMode: "ADDITasdIVE"}),
            expectImageSrc: 'UniqueTone_0.png',
            frameCount: 1
        });
    })
});