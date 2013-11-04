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
        var that = this;
        // bind all values
        var toBeBound = _.difference(_.keys(this), this._treatAsNonUniform);
        _.each(toBeBound, function(name) {
            var value = that[name];
            if(typeof value !== "number") { return; }
            program.setUniform(name, "1f", value);
        });

        // bind registers
        _.each(this._registerUsages, function(name) {
            program.setUniform(name, "1f", this._registerBank[name]);
        });

        // bind random step value if there are usages of random
        if(this.hasRandom) {
            var step = [Math.random()/100, Math.random()/100];
            program.setUniform("__randStep", "2fv", step);
        }

        // bind time values for gettime calls
        if(this.hasGettime) {
            var time0 = ((new Date()).getTime()-this._bootTime)/1000;
            program.setUniform("__gettime0", "1f", time0);
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
            program.setUniform(item[1], "1f", result);
        });
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

        this.w = main.canvas.width;
        this.h = main.canvas.height;
        this.cid = parent.cloneId || 0;

        // clear all used registers
        _.each(this._registerUsages, function(name) {
            if(!_.has(main.registerBank, name)) {
                main.registerBank[name] = 0;
            }
        });
    }
});


})(Webvs);
