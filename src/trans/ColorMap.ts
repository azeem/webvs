import each from "lodash-es/each";
import filter from "lodash-es/filter";
import first from "lodash-es/first";
import last from "lodash-es/last";
import sortBy from "lodash-es/sortBy";
import take from "lodash-es/take";
import takeRight from "lodash-es/takeRight";
import times from "lodash-es/times";
import uniq from "lodash-es/uniq";
import zip from "lodash-es/zip";
import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import { BlendMode, Color, parseColor, WebGLVarType } from "../utils";
import RenderingContext from "../webgl/RenderingContext";
import ShaderProgram from "../webgl/ShaderProgram";

/**
 * Color Map Item for [[IColorMapDef]]
 */
export interface IColorMapItem {
    position: number;
    color: string;
}

/**
 * A single Color Map (a list of colors with position) for [[IcolorMapOpts]]
 */
export interface IColorMapDef {
    /**
     * If true the color map can be chosen through one of the
     * [[ColorMapCycleMode]]s.
     */
    enabled: boolean;
    /**
     * Colors and their position in the [[ColorMapKey]] space
     */
    colors: IColorMapItem[];
}

/**
 * Options for [[ColorMap]] component
 */
export interface IColorMapOpts {
    /**
     * Key by which color should be mapped. see [[ColorMapKey]]
     */
    key: string;
    /**
     * Output blending mode. see [[BlendMode]]
     */
    blendMode: string;
    /**
     * Color map cycling mode. see [[ColorMapCycleMode]]
     */
    mapCycleMode: string;
    /**
     * Color map items
     */
    maps: IColorMapDef[];
}

/**
 * Color mapping key for [[ColorMap]] component
 */
enum ColorMapKey {
    RED = 0,
    GREEN,
    BLUE,
    "(R+G+B)/2",
    "(R+G+B)/3",
    MAX,
}

/**
 * Color map cycling modes for [[ColorMap]] component
 */
enum ColorMapCycleMode {
    SINGLE = 0,
    ONBEATRANDOM,
    ONBEATSEQUENTIAL,
}

/**
 * A component that changes colors according to a gradient map using
 * a key generated from the source colors
 */
export default class ColorMap extends Component {
    public static componentName: string = "ColorMap";
    public static componentTag: string = "trans";
    protected static optUpdateHandlers = {
        blendMode: "updateBlendMode",
        key: "updateKey",
        mapCycleMode: "updateCycleMode",
        maps: "updateMap",
    };
    protected static defaultOptions: IColorMapOpts = {
        blendMode: "REPLACE",
        key: "RED",
        mapCycleMode: "SINGLE",
        maps: [
            {
                colors: [
                    {position: 0, color: "#000000"},
                    {position: 255, color: "#FFFFFF"},
                ],
                enabled: true,
            },
        ],
    };

