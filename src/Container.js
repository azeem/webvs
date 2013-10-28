/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function Container(options) {
    Webvs.checkRequiredOptions(options, ["components"]);
    this._constructComponents(options.components);
    Container.super.constructor.call(this, options);
}
Webvs.Container = Webvs.defineClass(Container, Webvs.Component, {
    _constructComponents: function(optList) {
        var components = [];
        var that = this;
        // construct components from JSON
        _.each(optList, function(componentOptions, i) {
            if(typeof componentOptions.enabled === "boolean" && !componentOptions.enabled) {
                return;
            }
            var type = componentOptions.type;
            var cloneCount = typeof componentOptions.clone === "undefined"?1:componentOptions.clone;
            _.times(cloneCount, function(cloneId) {
                var component = new Webvs[type](componentOptions);
                component.cloneId = cloneId;
                components.push(component);
            });
        });
        this.components = components;
    },

    init: function(gl, main, parent) {
        Container.super.init.call(this, gl, main, parent);

        // initialize all the sub components
        var components = this.components;
        var initPromises = [];
        for(var i = 0;i < components.length;i++) {
            var res = components[i].init(gl, main, this);
            if(res) {
                initPromises.push(res);
            }
        }

        return Webvs.joinPromises(initPromises);
    },

    destroy: function() {
        Container.super.destroy.call(this);
        _.each(this.components, function(component) {
            component.destroy();
        });
    },

    /**
     * Returns the sub components in this component. Default
     * implementation returns empty list. Override and implement
     * if component has sub components.
     * @memberof Webvs.Component
     * @returns {Array.<Webvs.Component>} sub components in this component
     */
    getChildren: function() {
        return [];
    },

    addChild: function(component) {}
});

})(Webvs);
