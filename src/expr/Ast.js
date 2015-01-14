/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

// Base class for AVS expression Syntax Tree
function AstBase() {}
Webvs.AstBase = Webvs.defineClass(AstBase, Object);

// Binary Expression
function AstBinaryExpr(operator, leftOperand, rightOperand) {
    this.operator = operator;
    this.leftOperand = leftOperand;
    this.rightOperand = rightOperand;
}
Webvs.AstBinaryExpr = Webvs.defineClass(AstBinaryExpr, AstBase);

// Unary Expression
function AstUnaryExpr(operator, operand) {
    this.operator = operator;
    this.operand = operand;
}
Webvs.AstUnaryExpr = Webvs.defineClass(AstUnaryExpr, AstBase);

// Function call
function AstFuncCall(funcName, args) {
    this.funcName = funcName;
    this.args = args;
}
Webvs.AstFuncCall = Webvs.defineClass(AstFuncCall, AstBase);

// Variable assignment
function AstAssignment(lhs, expr) {
    this.lhs = lhs;
    this.expr = expr;
}
Webvs.AstAssignment = Webvs.defineClass(AstAssignment, AstBase);

// Code start symbol
function AstProgram(statements) {
    this.statements = statements;
}
Webvs.AstProgram = Webvs.defineClass(AstProgram, AstBase);

// Atomic expression
function AstPrimaryExpr(value, type) {
    this.value = value;
    this.type = type;
}
Webvs.AstPrimaryExpr = Webvs.defineClass(AstPrimaryExpr, AstBase);

})(Webvs);
