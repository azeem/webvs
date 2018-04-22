import { IMock, It, Mock } from "typemoq";
import { IContainer } from "../src/Component";
import CodeInstance from "../src/expr/CodeInstance";
import IMain from "../src/IMain";
import ResourceManager from "../src/ResourceManager";
import RenderingContext from "../src/webgl/RenderingContext";
import ShaderProgram, { IShaderOpts } from "../src/webgl/ShaderProgram";
import TextureSetManager from "../src/webgl/TextureSetManager";

export interface IComponentConstructor<C> {
    new (main: IMain, parent: IContainer, opts: any): C;
}

export interface IComponentTestSetup<C> {
    mockMain: IMock<IMain>;
    mockParent: IMock<IContainer>;
    mockRctx: IMock<RenderingContext>;
    mockRsrcMan: IMock<ResourceManager>;
    mockGl: IMock<WebGLRenderingContext>;
    componentClass: IComponentConstructor<C>;
    mockShaderProgram?: IMock<ShaderProgram>;
    mockCodeInstance?: IMock<CodeInstance>;
    mockTSM?: IMock<TextureSetManager>;
}

export function makeComponentTestSetup<C>(
    module: any,
    options?: {
        tsm?: string,
        compileExpr?: string,
        shader?: string,
        shaderInit?: (rctx: RenderingContext, opts: IShaderOpts) => void,
    },
): IComponentTestSetup<C> {
    options = options || {};
    const mockMain          = Mock.ofType<IMain>();
    const mockParent        = Mock.ofType<IContainer>();
    const mockRctx          = Mock.ofType(RenderingContext);
    const mockGl            = Mock.ofType<WebGLRenderingContext>();
    const mockRsrcMan       = Mock.ofType<ResourceManager>();

    mockRctx.setup((x) => x.getGl()).returns(() => mockGl.object);
    mockMain.setup((x) => x.getRctx()).returns(() => mockRctx.object);
    mockMain.setup((x) => x.getRsrcMan()).returns(() => mockRsrcMan.object);

    const inject = {};
    const setup: IComponentTestSetup<C> = {
        componentClass: null,
        mockGl,
        mockMain,
        mockParent,
        mockRctx,
        mockRsrcMan,
    };

    if (options.shader) {
        setup.mockShaderProgram = Mock.ofType<ShaderProgram>();
        // tslint:disable-next-line:only-arrow-functions
        const mockShaderProgramConstructor = function(rctx: RenderingContext, opts: IShaderOpts) {
            if (options.shaderInit) {
                options.shaderInit(rctx, opts);
            }
            return setup.mockShaderProgram.object;
        };
        inject[options.shader] = {
            default: mockShaderProgramConstructor,
        };
    }

    if (options.compileExpr) {
        setup.mockCodeInstance  = Mock.ofType(CodeInstance);
        // tslint:disable-next-line:ban-types
        const mockCompileExpr   = Mock.ofType<Function>();
        mockCompileExpr.setup((x) => x(It.isAny(), It.isAny(), It.isAny(), It.isAny()))
                       .returns(() => ({ codeInst: setup.mockCodeInstance.object }));
        inject[options.compileExpr] = {
            default: mockCompileExpr.object,
        };
    }

    if (options.tsm) {
        setup.mockTSM = Mock.ofType<TextureSetManager>();
        // tslint:disable-next-line:only-arrow-functions
        const mockTSMConstructor = function() {
            return setup.mockTSM.object;
        };
        inject[options.tsm] = {
            default: mockTSMConstructor,
        };
    }

    setup.componentClass = module(inject).default as IComponentConstructor<C>;
    return setup;
}
