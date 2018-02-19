/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */
import _ from 'lodash';
import {noop, glslFloatRepr} from '../utils';
import Parser from './ExprGrammar.pegjs';
import * as Ast from './Ast';
import CodeInstance from './CodeInstance';

export interface CompileResult {
    codeInst: CodeInstance;
    glslCode: string;
}

export default function compileExpr(
    codeSrc: {[name: string]: string | string[]},
    jsFuncs: string[] = [], 
    glslFuncs: string[] = [], 
    nonUniforms: string[] = []
): CompileResult {
    const codeStrings: {[name:string]: string} = {};
    for (const name in codeSrc) {
        let codeString = codeSrc[name];
        if(_.isArray(codeString)) {
            codeString = codeString.join('\n');
        }
        codeString.trim();
        if(codeString.length === 0) {
            continue;
        }
        codeStrings[name] = codeString;
    }

    // 1) Parse the code
    const codeAst = parseCode(codeStrings);
    // 2) Process the AST
    const tables = processAst(codeAst, jsFuncs, glslFuncs, nonUniforms);
    // 3) Generate code
    const codeInst = generateJs(codeAst, tables, jsFuncs);
    const glslCode = generateGlsl(codeAst, tables, glslFuncs);

    return {codeInst: codeInst, glslCode: glslCode};
};


type CodeAst = {[name:string]: Ast.Program};

function parseCode(codeSrc: {[name:string]: string}): CodeAst {
    const codeAst: CodeAst = {}; // abstract syntax tree
    for(const name in codeSrc) {
        try {
            codeAst[name] = Parser.parse(codeSrc[name]) as Ast.Program;
        } catch(e) {
            throw new Error("Error parsing " + name + " (" + e.line + ":" + e.column + ")" + " : " + e);
        }
    }
    return codeAst;
}

function isStaticExprList(exprs: Ast.Expression[]): exprs is Ast.PrimaryExpr[] {
    return exprs.every((expr) => {
        return expr instanceof Ast.PrimaryExpr;
    });
}

interface SymbolTables {
    register: {[name:string]: string[]},
    preCompute: {[uniformName:string]: string[]},
    jsVars: string[],
    glslVars: string[], 
    nonUniforms: string[], 
    uniforms: string[], 
    glslUsedFuncs: string[], 
    glslRegisters: string[]
}

function processAst(
    codeAst: CodeAst, 
    jsFuncs: string[], 
    glslFuncs: string[], 
    extraNonUniforms: string[]
): SymbolTables {
    const funcCall: {[name:string]: string[]} = {};
    const variable: {[name:string]: string[]} = {};
    const register: {[name:string]: string[]} = {};
    const preCompute: {[uniformName:string]: string[]} = {};

    let preComputeCounter = 0;

    const processNode = (ast, name) => {
        if(ast instanceof Ast.Program) {
            for(let i = 0;i < ast.statements.length;i++) {
                processNode(ast.statements[i], name);
            }
        } else if(ast instanceof Ast.BinaryExpr) {
            processNode(ast.leftOperand, name);
            processNode(ast.rightOperand, name);
        }
        else if(ast instanceof Ast.UnaryExpr) {
            processNode(ast.operand, name);
        }
        else if(ast instanceof Ast.FuncCall) {
            checkFunc(ast);

            // if its a precomputable function to be generated in glsl
            // then build a table entry
            if(glslFuncs.indexOf(name) >= 0 && glslPreComputeFuncs.indexOf(ast.funcName) >= 0) {
                const args = ast.args;
                if(!isStaticExprList(args)) {
                    throw new Error("Non Pre-Computable arguments for "+ast.funcName+" in shader code, use variables or constants");
                }
                const entry = [ast.funcName].concat(_.map(args, function(arg) {return arg.value;}));
                let uniformName;
                for(const key in preCompute) {
                    if(_.isEqual(preCompute[key], entry)) {
                        uniformName = key;
                        break;
                    }
                }
                if(!uniformName) {
                    uniformName = "__PC_" +  ast.funcName + "_" + preComputeCounter++;
                    preCompute[uniformName] = entry;
                }

                ast.preComputeUniformName = uniformName;
            }

            funcCall[name].push(ast.funcName);
            for(let i = 0;i < ast.args.length;i++) {
               processNode(ast.args[i], name);
            }
        }
        else if(ast instanceof Ast.Assignment) {
            processNode(ast.lhs, name);
            processNode(ast.expr, name);
        }
        else if(ast instanceof Ast.PrimaryExpr && ast.type === "ID") {
            variable[name].push(ast.value);
        }
        else if(ast instanceof Ast.PrimaryExpr && ast.type === "REG") {
            register[name].push(ast.value);
        }
    }


    for(const name in codeAst) {
        funcCall[name] = [];
        variable[name] = [];
        register[name] = [];

        processNode(codeAst[name], name);

        funcCall[name] = _.uniq(funcCall[name]);
        variable[name] = _.uniq(variable[name]);
        register[name] = _.uniq(register[name]);
    }

    const jsVars   = _.chain(variable).pick(jsFuncs  ).values().flatten().uniq().value();
    const glslVars = _.chain(variable).pick(glslFuncs).values().flatten().uniq().value();
    const nonUniforms = _.chain(glslVars).difference(jsVars).union(extraNonUniforms).uniq().value();
    const uniforms  = _.intersection(glslVars, jsVars);
    const glslUsedFuncs = _.chain(funcCall).pick(glslFuncs).values().flatten().uniq().value();
    const glslRegisters = _.chain(register).pick(glslFuncs).values().flatten().uniq().value();

    return {
        register, preCompute, jsVars, glslVars, nonUniforms, uniforms, glslUsedFuncs, glslRegisters
    };
}

