(function(Webvs) {

function Component(gl, main, parent, options) {
    this.gl = gl;
    this.main = main;
    this.parent = parent;

    var opts = _.clone(options);
    if(this.defaultOptions) {
        opts = _.defaults(opts, this.defaultOptions);
    }
    this.opts = opts;

    this.id = opts.id || Webvs.randString(5);
    this.enabled = _.isUndefined(opts.enabled)?true:opts.enabled;

    this.init();
}
Webvs.Component = Webvs.defineClass(Component, Object, {
    componentName: "Component",

    init: function() {},

    draw: function() {},

    destroy: function() {},

    adopt: function(newParent) {
        this.parent = newParent;
    },

    getOptions: function() {
        return this.opts;
    },

    getOption: function(name) {
        return Webvs.getProperty(this.opts, name);
    },

    setOption: function(name, value) {
        var oldValue = Webvs.getProperty(this.opts, name);

        // set the property
        Webvs.setProperty(this.opts, name, value);
        if(name == "enabled") {
            this.enabled = value;
        }
        if(name == "id") {
            this.id = value;
        }

        // call all onchange handlers
        if(this.onChange) {
            try {
                _.each(this.onChange, function(funcName, key) {
                    if(name.indexOf(key) === 0 || key == "*") {
                        var funcs = _.isArray(funcName)?funcName:[funcName];
                        _.each(funcs, function(func) {
                            this[func].call(this, value, name);
                        }, this);
                    }
                }, this);
            } catch(e) {
                // restore old value in case any of the onChange handlers fail
                Webvs.setProperty(this.opts, name, oldValue);
                throw e;
            }
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
