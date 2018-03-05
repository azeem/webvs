import Component, {IComponentConstructor} from "./Component";
import ClearScreen from "./render/ClearScreen";

export default class ComponentRegistry {
    private components: {[name: string]: IComponentConstructor} = {};

    constructor(componentClasses?: IComponentConstructor | IComponentConstructor[]) {
        if (componentClasses) {
            this.addComponent(componentClasses);
        }
    }

    public addComponent(componentClasses: IComponentConstructor | IComponentConstructor[]) {
        if (!Array.isArray(componentClasses)) {
            componentClasses = [componentClasses];
        }

        componentClasses.forEach((componentClass) => {
            const name = componentClass.componentName;
            if (name in this.components) {
                throw new Error(`Component ${name} already exists in the registry`);
            }
            this.components[name] = componentClass;
        });
    }

    public getComponentClass(name) {
        return this.components[name];
    }
}
