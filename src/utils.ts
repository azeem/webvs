/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

import * as _ from 'lodash';

export function noop() {}

// Checks if an object contains the required properties
export function checkRequiredOptions(options: any, requiredOptions: string[]): void {
    for(const optionName of requiredOptions) {
        if(!(optionName in options)) {
            throw new Error("Required option " + optionName + " not found");
        }
    }
}

// Returns a floating point value representation of a number
// embeddable in glsl shader code
export function glslFloatRepr(val: string): string {
    return val + (parseFloat(val)%1 === 0?".0":"");
}

export type Color = [number, number, number];
function isColor(color: string | Color): color is Color {
    return Array.isArray(color) && color.length === 3;
}

// Parse css color string #RRGGBB or rgb(r, g, b)
export function parseColor(color: string | Color): Color {
    if(isColor(color)) {
        return color;
    } else {
        color = color.toLowerCase();
        let match = color.match(/^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/);
        if(match) {
            return _.chain(match).takeRight(3).map((channel) => {
                return parseInt(channel, 16);
            }).value() as Color;
        }

        match = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
        if(match) {
            return _.chain(match).takeRight(3).map((channel) => {
                return Math.min(parseInt(channel, 10), 255);
            }).value() as Color;
        }
    }
    throw new Error("Invalid Color Format");
}

// 0-1 normalized version of parseColor
export function parseColorNorm(color: string | Color): Color {
    return _.map(parseColor(color), (value) => value/255) as Color;
}

// Pretty prints a shader compilation error
export function logShaderError(src: string, error: string): void {
    const lines = src.split("\n");
    const ndigits = lines.length.toString().length;

    const errorPosMatch = error.match(/(\d+):(\d+)/);
    let errorPos: [number, number];
    if(errorPosMatch) {
        errorPos = [parseInt(errorPosMatch[1], 10), parseInt(errorPosMatch[2], 10)];
    }

    const numberedLines = _.map(lines, (line, index) => {
        var i;
        var number = (index+1) + "";
        for(i = 0;i < (ndigits-number.length);i++) {
            number = "0" + number;
        }

        var errorIndicator = "";
        if(errorPos && errorPos[1] == index+1) {
            var indent = "";
            for(i = 0;i < errorPos[0]+ndigits+2;i++) {
                indent += " ";
            }
            errorIndicator = "\n" + indent + "^\n" + indent + error;
        }
        return number + ": " + line + errorIndicator;
    }).join("\n");

    console.log("Shader Error : \n" + numberedLines);
}

// Blend mode constants
export enum BlendModes {
    REPLACE = 1,
    MAXIMUM,
    AVERAGE,
    ADDITIVE,
    SUBTRACTIVE1,
    SUBTRACTIVE2,
    MULTIPLY,
    MULTIPLY2,
    ADJUSTABLE,
    ALPHA
}

export enum Channels {
    CENTER = 0,
    LEFT,
    RIGHT
}

export enum Source {
    SPECTRUM = 1,
    WAVEFORM
}

// Returns a random string of given length
export function randString(count: number, chars: string): string {
    const string = [];
    chars = chars || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(let i = 0;i < count;i++) {
        string.push(chars.charAt(Math.floor(Math.random()*chars.length)));
    }
    return string.join("");
}

export enum WebGLVarType {
    TEXTURE2D = 'texture2D',
    _1F = '1f', _2F = '2f', _3F = '3f', _4F = '4f',
    _1I = '1i', _2I = '2i', _3I = '3i', _4I = '4i',
    _1FV = '1fv', _2FV = '2fv', _3FV = '3fv', _4FV = '4fv',
    _1IV = '1iv', _2IV = '2iv', _3IV = '3iv', _4IV = '4iv'
};

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

// Clamps a number between two given numbers
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

// Returns the value of property given its (dot separated) path in an object
export function getProperty(obj: any, name: string | string[]): any {
    if(typeof name === 'string') {
        name = name.split(".");
    }
    const value = obj[name.shift()];
    if(value) {
        if(name.length > 0) {
            return getProperty(value, name);
        } else {
            return value;
        }
    }
}

// Sets a property, given its (dot separated) path in an object
export function setProperty(obj: any, name: string | string[], value: any): void {
    if(typeof name === 'string') {
        name = name.split(".");
    }
    const propertyName = name.shift();
    if(name.length === 0) {
        obj[propertyName] = value;
    } else {
        setProperty(obj[propertyName], name, value);
    }
}