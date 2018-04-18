import Component, {IComponentConstructor} from "./Component";
import ClearScreen from "./render/ClearScreen";

/**
 * A Registry of Component classes.
 *
 * ComponentRegistry maintains a map from Component name
 * to Component class constructors. Typically used through the [[Main.componentRegistry]]
 */
export default class ComponentRegistry {
    private components: {[name: string]: IComponentConstructor} = {};
    private tags: string[] = [];

    /**
     * construct a ComponentRegistry with an initial set of Component class
     * constructors.
     * @param componentClasses one or more Component class constructors
     */
    constructor(componentClasses?: IComponentConstructor | IComponentConstructor[]) {
        if (componentClasses) {
            this.addComponent(componentClasses);
        }
    }

    /**
     * Add a Component class constructor into the registry. Each constructor is mapped
     * to the static [[Component.componentName]] value of the class.
     * @param componentClasses one or more Component class constructors to be added
     */
    public addComponent(componentClasses: IComponentConstructor | IComponentConstructor[]) {
        if (!Array.isArray(componentClasses)) {
            componentClasses = [componentClasses];
        }

        componentClasses.forEach((componentClass) => {
            const name = componentClass.getComponentName();
            if (name in this.components) {
                throw new Error(`Component ${name} already exists in the registry`);
            }
            this.components[name] = componentClass;
            if (this.tags.indexOf(componentClass.getComponentTag()) === -1) {
                this.tags.push(componentClass.getComponentTag());
            }
        });
    }

    /**
     * Returns the Component class constructor mapped to the given name
     * @param name componentName of the Component class to be retrieved
     */
    public getComponentClass(name: string): IComponentConstructor {
        return this.components[name];
    }

    /**
     * Returns all components with given tag
     * @param tag of component classes to be returned
     */
    public getComponentClassesByTag(tag: string): IComponentConstructor[] {
        return Object.keys(this.components)
                     .map((name) => this.components[name])
                     .filter((componentClass) => componentClass.getComponentTag() === tag);
    }
}
