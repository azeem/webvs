function AstBase() {}

function AstBinaryExpr(operator, leftOperand, rightOperand) {
    this.operator = operator;
    this.leftOperand = leftOperand;
    this.rightOperand = rightOperand;
}
extend(AstBinaryExpr, AstBase);

function AstUnaryExpr(operator, operand) {
    this.operator = operator;
    this.operand = operand;
}
extend(AstUnaryExpr, AstBase);

//function AstValue(value) {
//    this.value = value;
//}
//extend(AstValue, AstBase);
//
//function AstIdentifier(name) {
//    this.name = name;
//}
//extend(AstIdentifier, AstBase);

function AstFuncCall(funcName, args) {
    this.funcName = funcName;
    this.args = args;
}
extend(AstFuncCall, AstBase);

function AstAssignment(identifier, expr) {
    this.identifier = identifier;
    this.expr = expr;
}
extend(AstAssignment, AstBase);

function AstProgram(statements) {
    this.statements = statements;
}
extend(AstProgram, AstBase);