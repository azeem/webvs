import { mainTest } from "../funcTestUtils";

describe("DynamicMovement", function() {
    function makePreset(opts: any) {
        const dmOpts = Object.assign({
            code: {
                perPixel: "alpha=0.5;d=sin(d*(1+d*sin(r*150)*.15))*.5+d*.5;r=r+.01;",
            },
            type: "DynamicMovement",
        }, opts);
        return {
            components: [
                {
                    code: {
                        init: "n=12",
                        perFrame: "c=0",
                        perPoint: [
                            "x=select(c, 0,    0, 0, 0, -0.5, 0, 0,   0, 0, 0, 0.5, 0);",
                            "y=select(c, 0, -0.5, 0, 0,    0, 0, 0, 0.5, 0, 0,   0, 0);",
                            "red=  select(c, 0,0,0, 1,1,1, 1,1,1, 0,0,0);",
                            "green=select(c, 1,1,1, 1,1,1, 0,0,0, 0,0,0);",
                            "blue= select(c, 0,0,0, 0,0,0, 0,0,0, 1,1,1);",
                            "c=c+1;",
                        ],
                    },
                    type: "SuperScope",
                },
                dmOpts,
            ],
        };
    }

    this.timeout(10000);

    it("should run for noGrid, compat, !blend", () => {
        return mainTest({
            distanceThreshold: 80,
            expectImageSrc: "DynamicMovement_0.png",
            frameCount: 500,
            mismatchThreshold: 100,
            preset: makePreset({noGrid: true, compat: true, blend: false}),
        });
    });

    it("should run for !noGrid, compat, !blend", () => {
        return mainTest({
            distanceThreshold: 80,
            expectImageSrc: "DynamicMovement_1.png",
            frameCount: 500,
            mismatchThreshold: 100,
            preset: makePreset({noGrid: false, compat: true, blend: false}),
        });
    });

    it("should run for !noGrid, !compat, !blend", () => {
        return mainTest({
            distanceThreshold: 80,
            expectImageSrc: "DynamicMovement_2.png",
            frameCount: 500,
            mismatchThreshold: 100,
            preset: makePreset({noGrid: false, compat: false, blend: false}),
        });
    });

    it("should run for !noGrid, !compat, blend", () => {
        return mainTest({
            distanceThreshold: 80,
            expectImageSrc: "DynamicMovement_3.png",
            frameCount: 500,
            mismatchThreshold: 100,
            preset: makePreset({noGrid: false, compat: false, blend: true}),
        });
    });

    it("should run for noGrid, !compat, blend", () => {
        return mainTest({
            distanceThreshold: 80,
            expectImageSrc: "DynamicMovement_4.png",
            frameCount: 500,
            mismatchThreshold: 100,
            preset: makePreset({noGrid: true, compat: false, blend: true}),
        });
    });
});
