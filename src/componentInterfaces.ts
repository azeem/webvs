import FrameBufferManager from "./webgl/FrameBufferManager";

export interface IComponent {
    destroy(): void;
    setParent(newParent: IContainer);
    toJSON(): any;
    getPath(): string;
    init();
    draw();
}

export interface IContainer {
    fm: FrameBufferManager;
    destroy(): void;
    setParent(newParent: IContainer);
    toJSON(): any;
    getPath(): string;
    init();
    draw();
}