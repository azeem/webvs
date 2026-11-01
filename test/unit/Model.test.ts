import { expect } from "vitest";
import Model from "../../src/Model";

class TestModel extends Model {
    public get(key: string): any { return undefined; }
    public toJSON(key: string): any { return {}; }
    public listen(emitter: Model, event: string, callback: (...args: any[]) => void) {
        this.listenTo(emitter, event, callback);
    }
    public unlisten(emitter?: Model, event?: string) {
        this.stopListening(emitter, event);
    }
    protected setAttribute(key: string, value: any, options: any): boolean { return true; }
}

describe("Model", () => {
    it("Should pass emit arguments to listeners", () => {
        const model = new TestModel();
        const calls: any[][] = [];
        model.on("resize", (...args: any[]) => calls.push(args));
        model.addListener("resize", (...args: any[]) => calls.push(["second", ...args]));

        expect(model.emit("resize", 640, 480)).toBe(true);
        expect(model.emit("other")).toBe(false);
        expect(calls).toEqual([[640, 480], ["second", 640, 480]]);
    });

    it("Should stop calling removed listeners", () => {
        const model = new TestModel();
        const calls: string[] = [];
        const a = () => calls.push("a");
        model.on("wait", a);
        model.on("wait", () => calls.push("b"));

        model.removeListener("wait", a);
        model.emit("wait");
        model.removeListener("wait");
        model.emit("wait");

        expect(calls).toEqual(["b"]);
    });

    it("Should remove listenTo subscriptions on stopListening", () => {
        const main = new TestModel();
        const rsrcMan = new TestModel();
        const listener = new TestModel();
        const calls: string[] = [];
        listener.listen(main, "resize", () => calls.push("resize"));
        listener.listen(rsrcMan, "wait", () => calls.push("wait"));
        listener.listen(rsrcMan, "ready", () => calls.push("ready"));

        listener.unlisten(rsrcMan, "wait");
        main.emit("resize");
        rsrcMan.emit("wait");
        rsrcMan.emit("ready");
        listener.unlisten();
        main.emit("resize");
        rsrcMan.emit("ready");

        expect(calls).toEqual(["resize", "ready"]);
    });
});
