/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

test('ExprCodeGenerator GLSL Generation', function() {
    var codeGen = new Webvs.ExprCodeGenerator({
        init: "c=200;f=0;dt=0;dl=0;beatdiv=8",
        perFrame: [
            "f = f + 1;",
            "t = ((f * $PI * 2)/c)/beatdiv;",
            "dt = dl + t;",
            "dx = 14+(cos(dt)*8);",
            "dy = 10+(sin(dt*2)*4);"
        ].join("\n"),
        onBeat: "c=f;f=0;dl=dt",
        perPixel: "x=x+(sin(y*dx)*.03); y=rand(y)-(cos(x*dy)*.03);"
    }, ["x", "y", "r", "d", "b", "w", "h"]);

    var glslExpect = "float x;\nfloat y;\nfloat r;\nfloat d;\nuniform float b;\nuniform float w;\nuniform float h;\nuniform float c;\nuniform float f;\nuniform float dt;\nuniform float dl;\nuniform float beatdiv;\nuniform float t;\nuniform float dx;\nuniform float dy;\nuniform vec2 __randStep;\nvec2 __randSeed;\nfloat rand(float max) {\n   __randCur += __randStep;\n   float val = fract(sin(dot(__randSeed.xy ,vec2(12.9898,78.233))) * 43758.5453);\n   return (floor(val*max)+1);\n}\nvoid perPixel() {\nx=(x+((sin((y*dx)))*0.03));\ny=((rand(y))-((cos((x*dy)))*0.03));\n}";
    var js = codeGen.generateJs(["init", "perFrame", "onBeat"]);
    var glsl = codeGen.generateGlsl(["perPixel"], ["x", "y", "d", "r"], js);

    equal(glsl, glslExpect, "Glsl code can be generated");
});

test("ExprCodeGenerator comments", function() {
    var codeGen = new Webvs.ExprCodeGenerator({
        test: [
            "a = a + 1;// this is a single line comment",
            "a = pow( /*this is a comment in between*/ a, 2);",
            "b = a + 1; /* this comment spans mutliple",
            "lines */ c = b"
        ].join("\n")
    }, ["a", "c"]);
    var js= codeGen.generateJs(["test"]);
    js.a = 1;
    js.test();
    equal(js.c, 5, "comments are supported");
});

test("ExprCodeGenerator register support", function() {
    var codeGen1 = new Webvs.ExprCodeGenerator({
        test: "@hello = a;reg12 = a;"
    }, ["a"]);

    var codeGen2 = new Webvs.ExprCodeGenerator({
        test: "b = @hello + 1;c = reg12 + 2"
    }, ["b", "c"]);

    var js1 = codeGen1.generateJs(["test"]);
    var js2 = codeGen2.generateJs(["test"]);

    var dummyMain = {
        registerBank: {},
        canvas: {
            width: 100,
            height: 100
        }
    }
    js1.setup(dummyMain, {});
    js2.setup(dummyMain, {});

    js1.a = 10;
    js1.test();
    js2.test();
    equal(js2.b, 11, "register variables with @ syntax works");
    equal(js2.c, 12, "register variables with regXX syntax works");
});

test("ExprCodeGenerator comparison function test", function() {
    var codeGen = new Webvs.ExprCodeGenerator({
        test: "d = if(above(a, b), if(above(a, c), a ,  c), if(above(b, c), b, c));\n" +
              "e = if(below(a, b), if(below(a, c), a ,  c), if(below(b, c), b, c));"
    }, ["a", "b", "c", "d", "e"]);

    var js = codeGen.generateJs(["test"]);
    js.a = 12;
    js.b = 9.23;
    js.c = 12.54;
    js.test();
    equal(js.d, 12.54, "if and above works");
    equal(js.e, 9.23, "if and below works");
});

test("ExprCodeGenerator trailing space and empty code", function() {
    var codeGen = new Webvs.ExprCodeGenerator({
        test: "   a=a+1;",
        test2: "    a=a+2;",
        test3: "    "
    });
    var js = codeGen.generateJs(["test", "test2", "test3"]);
    js.a = 1;
    js.test();
    js.test2();
    js.test3();
    equal(js.a, 4, "code with trailing space should run");
});
