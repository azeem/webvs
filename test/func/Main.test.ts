import {mainTest} from './funcTestUtils';


describe('Main', () => {
    it('should render components', () => {
        return mainTest(
            {
                components: [
                    {
                        type: "ClearScreen",
                        color: "#ffff00"
                    },
                    {
                        type: "SuperScope",
                        thickness: 12,
                        code: {
                            perPoint: "x=i*2-1;y=v*0.5"
                        }
                    }
                ]
            },
            '/base/test/func/assert/Main_0.png'
        )
    });
});