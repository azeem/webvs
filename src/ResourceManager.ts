import clone from "lodash-es/clone";
import extend from "lodash-es/extend";
import isArray from "lodash-es/isArray";
import pickBy from "lodash-es/pickBy";
import Model from "./Model";

/**
 * Defines a resource pack. Resource Packs
 * can be added to resource manager.
 */
export interface IPack {
    /**
     * Name of the Resource Pack
     */
    name: string;
    /**
     * URL prefix for the Resource Pack. Full URL to
     * a file in this pack is obtained by appending the filename
     * to this prefix
     */
    prefix: string;
    /**
     * Names of the files.
     */
    fileNames: string[];
}

/**
 * ResourceManager manages async loading and caching of resources.
 *
 * ResourceManager Basically, it maintains a map of fileNames to URI for
 * the resource. When a request for resource fileName is received, the uri is looked up
 * and the file is either async loaded or served from cache. This also manages
 * a ready state with callbacks that tells when one or more resources are being loaded and
 * when all resources are ready.
 */
export default class ResourceManager extends Model {
    public ready: boolean = true;
    private packs: IPack[];
    private uris: {[key: string]: string} = {};
    private images: {[key: string]: HTMLImageElement} = {};
    private waitImages: {[key: string]: HTMLImageElement} = {};
    private waitCount: number = 0;

    constructor(packs: IPack | IPack[]) {
        super();
        if (packs) {
            if (!isArray(packs)) {
                packs = [packs];
            }
            this.packs = packs;
        } else {
            this.packs = [];
        }
        this.clear();
    }

    /**
     * Register a filename and a URI in the resource manager.
     *
     * @param fileName name of the file or map of filename: uri.
     * @param uri uri when string fileName is specified
     */
    public registerUri(fileName: string | any, uri?: string) {
        if (typeof fileName === "string" && typeof uri === "string") {
            this.uris[fileName] = uri;
        } else {
            const inputUris = fileName;
            extend(this.uris, inputUris);
        }
    }

    /**
     * Returns the attributes for this ResourceManager
     *
     * @param key the name of the attribute. Only `"uris"` is acceptable.
     */
    public get(key: string) {
        if (key === "uris") {
            return this.uris;
        }
    }

    /**
     * Returns JSON representation of the resource manager
     */
    public toJSON() {
        return {
            uris: clone(this.uris),
        };
    }

    /**
     * Clears state, uri mappings and caches. Browser caches still apply.
     *
     * @param keys the keys which should be cleared. Default clears everything.
     */
    public clear(keys: string[] = null) {
        for (const fileName in this.waitImages) {
            if (!this.waitImages.hasOwnProperty(fileName)) {
                continue;
            }
            const image = this.waitImages[fileName];
            image.onload = null;
            image.onerror = null;
        }
        this.waitImages = {};
        if (keys) {
            const pickPredicate = (val, key) => keys.indexOf(key) === -1;
            this.uris = pickBy(this.uris, pickPredicate);
            this.images = pickBy(this.images, pickPredicate);
        } else {
            this.uris = {};
            this.images = {};
        }
        this.waitCount = 0;
        this.ready = true;
    }

    /**
     * Loads an Image resource.
     *
     * @param fileName fileName of the image to be returned
     * @param success handler that'll be called on success
     * @param error handler that'll be called on error
     */
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

    protected setAttribute(key: string, value: any, options: any) {
        if (key === "uris") {
            this.uris = value;
            return true;
        }
        return false;
    }

    private _getUri(fileName: string): string {
        const uri = this.uris[fileName];
        if (uri) {
            return uri;
        }
        for (let i = this.packs.length - 1; i >= 0; i--) {
            const pack = this.packs[i];
            if (pack.fileNames.indexOf(fileName) !== -1) {
                return pack.prefix + fileName;
            }
        }
    }

    private _loadStart() {
        this.waitCount++;
        if (this.waitCount === 1) {
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
}