    protected opts: IColorMapOpts;
    private program: ShaderProgram;
    private mapCycleMode: ColorMapCycleMode;
    private currentMap: ColorMapKey;
    private colorMaps: WebGLTexture[];
    private blendMode: BlendMode;
    private key: ColorMapKey;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.program = new ShaderProgram(this.main.getRctx(), {
            bindings: {
                uniforms: {
                    colorMap: { name: "u_colorMap", valueType: WebGLVarType.TEXTURE2D },
                    key:      { name: "u_key", valueType: WebGLVarType._1I },
                },
            },
            dynamicBlend: true,
            fragmentShader: `
                uniform int u_key;
                uniform sampler2D u_colorMap;
                void main() {
                   vec4 srcColor = getSrcColor();
                   float key;
                   if(u_key == ${ColorMapKey.RED}          ) { key = srcColor.r; }
                   if(u_key == ${ColorMapKey.GREEN}        ) { key = srcColor.g; }
                   if(u_key == ${ColorMapKey.BLUE}         ) { key = srcColor.b; }
                   if(u_key == ${ColorMapKey["(R+G+B)/2"]} ) { key = min((srcColor.r+srcColor.g+srcColor.b)/2.0, 1.0); }
                   if(u_key == ${ColorMapKey["(R+G+B)/3"]} ) { key = (srcColor.r+srcColor.g+srcColor.b)/3.0; }
                   if(u_key == ${ColorMapKey.MAX}          ) { key = max(srcColor.r, max(srcColor.g, srcColor.b)); }
                   setFragColor(texture2D(u_colorMap, vec2(key, 0)));
                }
            `,
            swapFrame: true,
        });
        this.updateMap();
        this.updateKey();
        this.updateCycleMode();
        this.updateBlendMode();
    }

    public draw() {
        if (this.main.getAnalyser().isBeat()) {
            if (this.mapCycleMode ===  ColorMapCycleMode.ONBEATRANDOM) {
                this.currentMap = Math.floor(Math.random() * this.opts.maps.length);
            } else if (this.mapCycleMode === ColorMapCycleMode.ONBEATSEQUENTIAL) {
                this.currentMap = (this.currentMap + 1) % this.colorMaps.length;
            }
        }
        this.program.run(
            this.parent.getTSM(),
            {
                colorMap: this.colorMaps[this.currentMap],
                key: this.key,
            },
            this.blendMode,
        );
    }

    public destroy() {
        super.destroy();
        this.program.destroy();
        each(this.colorMaps, (tex) => {
            this.main.getRctx().getGl().deleteTexture(tex);
        });
    }

    private updateMap() {
        if (this.colorMaps) {
            each(this.colorMaps, (tex) => {
                this.main.getRctx().getGl().deleteTexture(tex);
            });
        }
        this.colorMaps = filter(this.opts.maps, "enabled").map((colorMap) => this._buildColorMap(colorMap.colors));
        this.currentMap = 0;
    }

    private updateCycleMode() {
        this.mapCycleMode = ColorMapCycleMode[this.opts.mapCycleMode];
    }

    private updateKey() {
        this.key = ColorMapKey[this.opts.key];
    }

    private updateBlendMode() {
        this.blendMode = BlendMode[this.opts.blendMode];
    }

    private _buildColorMap(mapItems: IColorMapItem[]): WebGLTexture {
        const gl = this.main.getRctx().getGl();
        mapItems = sortBy(mapItems, (mapItem) => mapItem.position);

        // check for repeated positions
        const positions = mapItems.map((mapItem) => mapItem.position);
        if (uniq(positions).length !== positions.length) {
            throw new Error("map cannot have repeated positions");
        }

        // parse all the colors
        const parsedMap = mapItems.map((mapItem) => {
            const color = parseColor(mapItem.color);
            return {color, position: mapItem.position};
        });

        // add a cap entries at the ends
        const firstMap = first(parsedMap);
        if (firstMap.position !== 0) {
            parsedMap.splice(0, 0, {color: firstMap.color, position: 0});
        }
        const lastMap = last(parsedMap);
        if (lastMap.position !== 255) {
            parsedMap.push({color: lastMap.color, position: 255});
        }

        // lerp intermediate values
        const colorMap = new Uint8Array(256 * 3);
        let cmi = 0;
        const pairs = zip(take(parsedMap, parsedMap.length - 1), takeRight(parsedMap, parsedMap.length - 1));
        each(pairs, (pair) => {
            const firstItem = pair[0];
            const secondItem = pair[1];
            const steps = secondItem.position - firstItem.position;
            times(steps, (i) => {
                colorMap[cmi++] = Math.floor((firstItem.color[0] * (steps - i) + secondItem.color[0] * i) / steps);
                colorMap[cmi++] = Math.floor((firstItem.color[1] * (steps - i) + secondItem.color[1] * i) / steps);
                colorMap[cmi++] = Math.floor((firstItem.color[2] * (steps - i) + secondItem.color[2] * i) / steps);
            });
        });
        colorMap[cmi++] = lastMap.color[0];
        colorMap[cmi++] = lastMap.color[1];
        colorMap[cmi++] = lastMap.color[2];

        // put the color values into a 256x1 texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 256, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, colorMap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return texture;
    }
}
