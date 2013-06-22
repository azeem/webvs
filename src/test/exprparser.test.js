/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/21/13
 * Time: 10:20 AM
 * To change this template use File | Settings | File Templates.
 */

test('exprparser', function() {
    var codeGen = new Webvs.ExprCodeGenerator({
        init: "n=800",
        perFrame: "t=t-v*0.5",
        onBeat: "t=t+0.3;n=100+rand(900);",
        perPoint: "d=D/n;r=(i-(t*3)); x=(atan(r+d-t)*cos(r+d-t+i)); y=((i+cos(d+v*1.2))-1.5)*1.7;z=-(cos(t+i)+log(v)*cos(r*3))*3;red=cos(r)+1;blue=sin(r);green=sin(i)/2"
    }, ["n", "v", "i", "x", "y", "red", "green", "blue"]);

    var js = codeGen.generateJs();
    console.log(codeGen.instanceVars);
    console.log(codeGen.localVars);
    console.log("n = " + js.n);

    ok(typeof codeGen !== "undefined", 'Code generator can be constructed');
    deepEqual(codeGen.localVars.perPoint, ["b"], "Code variables can be extracted");
    deepEqual(codeGen.sharedVars, ["a"], "Code Shared variables can be extracted");

    deepEqual(codeGen.generateJs().perPoint, "var b=0;\nthis.a=((this.a)+(b))", "Javascript code can be generated");
});