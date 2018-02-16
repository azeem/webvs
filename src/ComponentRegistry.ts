import Component, {IComponentConstructor} from './Component';

export default class ComponentRegistry {
    static components: {[name: string]: IComponentConstructor};
    static addComponent(componentClasses: IComponentConstructor | IComponentConstructor[]) {
        if(!Array.isArray(componentClasses)) {
            componentClasses = [componentClasses];
        }

        componentClasses.forEach((componentClass) => {
            const name = componentClass.componentName;
            if(name in ComponentRegistry.components) {
                throw new Error(`Component ${name} already exists in the registry`);
            }
            ComponentRegistry.components[name] = componentClass;
        });
    }

    static getComponentClass(name) {
        return ComponentRegistry.components[name];
    }
};