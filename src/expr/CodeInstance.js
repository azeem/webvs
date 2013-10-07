/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * An object that encapsulated, Generated executable code
 * and its state values. Also contains implementations of
 * functions callable from expressions
 * @constructor
 */
function CodeInstance() {}
Webvs.CodeInstance = Webvs.defineClass(CodeInstance, Object, {
    rand: function(max) { 
        return Math.floor(Math.random() * max) + 1;
    },

    gettime: function(startTime) {
        switch(startTime) {
            case 0:
                var currentTime = (new Date()).getTime();
                return (currentTime-this._bootTime)/1000;
            default: throw new Error("Invalid startTime mode for gettime call");
        }
    },

    getosc: function(band, width, channel) {
        var osc = this._analyser.getWaveform();
        var pos = Math.floor((band - width/2)*osc.length);
        var end = Math.floor((band + width/2)*osc.length);

        var sum = 0;
        for(var i = pos;i <= end;i++) {
            sum += osc[i];
        }
        return sum/(end-pos+1);
    },

    _locationCache: {},
    _getLocation: function(program, gl, name) {
        var location = this._locationCache[name];
        if(typeof location === "undefined") {
            location = gl.getUniformLocation(program, name);
            this._locationCache[name] = location;
        }
        return location;
    },

    /**
     * bind state values to uniforms
     * @param gl
     * @param program
     * @param exclude
     */
    bindUniforms: function(gl, program) {
        var that = this;
        // bind all values
        var toBeBound = _.difference(_.keys(this), this._treatAsNonUniform);
        _.each(toBeBound, function(name) {
            var value = that[name];
            if(typeof value !== "number") { return; }
            gl.uniform1f(that._getLocation(program, gl, name), value);
        });

        // bind registers
        _.each(this._registerUsages, function(name) {
            gl.uniform1f(that._getLocation(program, gl, name), this._registerBank[name]);
        });

        // bind random step value if there are usages of random
        if(this.hasRandom) {
            var step = [Math.random()/100, Math.random()/100];
            gl.uniform2fv(this._getLocation(program, gl, "__randStep"), step);
        }

        // bind time values for gettime calls
        if(this.hasGettime) {
            var time0 = ((new Date()).getTime()-this._bootTime)/1000;
            gl.uniform1f(this._getLocation(program, gl, "__gettime0"), time0);
        }

        // bind precomputed values
        _.each(this._preCompute, function(item, index) {
            var args = _.map(_.last(item, item.length-2), function(arg) {
                if(_.isString(arg)) {
                    if(arg.substring(0, 5) == "__REG") {
                        return this._registerBank[arg];
                    } else {
                        return this[arg];
                    }
                } else {
                    return arg;
                }
            });
            var result = this[item[0]].apply(this, args);
            gl.uniform1f(this._getLocation(program, gl, item[1]), result);
        });
    },

    setup: function(registerBank, bootTime, analyser) {
        this._registerBank = registerBank;
        this._bootTime = bootTime;
        this._analyser = analyser;

        // clear all used registers
        _.each(this._registerUsages, function(name) {
            if(!_.has(registerBank, name)) {
                registerBank[name] = 0;
            }
        });
    }
});


})(Webvs);
