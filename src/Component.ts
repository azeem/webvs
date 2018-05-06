import defaults from "lodash-es/defaults";
import flatten from "lodash-es/flatten";
import isEqual from "lodash-es/isEqual";
import isUndefined from "lodash-es/isUndefined";
import omit from "lodash-es/omit";
import uniqueId from "lodash-es/uniqueId";
import IMain from "./IMain";
import Model from "./Model";
import TextureSetManager from "./webgl/TextureSetManager";

/**
 * Component Class Constructor interface. This declares static member
 * and constructor signature for a Component class constructor
 */
export interface IComponentConstructor {
    /**
     * Component class constructor
     */
    new(main: IMain, parent: IContainer, opts: any): Component;

    /**
     * Returns the name of the component
     */
    getComponentName(): string;

    /**
     * Returns a string tag that categorizes the component. e.g. trans, render
     */
    getComponentTag(): string;
}

/**
 * Conainer interface. This declares members for
 * Container Components. see [[Container]] for more details.
 */
export interface IContainer extends Component {
    getTSM(): TextureSetManager;
}

/**
 * Base class for all Components.
 *
 * Webvs renders visualizations by layering different Components or effects
 * one after the other. Each Component type will have a different rendering
 * behaviour which can be configured through the component options. Some
 * components may have sub components, in which case the rendering of all
 * the subcomponents is modified/controlled in some manner by the parent.
 * eg. [[EffectList]], which renders a set of components into a separate
 * buffer which is then blended back into the main render.
 *
 * Options on components can be modified with a [[Model.set]] call. This
 * allows Components to respond to changes in options in real-time.
 * Eg: Changing colors, Code etc. This feature can be used to build
 * Live-Edit User Interfaces for presets development.
 */
export default abstract class Component extends Model {
    /**
     * Returns the name of the component
     */
    public static getComponentName(): string {
        return this.componentName;
    }

    /**
     * Returns a string tag that categorizes the component. e.g. trans, render
     */
    public static getComponentTag(): string {
        return this.componentTag;
    }

    /**
     * Name of the component.
     */
    protected static componentName: string = "Component";

    /**
     * A string tag that categorizes the component. e.g. trans, render
     */
    protected static componentTag: string = "";

    /**
     * Map from option name to handler methods. The handler methods are
     * called in order when on an option is updated with a [[Model.set]] call.
     * This allows component to respond to option changes live. e.g. In a Live-Edit
     * User Interface for preset development.
     */
    protected static optUpdateHandlers: {[key: string]: string | string[] } = null;

    /**
     * Default options for this component
     */
    protected static defaultOptions: any = {};

    public ["constructor"]: typeof Component;

    /**
     * current options of the component
     */
    protected opts: any;
    /**
     * The main instance that manages this component
     */
    protected main: IMain;
    /**
     * The parent component that manages this component
     */
    protected parent: IContainer;

    private id: string;
    private enabled: boolean;
    private lastError: any;

    /**
     * Constructs new Component. Components are usually instantated by a [[Container]] component
     * or [[Main]] in the case of the root [[EffectList]].
     * @param main the main object that manages this component
     * @param parent the parent that manages this component
     * @param options the initial options for this component
     */
    constructor(main: IMain, parent: IContainer, options: any) {
        super();
        this.main = main;
        this.parent = parent;

        this.id = options.id; // TODO: check for id uniqueness
        if (!this.id) {
            this.id = uniqueId(this.constructor.componentName  + "_");
        }
        this.enabled = isUndefined(options.enabled) ? true : options.enabled;

        this.opts = omit(options, ["id", "enabled"]);

        const defaultOptions = this.constructor.defaultOptions;
        if (defaultOptions) {
            this.opts = defaults(this.opts, defaultOptions);
        }

        this.init();
    }

    /**
     * Initializes the component. Override this method to add initialization for the
     * component. Typically you'd call some updateHandlers here to initialize states
     * from the component options.
     */
    public abstract init();

    /**
     * Performs drawing operations. Override to implement drawing for this component.
     * Typically you'd make some WebGL operations to render to the framebuffer manager
     * of this components parent.
     */
    public abstract draw();

    /**
     * Returns whether this component is enabled or not
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Returns the id of this component
     */
    public getId(): string {
        return this.id;
    }

    /**
     * Returns the last error. That raised an `error:*` event
     */
    public getLastError(): any {
        return this.lastError;
    }

    /**
     * Destroys and cleansup resources. Please override to
     * cleanup component specific resources.
     */
    public destroy() {
        this.stopListening();
    }

    /**
     * Sets the parent of this component
     * @param newParent the new parent of this component
     */
    public setParent(newParent: IContainer) {
        this.parent = newParent;
    }

    /**
     * Returns the JSON representation of the component options.
     *
     * This value if passed into constructor will instantiate a component
     * that behaves the same as this component.
     */
    public toJSON(): any {
        const opts = Object.assign({}, this.opts);
        opts.id = this.id;
        opts.type = this.constructor.componentName;
        opts.enabled = this.enabled;
        return opts;
    }

    /**
     * returns a component options given name
     */
    public get(name: string): any {
        if (name === "enabled") {
            return this.enabled;
        } else if (name === "id") {
            return this.id;
        } else {
            return this.opts[name];
        }
    }

    /**
     * Returns a `/` path to the component from the root.
     */
    public getPath(): string {
        if (!isUndefined(this.parent) && !isUndefined(this.id)) {
            return this.parent.getPath() + "/" + this.constructor.componentName + "#" + this.id;
        } else {
            return this.constructor.componentName + "#Main";
        }
    }

    protected setAttribute(key: string, value: any, options: any): boolean {
        const oldValue = this.get(key);
        if (key === "type" || isEqual(value, oldValue)) {
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
                const onChange = flatten([
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
}
