import * as EventEmitter from "eventemitter3";
import * as _ from "lodash";

interface ISubscription {
    emitter: EventEmitter;
    event: string;
    callback: (...args: any[]) => void;
}

export default abstract class Model extends EventEmitter {
    private subscriptions: ISubscription[] = [];

    public abstract get(key: string): any;
    public abstract toJSON(key: string): any;
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

    public listenTo(emitter: EventEmitter, event: string, callback: (...args: any[]) => void) {
        emitter.addListener(event, callback);
        this.subscriptions.push({emitter, event, callback});
    }

    public stopListening(emitter?: EventEmitter, event?: string, callback?: (...args: any[]) => void) {
        const filter: any = {};
        if (emitter) {
            filter.emitter = emitter;
        }
        if (event) {
            filter.event = event;
        }
        if (emitter) {
            filter.callback = callback;
        }
        const subs = _.filter(this.subscriptions, filter);
        subs.forEach((sub) => {
            sub.emitter.removeListener(sub.event, sub.callback);
        });
    }

    protected abstract setAttribute(key: string, value: any, options: any): void;
}
