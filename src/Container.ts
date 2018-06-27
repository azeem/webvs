import defaults from "lodash-es/defaults";
import isString from "lodash-es/isString";
import Component, { IComponentConstructor, IContainer } from "./Component";
import ComponentRegistry from "./ComponentRegistry";
import IMain from "./IMain";
import Inert from "./Inert";
import TextureSetManager from "./webgl/TextureSetManager";

/**
 * A Base class for all Components that have a sub component.
 *
 * Manages, cloning and component tree operations.
 */
export default abstract class Container extends Component implements IContainer {
    protected components: Component[];
    private tsm: TextureSetManager;

    /**
     * See [[Component.constructor]]
     */
    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
        delete this.opts.components;
    }

    /**
     * Returns the TextSetManager for this component.
     *
     * A container inherits TextureSetManager from it's own parent
     * unless explicitly overridden by Subclass
     */
    public getTSM(): TextureSetManager {
        return this.tsm;
    }

    /**
     * Initializes Container. Please override to implement component specific initialization
     *
     * Container init basically instantiates all subcomponents from the `components` option.
     * It also initializes the TextureSetManager to the parent's.
     */
    public init() {
        const components = [];
        if (this.opts.components) {
            for (const opts of this.opts.components) {
                const componentClass = this.main.getComponentRegistry().getComponentClass(opts.type);
                if (!componentClass) {
                    // tslint:disable-next-line:no-console
                    console.warn(`Unknown ComponentClass: ${opts.type}. Skipping.`);
                    continue;
                }
                const component = new componentClass(this.main, this, opts);
                if (component instanceof Inert) {
                    // tslint:disable-next-line:no-console
                    console.warn(`Inert Component: ${opts.type}. Will not affect rendering.`);
                }
                components.push(component);
            }
        }
        this.components = components;
        this.tsm = this.parent && this.parent.getTSM();
    }

    /**
     * Destroy all subcomponents and itself.
     */
    public destroy() {
        super.destroy();
        for (const component of this.components) {
            component.destroy();
        }
    }

    /**
     * Adds new sub component in this Container
     *
     * Once component is inserted, an `addComponent` event is fired with the following arguments:
     * 1. The newly created component
     * 2. This container
     * 3. Additional params passed in to this call
     *
     * @param componentOpts options for the new sub-component
     * @param pos the position at which the sub-component should be inserted. Defaults to appending
     * @param params additional params to be passed down the the `addComponent` event
     */
    public addComponent(componentOpts: any, pos: number = this.components.length, params: any = {}): Component {
        let component;
        if (componentOpts instanceof Component) {
            component = componentOpts;
            component.setParent(this);
        } else {
            const componentClass = this.main.getComponentRegistry().getComponentClass(componentOpts.type);
            if (!componentClass) {
                // tslint:disable-next-line:no-console
                console.warn(`Unknown ComponentClass: ${componentOpts.type}.`);
                return null;
            }
            component = new componentClass(this.main, this, componentOpts);
        }
        this.components.splice(pos, 0, component);

        params = defaults({pos}, params);
        this.emit("addComponent", component, this, params);
        return component;
    }

    /**
     * Detaches a component from this container and returns it.
     *
     * Once component is detached, a `detachComponent` event is fired with following arguments.
     * 1. The newly created component
     * 2. This container
     * 3. Additional params passed in to this call
     *
     * @param pos The position from which component should be detached
     * @param params additional params to be passed down the the `detachComponent` event
     */
    public detachComponent(pos: number, params: any = {}): Component {
        if (isString(pos)) {
            const id = pos;
            let i;
            for (i = 0; i < this.components.length; i++) {
                if (this.components[i].getId() === id) {
                    pos = i;
                    break;
                }
            }
            if (i === this.components.length) {
                return;
            }
        }
        const component = this.components[pos];
        this.components.splice(pos, 1);

        params = defaults({pos}, params);
        this.emit("detachComponent", component, this, params);
        return component;
    }

    /**
     * Returns a sub-component under hierarchy of this Container with the given id
     * @param id id of the component to find
     */
    public findComponent(id: string): Component {
        for (const component of this.components) {
            if (component.getId() === id) {
                return component;
            }
        }

        // search in any subcontainers
        for (const container of this.components) {
            if (!(container instanceof Container)) {
                continue;
            }
            const subComponent = container.findComponent(id);
            if (subComponent) {
                return subComponent;
            }
        }
    }

    /**
     * Returns the JSON representation of the component options.
     */
    public toJSON(): any {
        const opts = super.toJSON();

        opts.components = [];
        for (const component of this.components) {
            opts.components.push(component.toJSON());
        }
        return opts;
    }

    /**
     * sets the frambuffer manager for this container
     * @param tsm the frambuffermanager
     */
    protected setTSM(tsm: TextureSetManager) {
        this.tsm = tsm;
    }
}
