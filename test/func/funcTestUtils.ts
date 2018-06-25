import isNumber from "lodash-es/isNumber";
import uniqueId from "lodash-es/uniqueId";
import AnalyserAdapter from "../../src/analyser/AnalyserAdapter";
import Component from "../../src/Component";
import IMain from "../../src/IMain";
import Main from "../../src/Main";
import { Channels, clamp, glslFloatRepr, noop } from "../../src/utils";
import ShaderProgram from "../../src/webgl/ShaderProgram";

export class MockAnalyser extends AnalyserAdapter {
    private sineData: Float32Array;
    private beat: boolean;

    constructor() {
        super();
        const data = new Float32Array(512);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.sin((i / 512) * Math.PI) * 2 - 1;
        }
        this.sineData = data;
    }

    public setBeat(beat: boolean) {
        this.beat = beat;
    }

    public isBeat() {
        return this.beat;
    }

    // tslint:disable-next-line:no-empty
    public update() {}

    public getSpectrum(channel?: Channels) {
        return this.sineData;
    }
    public getWaveform(channel?: Channels) {
        return this.sineData;
    }
}

interface ITestPatternOpts {
    blue: number;
}

// tslint:disable-next-line:max-classes-per-file
class TestPattern extends Component {
    public static componentName: string = "TestPattern";
    public static componentTag: string = "render";
    protected static optUpdateHandlers = {
        blue: "updateProgram",
    };
    protected static defaultOptions: ITestPatternOpts = {
        blue: 0.5,
    };
    protected opts: ITestPatternOpts;
    private program: ShaderProgram;

    public init() {
        this.updateProgram();
    }

    public draw() {
        this.program.run(this.parent.getTSM(), {});
    }

    private updateProgram() {
        const program = new ShaderProgram(this.main.getRctx(), {
            fragmentShader: `
                void main() {
                   setFragColor(vec4(v_position, ${glslFloatRepr(this.opts.blue)}, 1));
                }
            `,
        });
        if (this.program) {
            this.program.destroy();
        }
        this.program = program;
    }
}

function loadImage(imageSrc: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            resolve(image);
        };
        image.onerror = () => {
            reject(new Error(`Error loading image ${imageSrc}`));
        };
        image.src = imageSrc;
    });
}