function generateJs(codeAst: CodeAst, tables: SymbolTables, jsFuncs: string[]): CodeInstance {
    const generateNode = (ast) => {
        if(ast instanceof Ast.BinaryExpr) {
            return "(" + generateNode(ast.leftOperand) + ast.operator + generateNode(ast.rightOperand) + ")";
        }
        if(ast instanceof Ast.UnaryExpr) {
            return "(" + ast.operator + generateNode(ast.operand) + ")";
        }
        if(ast instanceof Ast.FuncCall) {
            switch(ast.funcName) {
                case "above":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        ">",
                        generateNode(ast.args[1]),
                        "?1:0)"
                    ].join("");
                case "below":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "<",
                        generateNode(ast.args[1]),
                        "?1:0)"
                    ].join("");
                case "equal":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "==",
                        generateNode(ast.args[1]),
                        "?1:0)"
                    ].join("");
                case "if":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "!==0?",
                        generateNode(ast.args[1]),
                        ":",
                        generateNode(ast.args[2]),
                        ")"
                    ].join("");
                case "select":
                    const code = ["((function() {"];
                    code.push("switch("+generateNode(ast.args[0])+") {");
                    _.each(_.takeRight(ast.args, ast.args.length-1), function(arg, i) {
                        code.push("case "+i+": return "+generateNode(arg)+";");
                    });
                    code.push("default : throw new Error('Unknown selector value in select');");
                    code.push("}}).call(this))");
                    return code.join("");
                case "sqr":
                    return "(Math.pow((" + generateNode(ast.args[0]) + "),2))";
                case "band":
                    return "((("+generateNode(ast.args[0])+")&&("+generateNode(ast.args[1])+"))?1:0)";
                case "bor":
                    return "((("+generateNode(ast.args[0])+")||("+generateNode(ast.args[1])+"))?1:0)";
                case "bnot":
                    return "((!("+generateNode(ast.args[0])+"))?1:0)";
                case "invsqrt":
                    return "(1/Math.sqrt("+generateNode(ast.args[0])+"))";
                case "atan2":
                    return "(Math.atan(("+generateNode(ast.args[0])+")/("+generateNode(ast.args[1])+")))";
                default:
                    let prefix;
                    const args = _.map(ast.args, (arg) => generateNode(arg)).join(",");
                    if(jsMathFuncs.indexOf(ast.funcName) >= 0) {
                        prefix = "Math.";
                    } else {
                        prefix = "this.";
                    }
                    return "(" + prefix + ast.funcName + "(" + args + "))";
            }
        }
        if(ast instanceof Ast.Assignment) {
            return generateNode(ast.lhs) + "=" + generateNode(ast.expr);
        }
        if(ast instanceof Ast.Program) {
            const stmts = _.map(ast.statements, (stmt)=> generateNode(stmt));
            return stmts.join(";\n");
        }
        if(ast instanceof Ast.PrimaryExpr && ast.type === "VALUE") {
            return ast.value.toString();
        }
        if(ast instanceof Ast.PrimaryExpr && ast.type === "CONST") {
            return translateConstants(ast.value).toString();
        }
        if(ast instanceof Ast.PrimaryExpr && ast.type === "ID") {
            return "this." + ast.value;
        }
        if(ast instanceof Ast.PrimaryExpr && ast.type === "REG") {
            return "this._registerBank[\"" + ast.value + "\"]";
        }
    }

    const registerUsages = _.chain(tables.register).values().flatten().uniq().value();
    const hasRandom = tables.glslUsedFuncs.indexOf("rand") >= 0;
    const codeInst = new CodeInstance(
        registerUsages,
        tables.glslRegisters,
        hasRandom,
        tables.uniforms,
        tables.preCompute
    );

    // clear all variables
    for(let i = 0;i < tables.jsVars.length;i++) {
        codeInst[tables.jsVars[i]] = 0;
    }

    // generate code
    for(let i = 0;i < jsFuncs.length;i++) {
        const name = jsFuncs[i];
        const ast = codeAst[name];
        if(ast) {
            const jsCodeString = generateNode(ast);
            codeInst[name] = new Function(jsCodeString);
        } else {
            codeInst[name] = noop;
        }
    }

    return codeInst;
}

