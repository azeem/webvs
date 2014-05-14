/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * ResourceManager manages async loading and caching of resources.
 * Basically, it maintains a map of fileNames to URI for the resource.
 * When a request for resource fileName is received, the uri is looked up
 * and the file is either async loaded or served from cache. This also manages
 * a ready state with callbacks that tells when one or more resources are being loaded and
 * when all resources are ready.
 *
 * @param {object|Array[object]} [packs] - object or Array of objects that contains fileNames 
 *                           and location of resource packs
 * @param {string} packs.prefix - a prefix that will be appended to fileNames to form
 *                                                 url for the resources.
 * @param {Array[string]} packs.fileNames - list of resource fileNames
 * @memberof Webvs
 */
function ResourceManager(packs) {
    if(packs) {
        if(!_.isArray(packs)) {
            packs = [packs];
        }
        this.packs = packs;
    } else {
        this.packs = [];
    }
    this.clear();
}
Webvs.ResourceManager = Webvs.defineClass(ResourceManager, Object, Webvs.ModelLike, {
    /**
     * Register a filename and a URI in the resource manager.
     * @param {string|object} fileName - name of the file or object containing fileName to URI map
     * @param {string} uri - uri to the resource. ignored if fileName is an object
     * @memberof Webvs.ResourceManager#
     */
    registerUri: function(fileName, uri) {
        if(_.isString(fileName) && _.isString(uri)) {
            this.uris[fileName] = uri;
        } else {
            _.extend(this.uris, fileName);
        }
    },

    get: function(key, value) {
        if(key == "uris") {
            return this.uris;
        }
    },

    setAttribute: function(key, value, options) {
        if(key == "uris") {
            this.uris = value;
            return true;
        }
        return false;
    },

    toJSON: function() {
        return {
            uris: _.clone(this.uris)
        };
    },

    /**
     * Clears state, uri mappings and caches. Browser caches still apply.
     * @memberof Webvs.ResourceManager#
     */
    clear: function() {
        this.uris = {};
        this.images = {};
        this.waitCount = 0;
        this.ready = true;
    },

    _getUri: function(fileName) {
        var uri = this.uris[fileName];
        if(uri) {
            return uri;
        }
        for(var i = this.packs.length-1;i >= 0;i--) {
            var pack = this.packs[i];
            if(pack.fileNames.indexOf(fileName) != -1) {
                return pack.prefix + fileName;
            }
        }
    },

    _loadStart: function() {
        this.waitCount++;
        if(this.waitCount == 1) {
            this.ready = false;
            this.trigger("wait");
        }
    },

    _loadEnd: function() {
        this.waitCount--;
        if(this.waitCount === 0) {
            this.ready = true;
            this.trigger("ready");
        }
    },
    
    /**
     * Loads an Image resource
     * @param {string} fileName - name of the file
     * @param {Webvs.ResourceManager~successCallback} [success] - callback to be called when the
     *                                                            file becomes available
     * @param {function} [error] - callback to be called when an error occurs in loading. if true
     *                             is returned, then the error is treated as handled and ready state
     *                             changes accordingly
     * @param {object} [context] - the this context for the callbacks
     * @memberof Webvs.ResourceManager#
     */
    getImage: function(fileName, success, error, context) {
        context = context || this;
        var this_ = this;
        var image = this.images[fileName];
        if(image) { // check in cache
            if(success) {
                success.call(context, image);
            }
            return;
        }

        // load file
        var uri = this._getUri(fileName);
        if(!uri) {
            throw new Error("Unknown image file " + fileName);
        }
        image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = function() {
            this_.images[fileName] = image;
            if(success) {
                success.call(context, image);
            }
            this_._loadEnd();
        };
        if(error) {
            image.onError = function() {
                if(error.call(context)) { 
                    // if the error callback returns true 
                    // then we treat this load as complete
                    // and handled properly
                    this_._loadEnd();
                }
            };
        }
        this._loadStart();
        image.src = uri;
    }

    /**
     * This function is called when a resource is successfully loaded
     * @callback Webvs.ResourceManager~successCallback
     * @param {object} resource - the resource that was loaded
     */
});

})(Webvs);
