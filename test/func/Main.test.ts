import {mainTest} from "./funcTestUtils";

describe("Main", () => {
    it("should render components", () => {
        return mainTest({
            expectImageSrc: "Main_0.png",
            mismatchThreshold: 20,
            preset: {
                components: [
                    {
                        color: "#ffff00",
                        type: "ClearScreen",
                    },
                    {
                        code: {
                            perPoint: "x=i*2-1;y=v*0.5",
                        },
                        thickness: 12,
                        type: "SuperScope",
                    },
                ],
            },
        });
    });
});
