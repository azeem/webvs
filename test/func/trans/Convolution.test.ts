import { mainTest } from "../funcTestUtils";

describe('Convolution', () => {
    it('should apply pattern', () => {
        return mainTest({
            preset: {
                components: [
                    {
                        type: "SuperScope",
                        drawMode: "DOTS",
                        thickness: 1,
                        code: {
                            init: "n=1",
                            perPoint: [
                                "x=0;y=0;",
                                "red=0;green=1;blue=1;"
                            ]
                        },
                    },
                    {
                        type: "Convolution",
                        kernel: [ // @QOAL's smiley test
                            1,1,1,0,0,0,1,1,1,
                            1,1,1,0,0,0,1,1,1,
                            1,1,1,0,0,0,1,1,1,
                            1,1,1,0,0,0,1,1,1,
                            1,1,1,0,0,0,1,1,1,
                            1,1,1,0,0,0,1,1,1,
                            1,1,1,1,1,1,1,1,1,
                            1,1,1,1,1,1,1,1,1,
                            1,1,1,1,1,1,1,1,1,
                        ],
                        scale: 1,
                        autoScale: false
                    }
                ]
            },
            expectImageSrc: 'Convolution_0.png',
            mismatchThreshold: 50,
            frameCount: 1
        })
    });
});