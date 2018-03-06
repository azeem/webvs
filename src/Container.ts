import * as _ from "lodash";
import Component, { IComponentConstructor, IContainer } from "./Component";
import ComponentRegistry from "./ComponentRegistry";
import IMain from "./IMain";
import FrameBufferManager from "./webgl/FrameBufferManager";

// A base class for all components that can have sub components.
// Manages, cloning and component tree operations
export default abstract class Container extends Component implements IContainer {
    public fm: FrameBufferManager;
    protected components: Component[];

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
        delete this.opts.components;
    }

    public init() {
        const components = [];
        if (this.opts.components) {
            for (const opts of this.opts.components) {
                const componentClass = this.main.componentRegistry.getComponentClass(opts.type);
                const component = new componentClass(this.main, this, opts);
                components.push(component);
            }
        }
        this.components = components;
        this.fm = this.parent && this.parent.fm;
    }

    public destroy() {
        super.destroy();
        for (const component of this.components) {
            component.destroy();
        }
    }

    public createComponent(opts: any): Component {
        const componentClass = this.main.componentRegistry.getComponentClass(opts.type);
        return new componentClass(this.main, this, opts);
    }

    // Adds a component as child of the given parent that
    // resides under this containers subtree
    public addComponent(componentOpts: any, pos: number = this.components.length, params: any = {}): Component {
        let component;
        if (componentOpts instanceof Component) {
            component = componentOpts;
            component.setParent(this);
        } else {
            component = this.createComponent(componentOpts);
        }
        this.components.splice(pos, 0, component);

        params = _.defaults({pos}, params);
        this.emit("addComponent", component, this, params);
        return component;
    }

    public detachComponent(pos: number, params: any = {}): Component {
        if (_.isString(pos)) {
            const id = pos;
            let i;
            for (i = 0; i < this.components.length; i++) {
                if (this.components[i].id === id) {
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

        params = _.defaults({pos}, params);
        this.emit("detachComponent", component, this, params);
        return component;
    }

    public findComponent(id: string) {
        for (const component of this.components) {
            if (component.id === id) {
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

    // Constructs complete options object for this container and its
    // subtree
    public toJSON(): any {
        const opts = super.toJSON();

        opts.components = [];
        for (const component of this.components) {
            opts.components.push(component.toJSON());
        }
        return opts;
    }
}
