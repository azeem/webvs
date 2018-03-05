import { mainTest } from "../funcTestUtils";

describe("DynamicMovement", function() {
    function makePreset(opts: any) {
        const dmOpts = Object.assign({
            type: "DynamicMovement",
            code: {
                perPixel: "alpha=0.5;d=sin(d*(1+d*sin(r*150)*.15))*.5+d*.5;r=r+.01;",
            },
        }, opts);
        return {
            components: [
                {
                    type: "SuperScope",
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
                },
                dmOpts,
            ],
        };
    }

    this.timeout(5000);

    it("should run for noGrid, compat, !blend", () => {
        return mainTest({
            preset: makePreset({noGrid: true, compat: true, blend: false}),
            expectImageSrc: "DynamicMovement_0.png",
            distanceThreshold: 10,
            mismatchThreshold: 50,
            frameCount: 500,
        });
    });

    it("should run for !noGrid, compat, !blend", () => {
        return mainTest({
            preset: makePreset({noGrid: false, compat: true, blend: false}),
            expectImageSrc: "DynamicMovement_1.png",
            distanceThreshold: 10,
            mismatchThreshold: 50,
            frameCount: 500,
        });
    });

    it("should run for !noGrid, !compat, !blend", () => {
        return mainTest({
            preset: makePreset({noGrid: false, compat: false, blend: false}),
            expectImageSrc: "DynamicMovement_2.png",
            distanceThreshold: 10,
            mismatchThreshold: 50,
            frameCount: 500,
        });
    });

    it("should run for !noGrid, !compat, blend", () => {
        return mainTest({
            preset: makePreset({noGrid: false, compat: false, blend: true}),
            expectImageSrc: "DynamicMovement_3.png",
            distanceThreshold: 10,
            mismatchThreshold: 50,
            frameCount: 500,
        });
    });

    it("should run for noGrid, !compat, blend", () => {
        return mainTest({
            preset: makePreset({noGrid: true, compat: false, blend: true}),
            expectImageSrc: "DynamicMovement_4.png",
            distanceThreshold: 10,
            mismatchThreshold: 50,
            frameCount: 500,
        });
    });
});
