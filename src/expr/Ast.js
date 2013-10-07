/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/*** Abstract Syntax Tree for AVS expressions ***/

function AstBase() {}
Webvs.AstBase = Webvs.defineClass(AstBase, Object);

function AstBinaryExpr(operator, leftOperand, rightOperand) {
    this.operator = operator;
    this.leftOperand = leftOperand;
    this.rightOperand = rightOperand;
}
Webvs.AstBinaryExpr = Webvs.defineClass(AstBinaryExpr, AstBase);

function AstUnaryExpr(operator, operand) {
    this.operator = operator;
    this.operand = operand;
}
Webvs.AstUnaryExpr = Webvs.defineClass(AstUnaryExpr, AstBase);

function AstFuncCall(funcName, args) {
    this.funcName = funcName;
    this.args = args;
}
Webvs.AstFuncCall = Webvs.defineClass(AstFuncCall, AstBase);

function AstAssignment(lhs, expr) {
    this.lhs = lhs;
    this.expr = expr;
}
Webvs.AstAssignment = Webvs.defineClass(AstAssignment, AstBase);

function AstProgram(statements) {
    this.statements = statements;
}
Webvs.AstProgram = Webvs.defineClass(AstProgram, AstBase);

function AstPrimaryExpr(value, type) {
    this.value = value;
    this.type = type;
}
Webvs.AstPrimaryExpr = Webvs.defineClass(AstPrimaryExpr, AstBase);

})(Webvs);
