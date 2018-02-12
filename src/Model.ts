import EventEmitter from 'eventemitter3';
import _ from 'lodash';

interface Subscription {
    emitter: EventEmitter,
    event: string,
    callback: (...args: any[]) => void
};

export default abstract class Model extends EventEmitter {
    private subscriptions: Subscription[];

    public abstract get(key: string): any;
    public abstract toJSON(key: string): any;
    public abstract setAttribute(key: string, value: any, options: any): void;
    public set(key: string | object, value: any, options?: any): boolean {
        let success, silent;

        if(typeof(key) === 'string') {
            options = options || {};
            success = this.setAttribute(key, value, options);
            if(success && !options.silent) {
                this.emit("change:" + key, this, value, options); 
                this.emit("change", this, options); 
            }
        } else {
            // if map of key values are passed
            // then set each value separately
            const options = value;
            const keyValueMap = key;

            success = false;
            for(key in keyValueMap) {
                if(this.setAttribute(key, keyValueMap[key], options)) {
                    success = true;
                    if(!silent) {
                        this.emit("change:" + key, this, keyValueMap[key], options); 
                    }
                }
            }
            if(success && !silent) {
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
}