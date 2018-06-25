import { mainTest } from "../funcTestUtils";

describe("UniqueTone", () => {
    function uniqueToneTest(opts: any, expectImageSrc: string) {
        const uniqueToneOpts = Object.assign({
            type: "UniqueTone",
        }, opts);

        return mainTest({
            expectImageSrc,
            frameCount: 2,
            preset: {
                components: [
                    {
                        color: "#008000",
                        type: "ClearScreen",
                    },
                    uniqueToneOpts,
                ],
            },
        });
    }

    it("should run with !invert and REPLACE", () => {
        return uniqueToneTest(
            {color: "#800000", invert: false, blendMode: "REPLACE"},
            "UniqueTone_0.png",
        );
    });

    it("should run with !invert and ADDITIVE", () => {
        return uniqueToneTest(
            {color: "#800000", invert: false, blendMode: "ADDITIVE"},
            "UniqueTone_1.png",
        );
    });

    it("should run with !invert and ADDITIVE", () => {
        return uniqueToneTest(
            {color: "#800000", invert: false, blendMode: "FIFTY_FIFTY"},
            "UniqueTone_2.png",
        );
    });

    it("should run with invert and REPLACE", () => {
        return uniqueToneTest(
            {color: "#800000", invert: true, blendMode: "REPLACE"},
            "UniqueTone_3.png",
        );
    });

    it("should run with invert and ADDITIVE", () => {
        return uniqueToneTest(
            {color: "#800000", invert: true, blendMode: "ADDITIVE"},
            "UniqueTone_4.png",
        );
    });

    it("should run with invert and FIFTY_FIFTY", () => {
        return uniqueToneTest(
            {color: "#800000", invert: true, blendMode: "FIFTY_FIFTY"},
            "UniqueTone_5.png",
        );
    });
});
