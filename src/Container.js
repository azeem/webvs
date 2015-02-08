/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {


// A base class for all components that can have sub components.
// Manages, cloning and component tree operations
function Container(gl, main, parent, opts) {
    Container.super.constructor.call(this, gl, main, parent, opts);
    delete this.opts.components;
}
Webvs.Container = Webvs.defineClass(Container, Webvs.Component, {
    init: function(gl, main, parent) {
        var components = [];
        if(this.opts.components) {
            for(var i = 0;i < this.opts.components.length;i++) {
                var opts = this.opts.components[i];
                var component = new (Webvs.getComponentClass(opts.type))(this.gl, this.main, this, opts);
                components.push(component);
            }
        }
        this.components = components;
    },

    destroy: function() {
        Container.super.destroy.call(this);
        for(var i = 0;i < this.components.length;i++) {
            this.components[i].destroy();
        }
    },
    
    createComponent: function(opts) {
        return (new (Webvs.getComponentClass(opts.type))(this.gl, this.main, this, opts));
    },
    
    // Adds a component as child of the given parent that
    // resides under this containers subtree
    addComponent: function(componentOpts, pos, options) {
        var component;
        if(componentOpts instanceof Webvs.Component) {
            component = componentOpts;
            component.setParent(this);
        } else {
            component = this.createComponent(componentOpts);
        }
        if(!_.isNumber(pos)) {
            pos = this.components.length;
        }
        this.components.splice(pos, 0, component);

        options = _.defaults({pos: pos}, options);
        this.trigger("addComponent", component, this, options);
        return component;
    },

    detachComponent: function(pos, options) {
        if(_.isString(pos)) {
            var id = pos;
            var i;
            for(i = 0;i < this.components.length;i++) {
                if(this.components[i].id == id) {
                    pos = i;
                    break;
                }
            }
            if(i == this.components.length) {
                return;
            }
        }
        var component = this.components[pos];
        this.components.splice(pos, 1);

        options = _.defaults({pos: pos}, options);
        this.trigger("detachComponent", component, this, options);
        return component;
    },

    findComponent: function(id) {
        var i;
        for(i = 0;i < this.components.length;i++) {
            var component = this.components[i];
            if(component.id == id) {
                return component;
            }
        }

        // search in any subcontainers
        for(i = 0;i < this.components.length;i++) {
            var container = this.components[i];
            if(!(container instanceof Container)) {
                continue;
            }
            var subComponent = container.findComponent(id);
            if(subComponent) {
                return subComponent;
            }
        }
    },

    // Constructs complete options object for this container and its
    // subtree
    toJSON: function() {
        var opts = Container.super.toJSON.call(this);

        opts.components = [];
        for(var i = 0;i < this.components.length;i++) {
            opts.components.push(this.components[i].toJSON());
        }
        return opts;
    }
});

})(Webvs);
