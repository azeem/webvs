export type Expression = BinaryExpr | UnaryExpr | FuncCall | PrimaryExpr;

export class BinaryExpr {
    constructor(
        public operator: string, 
        public leftOperand: Expression, 
        public rightOperand: Expression
    ) {}
}

// Unary Expression
export class UnaryExpr {
    constructor(
        public operator: string, 
        public operand: Expression
    ) {}
}

// Function call
export class FuncCall {
    constructor(
        public funcName: string, 
        public args: Expression[],
        public preComputeUniformName: string
    ) {}
}

// Variable assignment
export class Assignment {
    constructor(
        public lhs: PrimaryExpr, 
        public expr: Expression
    ) {}
}

export type Statement = Expression | Assignment;
// Code start symbol
export class Program {
    constructor(
        public statements: Statement[]
    ) {}
}

export enum PrimaryExprType {
    ID = "ID",
    CONST = "CONST",
    REG = "REG",
    VALUE = "VALUE"
}

// Atomic expression
export class PrimaryExpr  {
    constructor(
        public value: string, 
        public type: PrimaryExprType
    ) {};
}