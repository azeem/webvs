interface IComponent {
    destroy(): void;
    setParent(newParent: IComponent);
    toJSON(): any;
    getPath(): string;
}
