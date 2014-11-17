/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

test('ExprCodeGenerator GLSL Generation', function() {
    var gen = Webvs.compileExpr({
        init: "a=10;n=100",
        perPixel: "b=10+a;c=rand(20);c=gettime(0)+1;x=0;"
    }, ["init", "perFrame"], ["perPixel"], ["x", "y"]);

    equal(
        gen.glslCode,
        "float b = 0.0;\nfloat c = 0.0;\nfloat x = 0.0;\nfloat y = 0.0;\nuniform float a;\nuniform vec2 __randStep;\nvec2 __randSeed;\nfloat rand(float max) {\n   __randSeed += __randStep;\n   float val = fract(sin(dot(__randSeed.xy ,vec2(12.9898,78.233))) * 43758.5453);\n   return (floor(val*max)+1);\n}\nuniform float __PC_gettime_0;\nvoid perPixel() {\nb=(10.0+a);\nc=(rand(20.0));\nc=((__PC_gettime_0)+1.0);\nx=0.0;\n}", 
        "Glsl code can be generated"
    );
});

test("ExprCodeGenerator comments", function() {
    var gen = Webvs.compileExpr({
        test: [
            "a = a + 1;// this is a single line comment",
            "a = pow( /*this is a comment in between*/ a, 2);",
            "b = a + 1; /* this comment spans mutliple",
            "lines */ c = b"
        ].join("\n")
    }, ["test"]);
    gen.codeInst.a = 1;
    gen.codeInst.test();
    equal(gen.codeInst.c, 5, "comments are supported");
});

test("ExprCodeGenerator register support", function() {
    var js1 = (Webvs.compileExpr({
        test: "@hello = a;reg12 = a;"
    }, ["test"])).codeInst;

    var js2 = (Webvs.compileExpr({
        test: "b = @hello + 1;c = reg12 + 2"
    }, ["test"])).codeInst;

    var dummyMain = {
        registerBank: {},
    };
    var dummyParent = {
        gl: {
            drawingBufferWidth: 100,
            drawingBufferHeight: 100
        }
    };
    js1.setup(dummyMain, dummyParent);
    js2.setup(dummyMain, dummyParent);

    js1.a = 10;
    js1.test();
    js2.test();
    equal(js2.b, 11, "register variables with @ syntax works");
    equal(js2.c, 12, "register variables with regXX syntax works");
});

test("ExprCodeGenerator comparison function test", function() {
    var js = (Webvs.compileExpr({
        test: "d = if(above(a, b), if(above(a, c), a ,  c), if(above(b, c), b, c));\n" +
              "e = if(below(a, b), if(below(a, c), a ,  c), if(below(b, c), b, c));"
    }, ["test"])).codeInst;

    js.a = 12;
    js.b = 9.23;
    js.c = 12.54;
    js.test();
    equal(js.d, 12.54, "if and above works");
    equal(js.e, 9.23, "if and below works");
});

test("ExprCodeGenerator trailing space and empty code", function() {
    var js = (Webvs.compileExpr({
        test: "   a=a+1",
        test2: "    a=a+2;",
        test3: "    "
    }, ["test", "test2", "test3"])).codeInst;
    js.a = 1;
    js.test();
    js.test2();
    js.test3();
    equal(js.a, 4, "code with trailing space should run");
});
