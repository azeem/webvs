import * as EventEmitter from "eventemitter3";
import filter from "lodash-es/filter";

interface ISubscription {
    emitter: EventEmitter;
    event: string;
    callback: (...args: any[]) => void;
}

/**
 * Model is a base for Model-Like objects.
 *
 * Model provides some event-model and general attribute management
 * facilities. Model basically provides getter, setter methods for
 * attributes and an event subscription system to notify of attribute
 * changes or other custom events. Model is used mainly by Components
 * to model component options and thus allow editors to treat each
 * component as a Data Model object to drive user interface.
 */
export default abstract class Model extends EventEmitter {
    private subscriptions: ISubscription[] = [];

    /**
     * Returns the value of an attribute.
     *
     * Override to implement getter for attributes
     * @param key attribute name
     */
    public abstract get(key: string): any;
    /**
     * Returns a JSON representation of the attributes.
     *
     * Override to implement a JSON generation logic
     * @param key attribute name
     */
    public abstract toJSON(key: string): any;

    /**
     * Safely set an attribute(s).
     *
     * If the attribute set succeeds, a `change:[attribute name]` event is fired.
     * `change:[attribute name]` event handler receives `this` object, the new `value`
     * and `options` as arguments.
     *
     * Additionally a `change` event is also fired when all changes succeed. The `change`
     * event receives `this` object and the `options` as arguments.
     *
     * @param key the name of the attribute or map of values
     * @param value the new value of the attribute
     * @param options this object is sent down to the event handlers, useful to things down to your
     * handler. if `options.silent` is true then events are not fired.
     */
    public set(key: string | object, value: any, options?: any): boolean {
        let success;

        if (typeof(key) === "string") {
            options = options || {};
            const silent = typeof(options.silent) === "undefined" ? true : false;
            success = this.setAttribute(key, value, options);
            if (success && !silent) {
                this.emit("change:" + key, this, value, options);
                this.emit("change", this, options);
            }
        } else {
            // if map of key values are passed
            // then set each value separately
            options = value || {};
            const silent = typeof(options.silent) === "undefined" ? true : false;
            const keyValueMap = key;

            success = false;
            for (key in keyValueMap) {
                if (this.setAttribute(key, keyValueMap[key], options)) {
                    success = true;
                    if (!silent) {
                        this.emit("change:" + key, this, keyValueMap[key], options);
                    }
                }
            }
            if (success && !silent) {
                this.emit("change", this, options);
            }
        }

        return success;
    }

    /**
     * Add a listener to another EventEmitter.
     *
     * This provides an event subscription list facility. Allowing
     * subclasses to listen to other emitters and remove all or some listeners
     * with a single call to [[Model.stopListening]], later.
     *
     * @param emitter the event emitter to listen to
     * @param event the name of the event to listen to
     * @param callback the callback for the event handler
     */
    protected listenTo(emitter: EventEmitter, event: string, callback: (...args: any[]) => void) {
        emitter.addListener(event, callback);
        this.subscriptions.push({emitter, event, callback});
    }

    /**
     * Removes to one or more listeners that were set earlier with calls to [[Model.listenTo]].
     *
     * Use the arguments to filter subscriptions. eg: `model.stopListening(em)` will remove all
     * listeners on emitter `em`. `model.stopListening(em, 'change')` will remove all listeners for
     * `change` event on emitter `em`.
     *
     * @param emitter the event emitter on which the listener was set
     * @param event the event to be removed
     * @param callback the callback to be removed
     */
    protected stopListening(emitter?: EventEmitter, event?: string, callback?: (...args: any[]) => void) {
        const subFilter: any = {};
        if (emitter) {
            subFilter.emitter = emitter;
        }
        if (event) {
            subFilter.event = event;
        }
        if (emitter) {
            subFilter.callback = callback;
        }
        const subs = filter(this.subscriptions, subFilter);
        subs.forEach((sub) => {
            sub.emitter.removeListener(sub.event, sub.callback);
        });
    }

    /**
     * Set value of a single attribute and returns boolean to indicate success.
     *
     * Override this to implement attribute set logic
     * @param key attribute name
     * @param value value
     * @param options custom options
     */
    protected abstract setAttribute(key: string, value: any, options: any): boolean;
}
