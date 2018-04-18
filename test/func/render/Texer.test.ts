import { mainTest, makeSinglePreset } from "../funcTestUtils";

describe("Texer", () => {
    const makePreset = makeSinglePreset.bind(this, "Texer");

    it("should resize texel properly", () => {
        return mainTest({
            expectImageSrc: "Texer_0.png",
            preset: makePreset({
                code: {
                    init: "n=3",
                    perPoint: "x=i;y=0;sizey=i+1;",
                },
                imageSrc: "avsres_texer_circle_edgeonly_29x29.bmp",
                resizing: true,
                wrapAround: true,
            }),
        });
    });

    it("should wraparound properly", () => {
        return mainTest({
            expectImageSrc: "Texer_1.png",
            preset: makePreset({
                code: {
                    init: "n=1",
                    perPoint: "x=-1;y=-1;",
                },
                imageSrc: "avsres_texer_circle_edgeonly_29x29.bmp",
                wrapAround: true,
            }),
        });
    });

    it("should colorfilter properly", () => {
        return mainTest({
            expectImageSrc: "Texer_2.png",
            preset: makePreset({
                code: {
                    init: "n=5",
                    perPoint: "x=i*1.8-.9;y=0;j=abs(x);red=1-j;green=1-abs(.5-j);blue=j;",
                },
                colorFiltering: true,
                imageSrc: "avsres_texer_circle_slightblur_21x21.bmp",
            }),
        });
    });
});
