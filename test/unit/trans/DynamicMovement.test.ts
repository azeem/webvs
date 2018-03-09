import { expect } from "chai";
import { It, Mock } from "typemoq";
import { IContainer } from "../../../src/Component";
import CodeInstance from "../../../src/expr/CodeInstance";
import IMain from "../../../src/IMain";
import DynamicMovement from "../../../src/trans/DynamicMovement";
import FrameBufferManager from "../../../src/webgl/FrameBufferManager";
import RenderingContext from "../../../src/webgl/RenderingContext";
import ShaderProgram from "../../../src/webgl/ShaderProgram";

describe("DynamicMovement", () => {
    it("should bind uniforms for codeInstance", () => {
        const mockMain          = Mock.ofType<IMain>();
        const mockParent        = Mock.ofType<IContainer>();
        const mockShaderProgram = Mock.ofType<ShaderProgram>();
        const mockCodeInstance  = Mock.ofType(CodeInstance);
        const mockRctx          = Mock.ofType(RenderingContext);
        // tslint:disable-next-line:ban-types
        const mockCompileExpr    = Mock.ofType<Function>();
        const mockGl             = Mock.ofType<WebGLRenderingContext>();

        mockRctx.setup((x) => x.gl).returns(() => mockGl.object);
        mockMain.setup((x) => x.rctx).returns(() => mockRctx.object);
        mockCompileExpr.setup((x) => x(It.isAny(), It.isAny(), It.isAny(), It.isAny()))
                       .returns(() => ({ codeInst: mockCodeInstance.object }));

        // tslint:disable-next-line:only-arrow-functions
        const mockShaderProgramConstructor = function(rctx, opts) {
            expect(opts.drawHook).to.be.a("Function");
            return mockShaderProgram.object;
        };

        const module = require("inject-loader!../../../src/trans/DynamicMovement");
        const DMClass = module({
            "../expr/compileExpr": {
                default: mockCompileExpr.object,
            },
            "../webgl/ShaderProgram": {
                default: mockShaderProgramConstructor,
            },
        }).default as typeof DynamicMovement;

        const dmComponent = new DMClass(mockMain.object, mockParent.object, {});
    });
});
