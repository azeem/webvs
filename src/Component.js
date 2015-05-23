/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function Component(gl, main, parent, options) {
    this.gl = gl;
    this.main = main;
    this.parent = parent;

    this.id = options.id; // TODO: check for id uniqueness
    if(!this.id) {
        this.id = _.uniqueId(this.constructor.Meta.name + "_");
    }
    this.enabled = _.isUndefined(options.enabled)?true:options.enabled;

    this.opts = _.omit(options, ["id", "enabled"]);
    if(this.defaultOptions) {
        this.opts = _.defaults(this.opts, this.defaultOptions);
    }

    this.init();
}
Webvs.Component = Webvs.defineClass(Component, Object, Webvs.ModelLike, {
    init: function() {},

    draw: function() {
        throw new Error("Draw function not implemented");
    },

    destroy: function() {
        this.stopListening();
    },

    setParent: function(newParent) {
        this.parent = newParent;
    },

    toJSON: function() {
        var opts = _.clone(this.opts);
        opts.id = this.id;
        opts.type = this.constructor.Meta.name;
        opts.enabled = this.enabled;
        return opts;
    },

    setAttribute: function(key, value, options) {
        var oldValue = this.get(key);
        if(key == "type" || _.isEqual(value, oldValue)) {
            return false;
        }

        // set the property
        if(key == "enabled") {
            this.enabled = value;
        } else if(key == "id") {
            this.id = value;
        } else {
            this.opts[key] = value;
        }

        // call all onchange handlers
        // we just call these manually here no need to
        // go through event triggers
        if(this.onChange) {
            try {
                var onChange = _.flatten([
                    this.onChange[key] || [],
                    this.onChange["*"] || []
                ]);

                for(var i = 0;i < onChange.length;i++) {
                    this[onChange[i]].call(this, value, key, oldValue);
                }
            } catch(e) {
                // restore old value in case any of the onChange handlers fail
                if(key == "enabled") {
                    this.enabled = oldValue;
                } else if(key == "id") {
                    this.id = oldValue;
                } else {
                    this.opts[key] = oldValue;
                }

                this.lastError = e;
                this.trigger("error:" + key, this, value, options, e);
            }
        }

        return true;
    },

    get: function(key) {
        if(key == "enabled") {
            return this.enabled;
        } else if(key == "id") {
            return this.id;
        } else {
            return this.opts[key];
        }
    },

    getPath: function() {
        if(!_.isUndefined(this.parent) && !_.isUndefined(this.id)) {
            return this.parent.getIdString() + "/" + this.componentName + "#" + this.id;
        } else {
            return this.componentName + "#Main";
        }
    }
});

})(Webvs);