function generateGlsl(codeAst: CodeAst, tables: SymbolTables, glslFuncs: string[]): string {
    const generateNode = (ast) => {
        if(ast instanceof Ast.BinaryExpr) {
            return "(" + generateNode(ast.leftOperand) + ast.operator + generateNode(ast.rightOperand) + ")";
        }
        if(ast instanceof Ast.UnaryExpr) {
            return "(" + ast.operator + generateNode(ast.operand) + ")";
        }
        if(ast instanceof Ast.FuncCall) {
            if(ast.preComputeUniformName) {
                return "(" + ast.preComputeUniformName + ")";
            }
            switch(ast.funcName) {
                case "above":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        ">",
                        generateNode(ast.args[1]),
                        "?1.0:0.0)"
                    ].join("");
                case "below":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "<",
                        generateNode(ast.args[1]),
                        "?1.0:0.0)"
                    ].join("");
                case "equal":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "==",
                        generateNode(ast.args[1]),
                        "?1.0:0.0)"
                    ].join("");
                case "if":
                    return [
                        "(",
                        generateNode(ast.args[0]),
                        "!=0.0?",
                        generateNode(ast.args[1]),
                        ":",
                        generateNode(ast.args[2]),
                        ")"
                    ].join("");
                case "select":
                    const selectExpr = generateNode(ast.args[0]);
                    const generateSelect = (args, i) => {
                        if(args.length == 1) {
                            return generateNode(args[0]);
                        }
                        else {
                            return [
                                "(("+selectExpr+" === "+i+")?",
                                "("+generateNode(args[0])+"):",
                                "("+generateSelect(_.takeRight(args, args.length-1), i+1)+"))"
                            ].join("");
                        }
                    };
                    return generateSelect(_.takeRight(ast.args, ast.args.length-1), 0);
                case "sqr":
                    return "(pow((" + generateNode(ast.args[0]) + "), 2))";
                case "band":
                    return "(float(("+generateNode(ast.args[0])+")&&("+generateNode(ast.args[1])+")))";
                case "bor":
                    return "(float(("+generateNode(ast.args[0])+")||("+generateNode(ast.args[1])+")))";
                case "bnot":
                    return "(float(!("+generateNode(ast.args[0])+")))";
                case "invsqrt":
                    return "(1/sqrt("+generateNode(ast.args[0])+"))";
                case "atan2":
                    return "(atan(("+generateNode(ast.args[0])+"),("+generateNode(ast.args[1])+"))";
                default:
                    const args = _.map(ast.args, (arg) => generateNode(arg)).join(",");
                    return "(" + ast.funcName + "(" + args + "))";
            }
        }
        if(ast instanceof Ast.Assignment) {
            return generateNode(ast.lhs) + "=" + generateNode(ast.expr);
        }
        if(ast instanceof Ast.Program) {
            var stmts = _.map(ast.statements, function(stmt) {return generateNode(stmt);});
            return stmts.join(";\n")+";";
        }
        if(ast instanceof Ast.PrimaryExpr && ast.type === "VALUE") {
            return glslFloatRepr(ast.value);
        }
        if(ast instanceof Ast.PrimaryExpr && ast.type === "CONST") {
            return translateConstants(ast.value).toString();
        }
        if(ast instanceof Ast.PrimaryExpr && (ast.type === "ID" || ast.type === "REG")) {
            return ast.value;
        }
    }

    let glslCode = [];

    // glsl variable declarations
    glslCode = glslCode.concat(_.map(tables.nonUniforms, (name) => {
        return "float " + name + " = 0.0;";
    }));
    glslCode = glslCode.concat(_.map(tables.uniforms, (name) => {
        return "uniform float " + name + ";";
    }));
    // include required functions in glsl
    glslCode = glslCode.concat(_.chain(tables.glslUsedFuncs).map((name) => {
        return ((name in glslFuncCode)?(glslFuncCode[name]):[]);
    }).flatten().value());

    // declarations for precomputed functions
    glslCode = glslCode.concat(_.chain(tables.preCompute).keys().map((name) => {
        return "uniform float " + name + ";";
    }).value());

    // add the functions
    for(let i = 0;i < glslFuncs.length;i++) {
        const name = glslFuncs[i];
        const ast = codeAst[name];
        if(ast) {
            const codeString = generateNode(ast);
            glslCode.push("void " + name + "() {");
            glslCode.push(codeString);
            glslCode.push("}");
        } else {
            glslCode.push("void " + name + "() {}");
        }
    }

    return glslCode.join("\n");
}

