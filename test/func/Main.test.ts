import {mainTest} from "./funcTestUtils";

describe("Main", () => {
    it("should render components", () => {
        return mainTest({
            preset: {
                components: [
                    {
                        type: "ClearScreen",
                        color: "#ffff00",
                    },
                    {
                        type: "SuperScope",
                        thickness: 12,
                        code: {
                            perPoint: "x=i*2-1;y=v*0.5",
                        },
                    },
                ],
            },
            expectImageSrc: "Main_0.png",
        });
    });
});
