import { mainTest } from "../funcTestUtils";

// tslint:disable-next-line:only-arrow-functions
describe("Convolution", function() {
    this.timeout(5000);
    it("should apply pattern", () => {
        return mainTest({
            expectImageSrc: "Convolution_0.png",
            frameCount: 1,
            mismatchThreshold: 50,
            preset: {
                components: [
                    {
                        code: {
                            init: "n=1",
                            perPoint: [
                                "x=0;y=0;",
                                "red=0;green=1;blue=1;",
                            ],
                        },
                        drawMode: "DOTS",
                        thickness: 1,
                        type: "SuperScope",
                    },
                    {
                        autoScale: false,
                        kernel: [ // @QOAL's smiley test
                            1, 1, 1, 0, 0, 0, 1, 1, 1,
                            1, 1, 1, 0, 0, 0, 1, 1, 1,
                            1, 1, 1, 0, 0, 0, 1, 1, 1,
                            1, 1, 1, 0, 0, 0, 1, 1, 1,
                            1, 1, 1, 0, 0, 0, 1, 1, 1,
                            1, 1, 1, 0, 0, 0, 1, 1, 1,
                            1, 1, 1, 1, 1, 1, 1, 1, 1,
                            1, 1, 1, 1, 1, 1, 1, 1, 1,
                            1, 1, 1, 1, 1, 1, 1, 1, 1,
                        ],
                        scale: 1,
                        type: "Convolution",
                    },
                ],
            },
        });
    });
});
