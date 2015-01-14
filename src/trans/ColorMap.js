/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// a component that changes colors according to a gradient map using
// a key generated from the source colors
function ColorMap(gl, main, parent, opts) {
    ColorMap.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(ColorMap, {
    name: "ColorMap",
    menu: "Trans"
});

var MapKey = {
    "RED": 0,
    "GREEN": 1,
    "BLUE": 2,
    "(R+G+B)/2": 3,
    "(R+G+B)/3": 4,
    "MAX": 5
};
ColorMap.MapKey = MapKey;

var MapCycleModes = {
    "SINGLE": 0,
    "ONBEATRANDOM": 1,
    "ONBEATSEQUENTIAL": 2
};
ColorMap.MapCycleModes = MapCycleModes;

Webvs.defineClass(ColorMap, Webvs.Component, {
    defaultOptions: {
        key: "RED",
        output: "REPLACE",
        mapCycleMode: "SINGLE",
        maps: [
            [
                {index: 0, color: "#000000"},
                {index: 255, color: "#FFFFFF"}
            ]
        ],
    },

    onChange: {
        "maps": "updateMap",
        "key": "updateProgram",
        "mapCycleMode": "updateCycleMode",
        "output": "updateProgram"
    },

    init: function() {
        this.updateProgram();
        this.updateMap();
        this.updateCycleMode();
    },

    draw: function() {
        if(this.main.analyser.beat) {
            if(this.mapCycleMode ==  MapCycleModes.ONBEATRANDOM) {
                this.currentMap = Math.floor(Math.random()*this.opts.maps.length);
            } else if(this.mapCycleMode == MapCycleModes.ONBEATSEQUENTIAL) {
                this.currentMap = (this.currentMap+1)%this.colorMaps.length;
            }
        }
        this.program.run(this.parent.fm, null, this.colorMaps[this.currentMap]);
    },

    destroy: function() {
        this.program.destroy();
        _.each(this.colorMaps, function(tex) {
            this.gl.deleteTexture(tex);
        }, this);
    },

    updateProgram: function() {
        if(this.program) {
            this.program.cleanup();
        }
        var output = Webvs.getEnumValue(this.opts.output, Webvs.BlendModes);
        var key = Webvs.getEnumValue(this.opts.key, MapKey);
        this.program = new Webvs.ColorMapProgram(this.gl, key, output);
    },

    updateMap: function() {
        if(this.colorMaps) {
            _.each(this.colorMaps, function(tex) {
                this.gl.deleteTexture(tex);
            }, this);
        }
        this.colorMaps = _.map(this.opts.maps, function(map) {
            return this._buildColorMap(map);
        }, this);
        this.currentMap = 0;
    },

    updateCycleMode: function() {
        this.mapCycleMode = Webvs.getEnumValue(this.opts.mapCycleMode, MapCycleModes);
    },

    _buildColorMap: function(map) {
        var gl = this.gl;
        map = _.sortBy(map, function(mapItem) {return mapItem.index;});

        // check for repeated indices
        var indices = _.map(map, function(mapItem) {return mapItem.index;});
        if(_.uniq(indices).length != indices.length) {
            throw new Error("map cannot have repeated indices");
        }

        // parse all the colors
        map = _.map(map, function(mapItem) {
            var color = Webvs.parseColor(mapItem.color);
            return {color:color, index:mapItem.index};
        });

        // add a cap entries at the ends
        var first = _.first(map);
        if(first.index !== 0) {
            map.splice(0, 0, {color:first.color, index:0});
        }
        var last = _.last(map);
        if(last.index !== 255) {
            map.push({color:last.color, index:255});
        }

        // lerp intermediate values
        var colorMap = new Uint8Array(256*3);
        var cmi = 0;
        var pairs = _.zip(_.first(map, map.length-1), _.last(map, map.length-1));
        _.each(pairs, function(pair, i) {
            var first = pair[0];
            var second = pair[1];
            var steps = second.index - first.index;
            _.times(steps, function(i) {
                colorMap[cmi++] = Math.floor((first.color[0]*(steps-i) + second.color[0]*i)/steps);
                colorMap[cmi++] = Math.floor((first.color[1]*(steps-i) + second.color[1]*i)/steps);
                colorMap[cmi++] = Math.floor((first.color[2]*(steps-i) + second.color[2]*i)/steps);
            });
        });
        colorMap[cmi++] = last.color[0];
        colorMap[cmi++] = last.color[1];
        colorMap[cmi++] = last.color[2];

        // put the color values into a 256x1 texture
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 256, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, colorMap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return texture;
    }
});

function ColorMapProgram(gl, key, blendMode) {
    var keyEq = "";
    switch(key) {
        case MapKey.RED: keyEq = "srcColor.r"; break;
        case MapKey.GREEN: keyEq = "srcColor.g"; break;
        case MapKey.BLUE: keyEq = "srcColor.b"; break;
        case MapKey["(R+G+B)/2"]: keyEq = "min((srcColor.r+srcColor.g+srcColor.b)/2.0, 1.0)"; break;
        case MapKey["(R+G+B)/3"]: keyEq = "(srcColor.r+srcColor.g+srcColor.b)/3.0"; break;
        case MapKey.MAX: keyEq = "max(srcColor.r, max(srcColor.g, srcColor.b))"; break;
    }

    ColorMapProgram.super.constructor.call(this, gl, {
        blendMode: blendMode,
        swapFrame: true,
        fragmentShader: [
            "uniform sampler2D u_colorMap;",
            "void main() {",
            "   vec4 srcColor = getSrcColor();",
            "   setFragColor(texture2D(u_colorMap, vec2(("+keyEq+"), 0)));",
            "}"
        ]
    });
}
Webvs.ColorMapProgram = Webvs.defineClass(ColorMapProgram, Webvs.QuadBoxProgram, {
    draw: function(colorMap) {
        this.setUniform("u_colorMap", "texture2D", colorMap);
        ColorMapProgram.super.draw.call(this);
    }
});

})(Webvs);
