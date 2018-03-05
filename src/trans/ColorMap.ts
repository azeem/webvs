import * as _ from "lodash";
import Component, { IContainer } from "../Component";
import IMain from "../IMain";
import { BlendModes, Color, parseColor, WebGLVarType } from "../utils";
import RenderingContext from "../webgl/RenderingContext";
import ShaderProgram from "../webgl/ShaderProgram";

export interface ColorMapItem {index: number; color: string; }
export interface ColorMapOpts {
    key: string;
    output: string;
    mapCycleMode: string;
    maps: ColorMapItem[][];
}

enum MapKey {
    RED = 0,
    GREEN,
    BLUE,
    "(R+G+B)/2",
    "(R+G+B)/3",
    MAX,
}

enum MapCycleModes {
    SINGLE = 0,
    ONBEATRANDOM,
    ONBEATSEQUENTIAL,
}

// a component that changes colors according to a gradient map using
// a key generated from the source colors
export default class ColorMap extends Component {
    public static componentName: string = "ColorMap";
    public static componentTag: string = "trans";
    protected static optUpdateHandlers = {
        maps: "updateMap",
        key: "updateKey",
        mapCycleMode: "updateCycleMode",
        output: "updateBlendMode",
    };
    protected static defaultOptions: ColorMapOpts = {
        key: "RED",
        output: "REPLACE",
        mapCycleMode: "SINGLE",
        maps: [
            [
                {index: 0, color: "#000000"},
                {index: 255, color: "#FFFFFF"},
            ],
        ],
    };

    protected opts: ColorMapOpts;
    private program: ShaderProgram;
    private mapCycleMode: MapCycleModes;
    private currentMap: MapKey;
    private colorMaps: WebGLTexture[];
    private blendMode: BlendModes;
    private key: MapKey;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    public init() {
        this.program = new ShaderProgram(this.main.rctx, {
            dynamicBlend: true,
            swapFrame: true,
            bindings: {
                uniforms: {
                    key:      { name: "u_key", valueType: WebGLVarType._1I },
                    colorMap: { name: "u_colorMap", valueType: WebGLVarType.TEXTURE2D },
                },
            },
            fragmentShader: `
                uniform int u_key;
                uniform sampler2D u_colorMap;
                void main() {
                   vec4 srcColor = getSrcColor();
                   float key;
                   if(u_key == ${MapKey.RED}          ) { key = srcColor.r; }
                   if(u_key == ${MapKey.GREEN}        ) { key = srcColor.g; }
                   if(u_key == ${MapKey.BLUE}         ) { key = srcColor.b; }
                   if(u_key == ${MapKey["(R+G+B)/2"]} ) { key = min((srcColor.r+srcColor.g+srcColor.b)/2.0, 1.0); }
                   if(u_key == ${MapKey["(R+G+B)/3"]} ) { key = (srcColor.r+srcColor.g+srcColor.b)/3.0; }
                   if(u_key == ${MapKey.MAX}          ) { key = max(srcColor.r, max(srcColor.g, srcColor.b)); }
                   setFragColor(texture2D(u_colorMap, vec2(key, 0)));
                }
            `,
        });
        this.updateMap();
        this.updateKey();
        this.updateCycleMode();
        this.updateBlendMode();
    }

    public draw() {
        if (this.main.analyser.beat) {
            if (this.mapCycleMode ==  MapCycleModes.ONBEATRANDOM) {
                this.currentMap = Math.floor(Math.random() * this.opts.maps.length);
            } else if (this.mapCycleMode == MapCycleModes.ONBEATSEQUENTIAL) {
                this.currentMap = (this.currentMap + 1) % this.colorMaps.length;
            }
        }
        this.program.run(
            this.parent.fm,
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
        _.each(this.colorMaps, (tex) => {
            this.main.rctx.gl.deleteTexture(tex);
        });
    }

    private updateMap() {
        if (this.colorMaps) {
            _.each(this.colorMaps, (tex) => {
                this.main.rctx.gl.deleteTexture(tex);
            });
        }
        this.colorMaps = _.map(this.opts.maps, (map) => this._buildColorMap(map));
        this.currentMap = 0;
    }

    private updateCycleMode() {
        this.mapCycleMode = MapCycleModes[this.opts.mapCycleMode];
    }

    private updateKey() {
        this.key = MapKey[this.opts.key];
    }

    private updateBlendMode() {
        this.blendMode = BlendModes[this.opts.output];
    }

    private _buildColorMap(map: ColorMapItem[]): WebGLTexture {
        const gl = this.main.rctx.gl;
        map = _.sortBy(map, (mapItem) => mapItem.index);

        // check for repeated indices
        const indices = _.map(map, (mapItem) => mapItem.index);
        if (_.uniq(indices).length != indices.length) {
            throw new Error("map cannot have repeated indices");
        }

        // parse all the colors
        const parsedMap = _.map(map, (mapItem) => {
            const color = parseColor(mapItem.color);
            return {color, index: mapItem.index};
        });

        // add a cap entries at the ends
        const first = _.first(parsedMap);
        if (first.index !== 0) {
            parsedMap.splice(0, 0, {color: first.color, index: 0});
        }
        const last = _.last(parsedMap);
        if (last.index !== 255) {
            parsedMap.push({color: last.color, index: 255});
        }

        // lerp intermediate values
        const colorMap = new Uint8Array(256 * 3);
        let cmi = 0;
        const pairs = _.zip(_.take(parsedMap, parsedMap.length - 1), _.takeRight(parsedMap, parsedMap.length - 1));
        _.each(pairs, (pair, i) => {
            const first = pair[0];
            const second = pair[1];
            const steps = second.index - first.index;
            _.times(steps, function(i) {
                colorMap[cmi++] = Math.floor((first.color[0] * (steps - i) + second.color[0] * i) / steps);
                colorMap[cmi++] = Math.floor((first.color[1] * (steps - i) + second.color[1] * i) / steps);
                colorMap[cmi++] = Math.floor((first.color[2] * (steps - i) + second.color[2] * i) / steps);
            });
        });
        colorMap[cmi++] = last.color[0];
        colorMap[cmi++] = last.color[1];
        colorMap[cmi++] = last.color[2];

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
