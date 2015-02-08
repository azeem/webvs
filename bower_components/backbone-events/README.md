Backbone Events Mixin
---------------------

`Backone.Events` mixin separated out for standalone use.

Example:

    var object = {};

    _.extend(object, Events);

    object.on("alert", function(msg) {
      alert("Triggered " + msg);
    });

    object.trigger("alert", "an event");

Events documentation: http://backbonejs.org/#Events
Backbone home page: http://backbonejs.org/
Backbone source: https://github.com/jashkenas/backbone