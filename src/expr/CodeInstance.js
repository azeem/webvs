/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * An object that encapsulates the generated executable code
 * and its state values. Also contains implementations of
 * functions callable from expressions
 * @constructor
 * @memberof Webvs
 */
function CodeInstance() {}
Webvs.CodeInstance = Webvs.defineClass(CodeInstance, Object, {
    /**
     * avs expression rand function
     * @memberof Webvs.CodeInstance#
     */
    rand: function(max) { 
        return Math.floor(Math.random() * max) + 1;
    },

    /**
     * avs expression gettime function
     * @memberof Webvs.CodeInstance#
     */
    gettime: function(startTime) {
        switch(startTime) {
            case 0:
                var currentTime = (new Date()).getTime();
                return (currentTime-this._bootTime)/1000;
            default: throw new Error("Invalid startTime mode for gettime call");
        }
    },

    /**
     * avs expression getosc function
     * @memberof Webvs.CodeInstance#
     */
    getosc: function(band, width, channel) {
        var osc = this._analyser.getWaveform();
        var pos = Math.floor((band - width/2)*(osc.length-1));
        var end = Math.floor((band + width/2)*(osc.length-1));

        var sum = 0;
        for(var i = pos;i <= end;i++) {
            sum += osc[i];
        }
        return sum/(end-pos+1);
    },

    /**
     * bind state values to uniforms
     * @param {Webvs.ShaderProgram} program - program to which the state values 
     *                                        should be bound
     * @memberof Webvs.CodeInstance#
     */
    bindUniforms: function(program) {
        // bind all values
        _.each(this._uniforms, function(name) {
            program.setUniform(name, "1f", this[name]);
        }, this);

        // bind registers
        _.each(this._glslRegisters, function(name) {
            program.setUniform(name, "1f", this._registerBank[name]);
        }, this);

        // bind random step value if there are usages of random
        if(this._hasRandom) {
            var step = [Math.random()/100, Math.random()/100];
            program.setUniform("__randStep", "2fv", step);
        }

        // bind precomputed values
        _.each(this._preCompute, function(entry, name) {
            var args = _.map(_.drop(entry), function(arg) {
                if(_.isString(arg)) {
                    if(arg.substring(0, 5) == "__REG") {
                        return this._registerBank[arg];
                    } else {
                        return this[arg];
                    }
                } else {
                    return arg;
                }
            }, this);
            var result = this[entry[0]].apply(this, args);
            program.setUniform(name, "1f", result);
        }, this);
    },

    /**
     * initializes this codeinstance
     * @param {Webvs.Main} main - webvs main instance
     * @param {Webvs.Component} parent - the component thats using this codeinstance
     * @memberof Webvs.CodeInstance#
     */
    setup: function(main, parent) {
        this._registerBank = main.registerBank;
        this._bootTime = main.bootTime;
        this._analyser = main.analyser;
        this.updateDimVars(parent.gl);

        // clear all used registers
        _.each(this._registerUsages, function(name) {
            if(!_.has(main.registerBank, name)) {
                main.registerBank[name] = 0;
            }
        });
    },

    updateDimVars: function(gl) {
        this.w = gl.drawingBufferWidth;
        this.h = gl.drawingBufferHeight;
    }
});

/**
 * creates an array of clones of code instances
 * @param {Webvs.CodeInstance} codeInst - code instance to be cloned
 * @param {number} count - number of clones required
 * @memberof Webvs.CodeInstance
 * @returns {Array.<Webvs.CodeInstance>} clones
 */
CodeInstance.clone = function(clones, count) {
    if(!_.isArray(clones)) {
        clones.cid = 0;
        clones = [codeInst];
    }

    var clonesLength = clones.length;
    if(clonesLength < count) {
        _.times(count-clonesLength, function(index) {
            var clone = _.clone(clones[0]);
            clone.cid = index+clonesLength;
            clones.push(clone);
        });
    } else if(clonesLength > count) {
        clones = _.first(this.clones, count);
    }
    return clones;
};

/**
 * copies instance values from one code instance to another
 * @param {Webvs.CodeInstance} dest - destination code instance
 * @param {Webvs.CodeInstance} src - source code instance
 */
CodeInstance.copyValues = function(dest, src) {
    _.each(src, function(name, value) {
        if(!_.isFunction(value) && name.charAt(0) !== "_") {
            dest[name] = value;
        }
    });
};


})(Webvs);
