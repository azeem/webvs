/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/21/13
 * Time: 10:20 AM
 * To change this template use File | Settings | File Templates.
 */

test('exprparser', function() {

    var codeGen = new Webvs.ExprCodeGenerator({
        a: "a-=a+b"
    });

    ok(typeof codeGen !== "undefined", 'Code generator can be constructed');
});