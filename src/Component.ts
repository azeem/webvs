/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */
import _ from 'lodash';
import Model from './Model';
import IMain from './IMain';
import {IComponent, IContainer} from './componentInterfaces';

export interface IComponentConstructor {
    new(main: IMain, parent: Component, opts: any): Component;
    componentName: string;
    componentTag: string;
}

export default abstract class Component extends Model implements IComponent {
    ['constructor']: typeof Component;
    protected main: IMain;
    protected parent: IContainer;
    public id: string;
    public enabled: boolean;
    protected opts: any;
    public static componentName: string = "Component";
    public static componentTag: string = "";
    protected static optUpdateHandlers: {[key: string]: string | string[] } = null;
    protected static defaultOptions: any = {};
    public lastError: any;

    abstract init();
    abstract draw();

    constructor(main: IMain, parent: IContainer, options: any) {
        super();
        this.main = main;
        this.parent = parent;

        this.id = options.id; // TODO: check for id uniqueness
        if(!this.id) {
            this.id = _.uniqueId(this.constructor.componentName  + "_");
        }
        this.enabled = _.isUndefined(options.enabled)?true:options.enabled;

        this.opts = _.omit(options, ["id", "enabled"]);

        const defaultOptions = this.constructor.defaultOptions;
        if(defaultOptions) {
            this.opts = _.defaults(this.opts, defaultOptions);
        }

        this.init();
    }

    destroy() {
        this.stopListening();
    }

    setParent(newParent: IContainer) {
        this.parent = newParent;
    }

    toJSON() {
        const opts = _.clone(this.opts);
        opts.id = this.id;
        opts.type = this.constructor.componentName;
        opts.enabled = this.enabled;
        return opts;
    }

    setAttribute(key: string, value: any, options: any) {
        const oldValue = this.get(key);
        if(key == "type" || _.isEqual(value, oldValue)) {
            return false;
        }

        // set the property
        if(key == "enabled") {
            this.enabled = value;
        } else if(key == "id") {
            this.id = value;
        } else {
            this.opts[key] = value;
        }

        // call all onchange handlers
        // we just call these manually here no need to
        // go through event triggers
        const optUpdateHandlers = this.constructor.optUpdateHandlers;
        if(optUpdateHandlers) {
            try {
                const onChange = _.flatten([
                    optUpdateHandlers[key] || [],
                    optUpdateHandlers["*"] || []
                ]);

                for(var i = 0;i < onChange.length;i++) {
                    this[onChange[i]].call(this, value, key, oldValue);
                }
            } catch(e) {
                // restore old value in case any of the onChange handlers fail
                if(key == "enabled") {
                    this.enabled = oldValue;
                } else if(key == "id") {
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

    get(key): any {
        if(key == "enabled") {
            return this.enabled;
        } else if(key == "id") {
            return this.id;
        } else {
            return this.opts[key];
        }
    }

    getPath(): string {
        if(!_.isUndefined(this.parent) && !_.isUndefined(this.id)) {
            return this.parent.getPath() + "/" + this.constructor.componentName + "#" + this.id;
        } else {
            return this.constructor.componentName + "#Main";
        }
    }
}