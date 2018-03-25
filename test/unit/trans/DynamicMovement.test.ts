/* tslint:disable:no-unused-expression ban-types */
import { expect } from "chai";
import { It, Mock, Times } from "typemoq";
import { IContainer } from "../../../src/Component";
import CodeInstance from "../../../src/expr/CodeInstance";
import IMain from "../../../src/IMain";
import DynamicMovement from "../../../src/trans/DynamicMovement";
import FrameBufferManager from "../../../src/webgl/FrameBufferManager";
import RenderingContext from "../../../src/webgl/RenderingContext";
import ShaderProgram, { IShaderOpts } from "../../../src/webgl/ShaderProgram";

describe("DynamicMovement", () => {
    it("drawHook should bind uniforms for codeInstance", () => {
        const mockMain          = Mock.ofType<IMain>();
        const mockParent        = Mock.ofType<IContainer>();
        const mockShaderProgram = Mock.ofType<ShaderProgram>();
        const mockCodeInstance  = Mock.ofType(CodeInstance);
        const mockRctx          = Mock.ofType(RenderingContext);
        const mockCompileExpr   = Mock.ofType<Function>();
        const mockGl            = Mock.ofType<WebGLRenderingContext>();

        mockRctx.setup((x) => x.getGl()).returns(() => mockGl.object);
        mockMain.setup((x) => x.getRctx()).returns(() => mockRctx.object);
        mockCompileExpr.setup((x) => x(It.isAny(), It.isAny(), It.isAny(), It.isAny()))
                       .returns(() => ({ codeInst: mockCodeInstance.object }));

        let drawHook: (values: any, gl: WebGLRenderingContext, shader: ShaderProgram) => any;
        // tslint:disable-next-line:only-arrow-functions
        const mockShaderProgramConstructor = function(rctx: RenderingContext, opts: IShaderOpts) {
            drawHook = opts.drawHook;
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
        expect(drawHook).to.be.ok;
        drawHook({}, mockGl.object, mockShaderProgram.object);
        mockCodeInstance.verify((x) => x.bindUniforms(mockShaderProgram.object), Times.once());
    });
});