function imageFuzzyOk(
    gl: WebGLRenderingContext,
    canvas: HTMLCanvasElement,
    expectImage: HTMLImageElement,
    distanceThreshold: number = 2,
    mismatchThreshold: number = 1,
) {
    distanceThreshold = clamp(distanceThreshold, 0, 255);
    distanceThreshold = Math.pow(distanceThreshold, 2) * 3;
    const width = canvas.width;
    const height = canvas.height;

    // create a temporary canvas for
    // getting image data and drawing diff image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctxt = tempCanvas.getContext("2d", {
        alpha: false,
        preserveDrawingBuffer: true,
    });

    // get source pixels
    const sourcePixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, sourcePixels);

    // get target pixels
    ctxt.drawImage(expectImage, 0, 0);
    const expectDataUrl = tempCanvas.toDataURL();
    const expectPixels = ctxt.getImageData(0, 0, width, height).data;

    // dim down target image in temporary canvas
    ctxt.fillStyle = "rgba(255,255,255,0.85)";
    ctxt.fillRect(0, 0, width, height);

    // red pixel for marking pixel mismatches
    const redPixel = ctxt.createImageData(1, 1);
    redPixel.data[0] = 255;
    redPixel.data[1] = 0;
    redPixel.data[2] = 0;
    redPixel.data[3] = 255;

    let mismatch = 0;
    let maxDistance = 0;
    let mismatchDistanceSum = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const off = y * width * 4 + x * 4;
            const srcOff = (height - 1 - y) * width * 4 + x * 4;
            const rd = expectPixels[off]  - sourcePixels[srcOff];
            const gd = expectPixels[off + 1] - sourcePixels[srcOff + 1];
            const bd = expectPixels[off + 2] - sourcePixels[srcOff + 2];
            const distance = rd * rd + gd * gd + bd * bd;
            maxDistance = Math.max(distance, maxDistance);
            if (distance >= distanceThreshold) {
                ctxt.putImageData(redPixel, x, y); // mark pixel mismatch
                mismatchDistanceSum += distance;
                mismatch++;
            }
        }
    }

    if (mismatch >= mismatchThreshold) {
        // show the diff image
        const errorId = uniqueId();
        const errorElement = document.createElement("span");
        const expectSrc = expectDataUrl;
        const outputSrc = canvas.toDataURL();
        const diffSrc = tempCanvas.toDataURL();
        const averageMismatchDistance = Math.sqrt(mismatchDistanceSum / (mismatch * 3));
        maxDistance = Math.sqrt(maxDistance / 3);
        errorElement.innerHTML = `
            <table style='border:1px solid black;margin:5px;font-family:sans-serif;text-align:center;'>
              <tr>
                  <td colspan='3'>ImageMismatch #${errorId}</td>
              </tr>
              <tr>
                  <td>Expected</td>
                  <td>Received</td>
                  <td>Diff</td>
              </tr>
              <tr>
                  <td><img src='${expectSrc}'/></td>
                  <td><img src='${outputSrc}'/></td>
                  <td><img src='${diffSrc}'/></td>
              </tr>
            </table>
        `;
        document.body.appendChild(errorElement);
        throw new Error([
            `ImageMismatch #${errorId}`,
            `maxDistance: ${maxDistance}`,
            `averageMismatchDistance: ${averageMismatchDistance}`,
            `mismatch: ${mismatch}`,
            `ImageMismatch #${errorId}`,
            `outputSrc: ${outputSrc}`,
            `diffSrc: #${diffSrc}`,
        ].join("\n"));
    }
}

interface IMainTestOpts {
    preset: any;
    expectImageSrc: string;
    onFrame?: (main: IMain, index: number) => void;
    onInit?: (main: IMain) => void;
    frameCount?: number;
    distanceThreshold?: number;
    mismatchThreshold?: number;
}

export async function mainTest(opts: IMainTestOpts) {
    const {preset, expectImageSrc, onFrame, onInit, frameCount = 10} = opts;
    const expectImage = await loadImage("/base/test/func/assert/" + expectImageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = expectImage.width;
    canvas.height = expectImage.height;
    document.body.appendChild(canvas);
    const runMain = new Promise<Main>((resolve, reject) => {
        let main: Main;
        let frameCounter = 0;
        const requestAnimationFrame = (drawCallback) => {
            if (frameCounter === frameCount) {
                resolve(main);
            } else {
                if (onFrame) {
                    onFrame(main, frameCounter);
                }
                window.setTimeout(drawCallback, 0);
            }
            return ++frameCounter;
        };
        // tslint:disable-next-line:no-empty
        const cancelAnimationFrame = () => {};
        const analyser = new MockAnalyser();
        main = new Main({
            analyser, cancelAnimationFrame, canvas, requestAnimationFrame,
        });
        if (onInit) {
            onInit(main);
        }
        main.getComponentRegistry().addComponent(TestPattern);
        main.loadPreset(preset);
        main.start();
    });
    const testMain = await runMain;
    try {
        imageFuzzyOk(testMain.getRctx().getGl(), canvas, expectImage, opts.distanceThreshold, opts.mismatchThreshold);
    } finally {
        testMain.destroy();
        canvas.remove();
    }
}

export function makeSinglePreset(type: string, opts: any, testPatternBlue: number= null) {
    const componentOpts = Object.assign({ type }, opts);
    const components = [
        componentOpts,
    ];
    if (isNumber(testPatternBlue)) {
        components.unshift({
            blue: testPatternBlue,
            type: "TestPattern",
        });
    }
    return { components };
}
