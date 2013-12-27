/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

function ResourceManager() {
    this.uris = {};
    this.images = {};
    this.waitCount = 0;
}
Webvs.ResourceManager = Webvs.defineClass(ResourceManager, Object, {
    registerUris: function(uris) {
        if(!_.isArray(uris)) {
            uris = [uris];
        }
        _.each(uris, function(entry) {
            var newUris;
            if("prefix" in entry && "keys" in entry) {
                newUris = _.chain(entry.keys).map(function(key) {
                    return [key, entry.prefix + key];
                }).object().value()
            } else {
                newUris = entry;
            }
            _.extend(this.uris, newUris);
        }, this);
    },

    _loadStart: function() {
        this.waitCount++;
        if(this.waitCount == 1 && this.onWait) {
            this.onWait();
        }
    },

    _loadEnd: function() {
        this.waitCount--;
        if(this.waitCount === 0 && this.onReady) {
            this.onReady();
        }
    },
    
    getImage: function(key, success, error) {
        var this_ = this;
        var image = this.images[key]
        if(image) { // check in cache
            if(success) {
                success(image);
            }
            return;
        }

        // load file
        var uri = this.uris[key];
        if(!uri) {
            throw new Error("Unknown image file " + key);
        }
        image = new Image();
        image.onload = function() {
            this_.images[key] = image;
            if(success) {
                success(image);
            }
            this_._loadEnd();
        };
        if(error) {
            image.onError = function() {
                if(error()) { 
                    // if the error callback returns true 
                    // then we treat this load as complete
                    // and handled properly
                    this_._loadEnd();
                }
            }
        }
        image.src = uri;
        this._loadStart();
    }
});

})(Webvs);
