import { mainTest } from "../funcTestUtils";

describe('FadeOut', () => {
    function makePreset(opts) {
        const fadeOutOpts = Object.assign({
            type: "FadeOut"
        }, opts);
        return {
            components: [
                {
                    type: "SuperScope",
                    thickness: 50,
                    drawMode: "DOTS",
                    code: {
                        init: "n=1",
                        perPoint: [
                            "x=0;",
                            "y=0;",
                            "red  =0;",
                            "green=1;",
                            "blue =1;",
                            "n=0;",
                        ]
                    }
                },
                fadeOutOpts
            ]
        }
    }

    it('should fade to color', () => {
        return mainTest({
            preset: makePreset({speed: 1, color: "#FF0000"}),
            expectImageSrc: 'FadeOut_0.png',
            frameCount: 2
        })
    });

    it('should fade to color at slower speed', () => {
        return mainTest({
            preset: makePreset({speed: 0.1, color: "#FF0000"}),
            expectImageSrc: 'FadeOut_0.png',
            frameCount: 20
        })
    });
});