type ArgLength = number | {min: number};
const funcArgLengths: {[funcName:string]: ArgLength} = {
    "above": 2,
    "below": 2,
    "equal": 2,
    "pow": 2,
    "sqr": 1,
    "sqrt": 1,
    "invsqrt": 1,
    "floor" : 1,
    "ceil" : 1,
    "abs": 1,
    "if": 3,
    "min": 2,
    "max": 2,
    "sin": 1,
    "cos": 1,
    "tan": 1,
    "asin": 1,
    "acos": 1,
    "atan": 1,
    "atan2": 2,
    "log": 1,
    "band": 2,
    "bor": 2,
    "bnot": 1,
    "rand": 1,
    "gettime": 1,
    "getosc": 3,
    "select": {min: 2}
};

const jsMathFuncs = ["min", "max", "sin", "cos", "abs", "tan", "asin", "acos", "atan", "log", "pow", "sqrt", "floor", "ceil"];

const glslPreComputeFuncs = ["getosc", "gettime"];

const glslFuncCode = {
    "rand": [
        "uniform vec2 __randStep;",
        "vec2 __randSeed;",
        "float rand(float max) {",
        "   __randSeed += __randStep;",
        "   float val = fract(sin(dot(__randSeed.xy ,vec2(12.9898,78.233))) * 43758.5453);",
        "   return (floor(val*max)+1);",
        "}"
    ].join("\n")
};

function checkFunc(ast: Ast.FuncCall) {
    const requiredArgLength = funcArgLengths[ast.funcName];
    if(requiredArgLength === undefined) {
        throw Error("Unknown function " + ast.funcName);
    }
    if(_.isNumber(requiredArgLength)) {
        if(ast.args.length != requiredArgLength) {
            throw Error(ast.funcName + " accepts " + requiredArgLength + " arguments");
        }
    } else if(requiredArgLength.min) {
        if(ast.args.length < requiredArgLength.min) {
            throw Error(ast.funcName + " accepts atleast " + requiredArgLength.min + " arguments");
        }
    }
}

function translateConstants(value: string): number {
    switch(value) {
        case "pi": return Math.PI;
        case "e": return Math.E;
        case "phi": return 1.6180339887;
        default: throw new Error("Unknown constant " + value);
    }
}