import IMain from "../../../src/IMain";
import { mainTest } from "../funcTestUtils";

describe("Picture", () => {
    it("should render image from resource manager", () => {
        return mainTest({
            onInit: (main: IMain) => {
                main.rsrcMan.registerUri("test_image_1.png", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAIAAADZ8fBYAAAAA3NCSVQICAjb4U/gAAACv0lEQVRIidWWMXOiQBTHl5MCFkmbdEuHRdLImNglHwf5JEZLZQgpTT5EZjRWzliRxi/AxnEgnYwJycCye8XLeGfO00h19xoY3s5v//v27f5B6P8KaXda1/V6vV6v1w3DwBinaUopDYLg6elptVqVmZAQ0m63wzDM85xzzjkXQsBLnudhGLbbbULIAURZlm3bjqIIWIyxxWIxnU6Hw+F0Ol0sFowxmCOKItu2ZVneD1UUxfO8LMs450mSuK7bbDYxxpIkIYQkScIYN5tN13WTJOGcZ1nmeZ6qqnuUep7HGOOcj8fjWq22Y3CtVnt8fOScF0Vxc3OzS7Vt26D0/v5e07S9i9M07e7uDlS3Wq3tgwghUNPxePwd6BoNqqMo2r6N19fXUNPdy/8zTNOEWnc6na85XdfDMBRCuK57EBTCdV0hBKVU1/WNxOXlZZ7njLGLi4sS3PPzc8ZYnudXV1fw5Qc8LMuqVCovLy+z2awEdzabxXFcqVQsy9rgGoaBEKKUvr+/l+B+fHw8Pz8jhNZb98mFzn99fRVClOAKIVarlSRJ60b65KZpKoSoVqtwrg4NSZKq1aoQIk3TDW4YhrAKRVFKcBVFgQoA5xc3CIKiKI6Pj8/OzkpwT09PT05OiqIIgmAjoes6pVQI0e/3S3D7/f72/kUIdTodOG+maR4ENU1zuVxuP28IIUJIHMec89FohDH+JhRjPBwOOedxHEOzbolWqwX32WAw+A4aYzwYDOA+cxznr+NkWfZ9vygKUL27IKZpjkYjuH9939/jGqqq+r4PqpfLZa/XazQaqqr+7heNRqPX60FNsyy7vb3d4xdr1Y7jQK3B3+bz+WQyeXh4mEwm8/l87W9xHDuO8y1/W4dhGN1ul1IKtvTFjyml3W73rxu19//h6OjIsizLsgghmqa9vb2t/x+SJDlA5r8ePwEtX9iShlMEzwAAAABJRU5ErkJggg==");
            },
            preset: {
                components: [
                    {
                        type: "Picture",
                        x: -0.7, y: -0.7, src: "test_image_1.png",
                    },
                ],
            },
            expectImageSrc: "Picture_0.png",
        });
    });

    it("should render image from builtin resource pack #1", () => {
        return mainTest({
            preset: {
                components: [
                    {
                        type: "Picture",
                        x: 0, y: 0, src: "avsres_texer_square_edgeonly_30x30.bmp",
                    },
                ],
            },
            expectImageSrc: "Picture_1.png",
        });
    });

    it("should render image from builtin resource pack #2", () => {
        return mainTest({
            preset: {
                components: [
                    {
                        type: "Picture",
                        x: -1, y: 0.5, src: "avsres_texer_circle_edgeonly_19x19.bmp",
                    },
                ],
            },
            expectImageSrc: "Picture_2.png",
        });
    });
});
