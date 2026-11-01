import { vi } from "vitest";
import Container from "../src/Container";
import CodeInstance from "../src/expr/CodeInstance";
import compileExpr from "../src/expr/compileExpr";
import IMain from "../src/IMain";
import ResourceManager from "../src/ResourceManager";
import RenderingContext from "../src/webgl/RenderingContext";

// Every property read returns a lazily created vi.fn, so unstubbed calls return undefined.
// Symbols and "then" stay undefined, so the mock isn't mistaken for an iterable or a promise.
export function autoMock<T>(): T {
    return new Proxy({}, {
        get: (target, key) => typeof key === "symbol" || key === "then" ? undefined : (target[key] ??= vi.fn()),
    }) as T;
}

// Expects the calling test file to vi.mock "src/expr/compileExpr".
export function makeComponentTestSetup() {
    const mockMain = autoMock<IMain>();
    const mockParent = autoMock<Container>();
    const mockRctx = autoMock<RenderingContext>();
    const mockRsrcMan = autoMock<ResourceManager>();
    const mockGl = autoMock<WebGLRenderingContext>();
    const mockCodeInstance = autoMock<CodeInstance>();

    vi.mocked(mockRctx.getGl).mockReturnValue(mockGl);
    vi.mocked(mockMain.getRctx).mockReturnValue(mockRctx);
    vi.mocked(mockMain.getRsrcMan).mockReturnValue(mockRsrcMan);
    vi.mocked(compileExpr).mockReturnValue({ codeInst: mockCodeInstance } as any);

    return { mockCodeInstance, mockGl, mockMain, mockParent, mockRctx, mockRsrcMan };
}

export function getResizeHandler(mockMain: IMain): () => void {
    const call = vi.mocked(mockMain.addListener).mock.calls.find(([event]) => event === "resize");
    return call?.[1];
}
