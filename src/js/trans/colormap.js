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
        onBeatRandom: false
    });

    var that = this;
    this.maps = options.maps;
    this.currentMap = 0;

    this.onBeatRandom = options.onBeatRandom;

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

    ColorMap.super.constructor.call(this, fragmentSrc, blendModes[options.output]);
}
extend(ColorMap, Trans, {
    init: function() {
        var gl = this.gl;
        var that = this;
        this.colorMaps = _.map(this.maps, function(map) {
            return that._buildColorMap(map);
        });
        this.currentMap = 0;
        this.colorMapLocation = gl.getUniformLocation(this.program, "u_colorMap");
        ColorMap.super.init.call(this, arguments);
    },

    update: function() {
        var gl = this.gl;
        if(this.onBeatRandom && this.analyser.beat) {
            this.currentMap = Math.floor(Math.random()*this.colorMaps.length);
        }
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.colorMaps[this.currentMap]);
        gl.uniform1i(this.colorMapLocation, 1);

        Convolution.super.update.apply(this, arguments);
    },

    _buildColorMap: function(map) {
        var gl = this.gl;
        map = _.sortBy(map, function(mapItem) {return mapItem[1];});

        // check for repeated indices
        var indices = _.map(map, function(mapItem) {return mapItem[1];});
        if(_.uniq(indices).length != indices.length) {
            throw new Error("map cannot have repeated indices");
        }

        // add a cap entries at the ends
        var first = _.first(map);
        if(first[1] !== 0) {
            map.splice(0, 0, [first[0], 0]);
        }
        var last = _.last(map);
        if(last[1] !== 255) {
            map.splice(0, 0, [last[0], 255]);
        }

        // lerp intermediate values
        var colorMap = new Uint8Array(256*4);
        var cmi = 0;
        var pairs = _.zip(_.first(map, map.length-1), _.last(map, map.length-1));
        _.each(pairs, function(pair, i) {
            var first = pair[0], second = pair[1];
            var steps = second[1] - first[1];
            var colorStep = [
                (second[0][0] - first[0][0])/steps,
                (second[0][1] - first[0][1])/steps,
                (second[0][2] - first[0][2])/steps
            ];
            _.times(steps, function(i) {
                colorMap[cmi++] = (first[0][0] + colorStep[0]*i);
                colorMap[cmi++] = (first[0][1] + colorStep[1]*i);
                colorMap[cmi++] = (first[0][2] + colorStep[2]*i);
                colorMap[cmi++] = 255;
            });
        });
        colorMap[cmi++] = last[0][0];
        colorMap[cmi++] = last[0][1];
        colorMap[cmi++] = last[0][2];
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

window.Webvs.ColorMap = ColorMap;
