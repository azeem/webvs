import * as _ from "lodash";
import Model from "./Model";

export interface Pack {
    name: string;
    prefix: string;
    fileNames: string[];
}

// ResourceManager manages async loading and caching of resources.
// Basically, it maintains a map of fileNames to URI for the resource.
// When a request for resource fileName is received, the uri is looked up
// and the file is either async loaded or served from cache. This also manages
// a ready state with callbacks that tells when one or more resources are being loaded and
// when all resources are ready.
export default class ResourceManager extends Model {
    private packs: Pack[];
    private uris: {[key: string]: string} = {};
    private images: {[key: string]: HTMLImageElement} = {};
    private waitImages: {[key: string]: HTMLImageElement} = {};
    private waitCount: number = 0;
    public ready: boolean = true;

    constructor(packs: Pack | Pack[]) {
        super();
        if (packs) {
            if (!_.isArray(packs)) {
                packs = [packs];
            }
            this.packs = packs;
        } else {
            this.packs = [];
        }
        this.clear();
    }

    // Register a filename and a URI in the resource manager.
    public registerUri(fileName: string | any, uri?: string) {
        if (typeof fileName === "string" && typeof uri === "string") {
            this.uris[fileName] = uri;
        } else {
            const inputUris = fileName;
            _.extend(this.uris, inputUris);
        }
    }

    public get(key: string) {
        if (key == "uris") {
            return this.uris;
        } else if (key == "packs") {
            return this.packs;
        }
    }

    public setAttribute(key: string, value: any, options: any) {
        if (key == "uris") {
            this.uris = value;
            return true;
        }
        return false;
    }

    public toJSON() {
        return {
            uris: _.clone(this.uris),
        };
    }

    // Clears state, uri mappings and caches. Browser caches still apply.
    public clear(keys: string[] = null) {
        for (const fileName in this.waitImages) {
            const image = this.waitImages[fileName];
            image.onload = null;
            image.onerror = null;
        }
        this.waitImages = {};
        if (keys) {
            const pickPredicate = (val, key) => keys.indexOf(key) === -1;
            this.uris = _.pickBy(this.uris, pickPredicate);
            this.images = _.pickBy(this.images, pickPredicate);
        } else {
            this.uris = {};
            this.images = {};
        }
        this.waitCount = 0;
        this.ready = true;
    }

    public destroy() {}

    private _getUri(fileName: string): string {
        const uri = this.uris[fileName];
        if (uri) {
            return uri;
        }
        for (let i = this.packs.length - 1; i >= 0; i--) {
            const pack = this.packs[i];
            if (pack.fileNames.indexOf(fileName) != -1) {
                return pack.prefix + fileName;
            }
        }
    }

    private _loadStart() {
        this.waitCount++;
        if (this.waitCount == 1) {
            this.ready = false;
            this.emit("wait");
        }
    }

    private _loadEnd() {
        this.waitCount--;
        if (this.waitCount === 0) {
            this.ready = true;
            this.emit("ready");
        }
    }

    // Loads an Image resource
    public getImage(fileName: string, success: (image: HTMLImageElement) => void, error?: () => void): void {
        let image = this.images[fileName];
        if (image) { // check in cache
            if (success) {
                success(image);
            }
            return;
        }

        // load file
        const uri = this._getUri(fileName);
        if (!uri) {
            throw new Error("Unknown image file " + fileName);
        }
        image = new Image();
        if (uri.indexOf("data:") !== 0) {
            // add cross origin attribute for
            // remote images
            image.crossOrigin = "anonymous";
        }
        image.onload = () => {
            delete this.waitImages[fileName];
            this.images[fileName] = image;
            if (success) {
                success(image);
            }
            this._loadEnd();
        };
        if (error) {
            image.onerror = () => {
                console.log(">>> onError Called");
                delete this.waitImages[fileName];
                if (error()) {
                    // then we treat this load as complete
                    // and handled properly
                    this._loadEnd();
                }
            };
        }
        this._loadStart();
        image.src = uri;
        this.waitImages[fileName] = image;
    }
}
