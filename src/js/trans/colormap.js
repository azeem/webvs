/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

/**
 * Maps colors to a map based on a key
 */
function ColorMap(options) {
    checkRequiredOptions(options, ["maps"]);
    options = _.defaults(options, {
        key: "RED",
        output: "REPLACE",
        mapCycleMode: "SINGLE",
    });

    var that = this;
    this.maps = options.maps;
    this.currentMap = 0;

    this.mapCycleMode = this.mapCycleModes[options.mapCycleMode];
    if(!this.mapCycleMode) {
        throw new Error("Unknown mapCycleMode " + options.mapCycleMode);
    }

    var keyEq = "";
    switch(options.key) {
        case "RED": keyEq = "srcColor.r"; break;
        case "GREEN": keyEq = "srcColor.g"; break;
        case "BLUE": keyEq = "srcColor.b"; break;
        case "(R+G+B)/2": keyEq = "mod((srcColor.r+srcColor.g+srcColor.b)/2.0, 1.0)"; break;
        case "(R+G+B)/3": keyEq = "(srcColor.r+srcColor.g+srcColor.b)/3.0"; break;
        case "MAX": keyEq = "max(srcColor.r, max(srcColor.g, srcColor.b))"; break;
        default: throw new Error("Unknown colormap key function " + options.key);
    }

    var fragmentSrc = [
        "uniform sampler2D u_colorMap;",
        "void main() {",
        "   vec4 srcColor = getSrcColor();",
        "   setFragColor(texture2D(u_colorMap, vec2(("+keyEq+"), 0)));",
        "}"
    ].join("\n");

    this.outputBlendMode = blendModes[options.output];

    ColorMap.super.constructor.call(this, fragmentSrc);
}
extend(ColorMap, QuadBoxComponent, {
    swapFrame: true,
    mapCycleModes: {
        SINGLE: 1,
        ONBEATRANDOM: 2,
        ONBEATSEQUENTIAL: 3
    },

    init: function() {
        var gl = this.gl;
        var that = this;
        this.colorMaps = _.map(this.maps, function(map) {
            return that._buildColorMap(map);
        });
        this.currentMap = 0;
        this.colorMapLocation = gl.getUniformLocation(this.program, "u_colorMap");
        ColorMap.super.init.apply(this, arguments);
    },

    update: function() {
        var gl = this.gl;
        if(this.analyser.beat) {
            switch(this.mapCycleMode) {
                case this.mapCycleModes.ONBEATRANDOM:
                    this.currentMap = Math.floor(Math.random()*this.colorMaps.length);
                    break;
                case this.mapCycleModes.ONBEATSEQUENTIAL:
                    this.currentMap = (this.currentMap+1)%this.colorMaps.length;
                    break;
            }
        }
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.colorMaps[this.currentMap]);
        gl.uniform1i(this.colorMapLocation, 1);

        ColorMap.super.update.apply(this, arguments);
    },

    _buildColorMap: function(map) {
        var gl = this.gl;
        map = _.sortBy(map, function(mapItem) {return mapItem.index;});

        // check for repeated indices
        var indices = _.map(map, function(mapItem) {return mapItem.index;});
        if(_.uniq(indices).length != indices.length) {
            throw new Error("map cannot have repeated indices");
        }

        // add a cap entries at the ends
        var first = _.first(map);
        if(first.index !== 0) {
            map.splice(0, 0, {color:first.color, index:0});
        }
        var last = _.last(map);
        if(last.index !== 255) {
            map.push({color:last.color, index:255});
        }

        map = _.map(map, function(mapItem) {
            var color = parseColor(mapItem.color);
            return {color:color, index:mapItem.index};
        });

        // lerp intermediate values
        var colorMap = new Uint8Array(256*4);
        var cmi = 0;
        var pairs = _.zip(_.first(map, map.length-1), _.last(map, map.length-1));
        _.each(pairs, function(pair, i) {
            var first = pair[0];
            var second = pair[1];
            var steps = second.index - first.index;
            var colorStep = [
                (second.color[0] - first.color[0])/steps,
                (second.color[1] - first.color[1])/steps,
                (second.color[2] - first.color[2])/steps
            ];
            _.times(steps, function(i) {
                colorMap[cmi++] = (first.color[0] + colorStep[0]*i);
                colorMap[cmi++] = (first.color[1] + colorStep[1]*i);
                colorMap[cmi++] = (first.color[2] + colorStep[2]*i);
                colorMap[cmi++] = 255;
            });
        });
        colorMap[cmi++] = last.color[0];
        colorMap[cmi++] = last.color[1];
        colorMap[cmi++] = last.color[2];
        colorMap[cmi++] = 255;

        // put the color values into a 256x1 texture
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, colorMap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        return texture;
    }
});
ColorMap.ui = {
    disp: "Color Map",
    type: "ColorMap",
    schema: {
        maps: {
            type: "array",
            items: {
                type: "array",
                title: "Map",
                items: {
                    type: "object",
                    properties: {
                        color: {
                            type: "string",
                            title: "Color",
                            format: "color",
                            default: "#FFFFFF"
                        },
                        index: {
                            type: "number",
                            title: "Index",
                            minimum: 0,
                            maximum: 255,
                        }
                    }
                }
            }
        },
        key: {
            type: "string",
            title: "Map key",
            enum: ["RED", "GREEN", "BLUE", "(R+G+B)/2", "(R+G+B)/3", "MAX"],
            default: "RED"
        },
        mapCycleMode: {
            type: "string",
            title: "Map Cycle Mode",
            enum: ["SINGLE", "ONBEATRANDOM", "ONBEATSEQUENTIAL"],
            default: "SINGLE"
        },
        output: {
            type: "string",
            title: "Output blend mode",
            enum: _.keys(blendModes),
            default: "REPLACE"
        }
    }
};

window.Webvs.ColorMap = ColorMap;
