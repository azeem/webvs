import * as _ from "lodash";
import IMain from "./IMain";
import Model from "./Model";
import FrameBufferManager from "./webgl/FrameBufferManager";

export interface IComponentConstructor {
    componentName: string;
    componentTag: string;
    new(main: IMain, parent: IContainer, opts: any): Component;
}

export interface IContainer extends Component {
    fm: FrameBufferManager;
}

export default abstract class Component extends Model {
    public static componentName: string = "Component";
    public static componentTag: string = "";
    protected static optUpdateHandlers: {[key: string]: string | string[] } = null;
    protected static defaultOptions: any = {};
    public id: string;
    public enabled: boolean;
    public lastError: any;
    public ["constructor"]: typeof Component;
    protected opts: any;
    protected main: IMain;
    protected parent: IContainer;

    constructor(main: IMain, parent: IContainer, options: any) {
        super();
        this.main = main;
        this.parent = parent;

        this.id = options.id; // TODO: check for id uniqueness
        if (!this.id) {
            this.id = _.uniqueId(this.constructor.componentName  + "_");
        }
        this.enabled = _.isUndefined(options.enabled) ? true : options.enabled;

        this.opts = _.omit(options, ["id", "enabled"]);

        const defaultOptions = this.constructor.defaultOptions;
        if (defaultOptions) {
            this.opts = _.defaults(this.opts, defaultOptions);
        }

        this.init();
    }

    public abstract init();
    public abstract draw();

    public destroy() {
        this.stopListening();
    }

    public setParent(newParent: IContainer) {
        this.parent = newParent;
    }

    public toJSON() {
        const opts = _.clone(this.opts);
        opts.id = this.id;
        opts.type = this.constructor.componentName;
        opts.enabled = this.enabled;
        return opts;
    }

    public setAttribute(key: string, value: any, options: any) {
        const oldValue = this.get(key);
        if (key === "type" || _.isEqual(value, oldValue)) {
            return false;
        }

        // set the property
        if (key === "enabled") {
            this.enabled = value;
        } else if (key === "id") {
            this.id = value;
        } else {
            this.opts[key] = value;
        }

        // call all onchange handlers
        // we just call these manually here no need to
        // go through event triggers
        const optUpdateHandlers = this.constructor.optUpdateHandlers;
        if (optUpdateHandlers) {
            try {
                const onChange = _.flatten([
                    optUpdateHandlers[key] || [],
                    optUpdateHandlers["*"] || [],
                ]);

                for (const onChangeHandler of onChange) {
                    this[onChangeHandler].call(this, value, key, oldValue);
                }
            } catch (e) {
                // restore old value in case any of the onChange handlers fail
                if (key === "enabled") {
                    this.enabled = oldValue;
                } else if (key === "id") {
                    this.id = oldValue;
                } else {
                    this.opts[key] = oldValue;
                }

                this.lastError = e;
                this.emit("error:" + key, this, value, options, e);
            }
        }

        return true;
    }

    public get(key): any {
        if (key === "enabled") {
            return this.enabled;
        } else if (key === "id") {
            return this.id;
        } else {
            return this.opts[key];
        }
    }

    public getPath(): string {
        if (!_.isUndefined(this.parent) && !_.isUndefined(this.id)) {
            return this.parent.getPath() + "/" + this.constructor.componentName + "#" + this.id;
        } else {
            return this.constructor.componentName + "#Main";
        }
    }
}
