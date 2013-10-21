/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * Base class for AVS expression Syntax Tree
 * @memberof Webvs
 */
function AstBase() {}
Webvs.AstBase = Webvs.defineClass(AstBase, Object);

/**
 * @class
 * Binary Expression
 * @augments Webvs.AstBase
 * @param {string} operator
 * @param {string} leftOperand
 * @param {string} rightOperand
 * @memberof Webvs
 */
function AstBinaryExpr(operator, leftOperand, rightOperand) {
    this.operator = operator;
    this.leftOperand = leftOperand;
    this.rightOperand = rightOperand;
}
Webvs.AstBinaryExpr = Webvs.defineClass(AstBinaryExpr, AstBase);

/**
 * @class
 * Unary Expression
 * @augments Webvs.AstBase
 * @param {string} operator
 * @param {string} operand
 * @memberof Webvs
 */
function AstUnaryExpr(operator, operand) {
    this.operator = operator;
    this.operand = operand;
}
Webvs.AstUnaryExpr = Webvs.defineClass(AstUnaryExpr, AstBase);

/**
 * @class
 * Function call
 * @augments Webvs.AstBase
 * @param {string} funcName - function identifier
 * @param {Array.<AstBase>} args - argument expressions
 * @memberof Webvs
 */
function AstFuncCall(funcName, args) {
    this.funcName = funcName;
    this.args = args;
}
Webvs.AstFuncCall = Webvs.defineClass(AstFuncCall, AstBase);

/**
 * @class
 * Variable assignment
 * @augments Webvs.AstBase
 * @param {string} lhs - identifier
 * @param {Array.<AstBase>} expr - expression being assigned
 * @memberof Webvs
 */
function AstAssignment(lhs, expr) {
    this.lhs = lhs;
    this.expr = expr;
}
Webvs.AstAssignment = Webvs.defineClass(AstAssignment, AstBase);

/**
 * @class
 * Code start symbol
 * @augments Webvs.AstBase
 * @param {Array.<AstBase>} statements - statements in the program
 * @memberof Webvs
 */
function AstProgram(statements) {
    this.statements = statements;
}
Webvs.AstProgram = Webvs.defineClass(AstProgram, AstBase);

/**
 * @class
 * Atomic expression
 * @augments Webvs.AstBase
 * @param value
 * @param {String} type - type of the atom viz. "ID", "CONST", "REG", "VALUE"
 * @memberof Webvs
 */
function AstPrimaryExpr(value, type) {
    this.value = value;
    this.type = type;
}
Webvs.AstPrimaryExpr = Webvs.defineClass(AstPrimaryExpr, AstBase);

})(Webvs);
