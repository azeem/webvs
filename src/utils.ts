import flow from "lodash-es/flow";
import map from "lodash-es/map";
import { default as pr } from "lodash-es/partialRight";
import takeRight from "lodash-es/takeRight";

/**
 * A No-Op function
 */
// tslint:disable-next-line:no-empty
export function noop() {}

/**
 * Checks if an object contains the required properties. Throws an error
 * for missing options
 * @param options the options to be checked
 * @param requiredOptions set of required options
 */
export function checkRequiredOptions(options: any, requiredOptions: string[]): void {
    for (const optionName of requiredOptions) {
        if (!(optionName in options)) {
            throw new Error("Required option " + optionName + " not found");
        }
    }
}

/**
 * Returns a floating point value representation of a number
 * embeddable in glsl shader code
 * @param val value to be converted
 */
export function glslFloatRepr(val): string {
    return val + (parseFloat(val) % 1 === 0 ? ".0" : "");
}

/**
 * Color type. R, G, B
 */
export type Color = [number, number, number];
/**
 * Checks whether the argument is a Color or not
 * @param color color to be checked
 */
function isColor(color: string | Color): color is Color {
    return Array.isArray(color) && color.length === 3;
}

/**
 * Parse css color string #RRGGBB or rgb(r, g, b)
 * @param color the color value to be parsed
 */
export function parseColor(color: string | Color): Color {
    if (isColor(color)) {
        return color;
    } else {
        color = color.toLowerCase();
        let match = color.match(/^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/);
        if (match) {
            return flow([
                pr(takeRight, 3),
                pr(map, (channel) => {
                    return parseInt(channel, 16);
                }),
            ])(match) as Color;
        }

        match = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
        if (match) {
            return flow([
                pr(takeRight, 3),
                pr(map, (channel) => {
                    return Math.min(parseInt(channel, 10), 255);
                }),
            ])(match) as Color;
        }
    }
    throw new Error("Invalid Color Format");
}

/**
 * Parse css color string and return normalizes Color value
 * @param color the color value to be parsed
 */
export function parseColorNorm(color: string | Color): Color {
    return map(parseColor(color), (value) => value / 255) as Color;
}

/**
 * Parses shader error message and displays readable information
 * @param src source of the shader
 * @param error error message
 */
export function logShaderError(src: string, error: string): void {
    const lines = src.split("\n");
    const ndigits = lines.length.toString().length;

    const errorPosMatch = error.match(/(\d+):(\d+)/);
    let errorPos: [number, number];
    if (errorPosMatch) {
        errorPos = [parseInt(errorPosMatch[1], 10), parseInt(errorPosMatch[2], 10)];
    }

    const numberedLines = map(lines, (line, index) => {
        let i;
        let lineNumber = (index + 1) + "";
        for (i = 0; i < (ndigits - lineNumber.length); i++) {
            lineNumber = "0" + lineNumber;
        }

        let errorIndicator = "";
        if (errorPos && errorPos[1] === index + 1) {
            let indent = "";
            for (i = 0; i < errorPos[0] + ndigits + 2; i++) {
                indent += " ";
            }
            errorIndicator = "\n" + indent + "^\n" + indent + error;
        }
        return lineNumber + ": " + line + errorIndicator;
    }).join("\n");

    // tslint:disable-next-line:no-console
    console.log("Shader Error : \n" + numberedLines);
}

/**
 * Blend Modes
 */
export enum BlendMode {
    REPLACE = 1,
    MAXIMUM,
    AVERAGE,
    ADDITIVE,
    SUBTRACTIVE1,
    SUBTRACTIVE2,
    MULTIPLY,
    MULTIPLY2,
    ADJUSTABLE,
    ALPHA,
}

/**
 * Channels
 */
export enum Channels {
    CENTER = 0,
    LEFT,
    RIGHT,
}

/**
 * Source
 */
export enum Source {
    SPECTRUM = 1,
    WAVEFORM,
}

/**
 * Returns a random string of given length
 * @param count number of characters
 * @param chars character set to choose from
 */
export function randString(count: number, chars: string): string {
    const randStr = [];
    chars = chars || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < count; i++) {
        randStr.push(chars.charAt(Math.floor(Math.random() * chars.length)));
    }
    return randStr.join("");
}

/**
 * WebGL data types
 */
export enum WebGLVarType {
    TEXTURE2D = "texture2D",
    _1F = "1f", _2F = "2f", _3F = "3f", _4F = "4f",
    _1I = "1i", _2I = "2i", _3I = "3i", _4I = "4i",
    _1FV = "1fv", _2FV = "2fv", _3FV = "3fv", _4FV = "4fv",
    _1IV = "1iv", _2IV = "2iv", _3IV = "3iv", _4IV = "4iv",
}

export type FloatArray = number[] | Float32Array | Float64Array;
export type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array |
                         Int32Array | Uint32Array | Float32Array | Float64Array;

export function isTypedArray(array: any): array is TypedArray {
    return (
        array instanceof Int8Array ||
        array instanceof Uint8Array ||
        array instanceof Uint8ClampedArray ||
        array instanceof Int16Array ||
        array instanceof Uint16Array ||
        array instanceof Int32Array ||
        array instanceof Uint32Array ||
        array instanceof Float32Array ||
        array instanceof Float64Array
    );
}

/**
 * Clamp number between range
 * @param num number to clamp
 * @param min min value of the range
 * @param max max value of the range
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Returns the value of property given its (dot separated) path in an object
 * @param obj object with the property
 * @param name name of the property
 */
export function getProperty(obj: any, name: string | string[]): any {
    if (typeof name === "string") {
        name = name.split(".");
    }
    const value = obj[name.shift()];
    if (value) {
        if (name.length > 0) {
            return getProperty(value, name);
        } else {
            return value;
        }
    }
}

/**
 * Sets a property, given its (dot separated) path in an object
 * @param obj the object in which the property is to be set
 * @param name name of the property
 * @param value value of the property
 */
export function setProperty(obj: any, name: string | string[], value: any): void {
    if (typeof name === "string") {
        name = name.split(".");
    }
    const propertyName = name.shift();
    if (name.length === 0) {
        obj[propertyName] = value;
    } else {
        setProperty(obj[propertyName], name, value);
    }
}

/**
 * flattens array of strings to single string
 * @param value string or list of strings to be flattened
 * @param sep seprator to flatten the strings with
 */
export function flatString(value: string | string[], sep: string = "\n"): string {
    if (typeof(value) === "string") {
        return value;
    } else {
        return value.join(sep);
    }
}
