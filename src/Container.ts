/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

import _ from 'lodash';
import Component, { IComponentConstructor } from './Component';
import ComponentRegistry from './ComponentRegistry';

// A base class for all components that can have sub components.
// Manages, cloning and component tree operations
export default abstract class Container extends Component {
    protected components: Component[];

    constructor(gl, main, parent, opts) {
        super(gl, main, parent, opts);
        delete this.opts.components;
    }

    init() {
        const components = [];
        if(this.opts.components) {
            for(let i = 0;i < this.opts.components.length;i++) {
                const opts = this.opts.components[i];
                const componentClass = ComponentRegistry.getComponentClass(opts.type);
                const component = new componentClass(this.gl, this.main, this, opts);
                components.push(component);
            }
        }
        this.components = components;
    }

    destroy() {
        super.destroy();
        for(let i = 0;i < this.components.length;i++) {
            this.components[i].destroy();
        }
    }
    
    createComponent(opts): Component {
        const componentClass = ComponentRegistry.getComponentClass(opts.type);
        return new componentClass(this.gl, this.main, this, opts);
    }
    
    // Adds a component as child of the given parent that
    // resides under this containers subtree
    addComponent(componentOpts: any, pos: number = this.components.length, params: any = {}): Component {
        let component;
        if(componentOpts instanceof Component) {
            component = componentOpts;
            component.setParent(this);
        } else {
            component = this.createComponent(componentOpts);
        }
        this.components.splice(pos, 0, component);

        params = _.defaults({pos: pos}, params);
        this.emit("addComponent", component, this, params);
        return component;
    }

    detachComponent(pos: number, params: any = {}): Component {
        if(_.isString(pos)) {
            const id = pos;
            let i;
            for(i = 0;i < this.components.length;i++) {
                if(this.components[i].id == id) {
                    pos = i;
                    break;
                }
            }
            if(i == this.components.length) {
                return;
            }
        }
        const component = this.components[pos];
        this.components.splice(pos, 1);

        params = _.defaults({pos: pos}, params);
        this.emit("detachComponent", component, this, params);
        return component;
    }

    findComponent(id: string) {
        for(let i = 0;i < this.components.length;i++) {
            const component = this.components[i];
            if(component.id == id) {
                return component;
            }
        }

        // search in any subcontainers
        for(let i = 0;i < this.components.length;i++) {
            const container = this.components[i];
            if(!(container instanceof Container)) {
                continue;
            }
            const subComponent = container.findComponent(id);
            if(subComponent) {
                return subComponent;
            }
        }
    }

    // Constructs complete options object for this container and its
    // subtree
    toJSON(): any {
        const opts = super.toJSON();

        opts.components = [];
        for(let i = 0;i < this.components.length;i++) {
            opts.components.push(this.components[i].toJSON());
        }
        return opts;
    }
}