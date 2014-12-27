/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {


Webvs.compileExpr = function(codeSrc, jsFuncs, glslFuncs, nonUniforms) {
    jsFuncs = jsFuncs || [];
    glslFuncs = glslFuncs || [];
    nonUniforms = nonUniforms || [];

    // cleanup code source
    codeSrc = _.chain(codeSrc).map(function(code, name) {
        if(_.isArray(code)) {
            code = code.join("\n");
        }
        code = code.trim();
        return [name, code];
    }).filter(function(code) { 
        return code[1].length > 0;
    }).object().value();

    // 1) Parse the code
    var codeAst = parseCode(codeSrc);
    // 2) Process the AST
    var tables = processAst(codeAst, jsFuncs, glslFuncs, nonUniforms);
    // 3) Generate code
    var codeInst = generateJs(codeAst, tables, jsFuncs);
    var glslCode = generateGlsl(codeAst, tables, glslFuncs);

    return {codeInst: codeInst, glslCode: glslCode};
};


function parseCode(codeSrc) {
    var codeAst = {}; // abstract syntax tree
    for(var name in codeSrc) {
        try {
            codeAst[name] = Webvs.PegExprParser.parse(codeSrc[name]);
        } catch(e) {
            throw new Error("Error parsing " + name + " (" + e.line + ":" + e.column + ")" + " : " + e);
        }
    }
    return codeAst;
}

function processAst(codeAst, jsFuncs, glslFuncs, extraNonUniforms) {
    var tables = {
        funcCall: {},
        variable: {},
        register: {},
        preCompute: {}
    };

    var preComputeCounter = 0;

    function processNode(ast, name) {
        var i;
        if(ast instanceof Webvs.AstProgram) {
            for(i = 0;i < ast.statements.length;i++) {
                processNode(ast.statements[i], name);
            }
        } else if(ast instanceof Webvs.AstBinaryExpr) {
            processNode(ast.leftOperand, name);
            processNode(ast.rightOperand, name);
        }
        else if(ast instanceof Webvs.AstUnaryExpr) {
            processNode(ast.operand, name);
        }
        else if(ast instanceof Webvs.AstFuncCall) {
            checkFunc(ast);

            // if its a precomputable function to be generated in glsl
            // then build a table entry
            if(_.contains(glslFuncs, name) && _.contains(glslPreComputeFuncs, ast.funcName)) {
                var allStatic = _.every(ast.args, function(arg) {
                    return arg instanceof Webvs.AstPrimaryExpr;
                });
                if(!allStatic) {
                    throw new Error("Non Pre-Computable arguments for "+ast.funcName+" in shader code, use variables or constants");
                }
                var entry = [ast.funcName].concat(_.map(ast.args, function(arg) {return arg.value;}));
                var uniformName;
                for(var key in tables.preCompute) {
                    if(tables.preCompute[key] == entry) {
                        break;
                    }
                }
                if(!uniformName) {
                    uniformName = "__PC_" +  ast.funcName + "_" + preComputeCounter++;
                    tables.preCompute[uniformName] = entry;
                }

                ast.preComputeUniformName = uniformName;
            }

            tables.funcCall[name].push(ast.funcName);
            for(i = 0;i < ast.args.length;i++) {
               processNode(ast.args[i], name);
            }
        }
        else if(ast instanceof Webvs.AstAssignment) {
            processNode(ast.lhs, name);
            processNode(ast.expr, name);
        }
        else if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "ID") {
            tables.variable[name].push(ast.value);
        }
        else if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "REG") {
            tables.register[name].push(ast.value);
        }
    }


    for(var name in codeAst) {
        tables.funcCall[name] = [];
        tables.variable[name] = [];
        tables.register[name] = [];

        processNode(codeAst[name], name);

        tables.funcCall[name] = _.uniq(tables.funcCall[name]);
        tables.variable[name] = _.uniq(tables.variable[name]);
        tables.register[name] = _.uniq(tables.register[name]);
    }

    tables.jsVars   = _.chain(tables.variable).pick(jsFuncs  ).values().flatten().uniq().value();
    tables.glslVars = _.chain(tables.variable).pick(glslFuncs).values().flatten().uniq().value();
    tables.nonUniforms = _.chain(tables.glslVars).difference(tables.jsVars).union(extraNonUniforms).uniq().value();
    tables.uniforms = _.intersection(tables.glslVars, tables.jsVars);
    tables.glslUsedFuncs = _.chain(tables.funcCall).pick(glslFuncs).values().flatten().uniq().value();
    tables.glslRegisters = _.chain(tables.register).pick(glslFuncs).values().flatten().uniq().value();

    return tables;
}

function generateJs(codeAst, tables, jsFuncs) {
    function generateNode(ast) {
        if(ast instanceof Webvs.AstBinaryExpr) {
            return "(" + generateNode(ast.leftOperand) + ast.operator + generateNode(ast.rightOperand) + ")";
        }
        if(ast instanceof Webvs.AstUnaryExpr) {
            return "(" + ast.operator + generateNode(ast.operand) + ")";
        }
        if(ast instanceof Webvs.AstFuncCall) {
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
                    var code = ["((function() {"];
                    code.push("switch("+generateNode(ast.args[0])+") {");
                    _.each(_.last(ast.args, ast.args.length-1), function(arg, i) {
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
                    var prefix;
                    var args = _.map(ast.args, function(arg) {return generateNode(arg);}).join(",");
                    if(_.contains(jsMathFuncs, ast.funcName)) {
                        prefix = "Math.";
                    } else {
                        prefix = "this.";
                    }
                    return "(" + prefix + ast.funcName + "(" + args + "))";
            }
        }
        if(ast instanceof Webvs.AstAssignment) {
            return generateNode(ast.lhs) + "=" + generateNode(ast.expr);
        }
        if(ast instanceof Webvs.AstProgram) {
            var stmts = _.map(ast.statements, function(stmt) {return generateNode(stmt);});
            return stmts.join(";\n");
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "VALUE") {
            return ast.value.toString();
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "CONST") {
            return translateConstants(ast.value).toString();
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "ID") {
            return "this." + ast.value;
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "REG") {
            return "this._registerBank[\"" + ast.value + "\"]";
        }
    }

    var i;
    var codeInst = new Webvs.CodeInstance();

    // clear all variables
    for(i = 0;i < tables.jsVars.length;i++) {
        codeInst[tables.jsVars[i]] = 0;
    }

    // generate code
    for(i = 0;i < jsFuncs.length;i++) {
        var name = jsFuncs[i];
        var ast = codeAst[name];
        if(ast) {
            var jsCodeString = generateNode(ast);
            codeInst[name] = new Function(jsCodeString);
        } else {
            codeInst[name] = Webvs.noop;
        }
    }

    codeInst._registerUsages = _.chain(tables.register).values().flatten().uniq().value();
    codeInst._glslRegisters = tables.glslRegisters;
    if(_.contains(tables.glslUsedFuncs, "rand")) {
        codeInst._hasRandom = true;
    }
    codeInst._uniforms = tables.uniforms;
    codeInst._preCompute = tables.preCompute;

    return codeInst;
}

function generateGlsl(codeAst, tables, glslFuncs) {
    function generateNode(ast) {
        if(ast instanceof Webvs.AstBinaryExpr) {
            return "(" + generateNode(ast.leftOperand) + ast.operator + generateNode(ast.rightOperand) + ")";
        }
        if(ast instanceof Webvs.AstUnaryExpr) {
            return "(" + ast.operator + generateNode(ast.operand) + ")";
        }
        if(ast instanceof Webvs.AstFuncCall) {
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
                    var selectExpr = generateNode(ast.args[0]);
                    var generateSelect = function(args, i) {
                        if(args.length == 1) {
                            return generateNode(args[0]);
                        }
                        else {
                            return [
                                "(("+selectExpr+" === "+i+")?",
                                "("+generateNode(args[0])+"):",
                                "("+generateSelect(_.last(args, args.length-1), i+1)+"))"
                            ].join("");
                        }
                    };
                    return generateSelect(_.last(ast.args, ast.args.length-1), 0);
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
                    var args = _.map(ast.args, function(arg) {return generateNode(arg);}).join(",");
                    return "(" + ast.funcName + "(" + args + "))";
            }
        }
        if(ast instanceof Webvs.AstAssignment) {
            return generateNode(ast.lhs) + "=" + generateNode(ast.expr);
        }
        if(ast instanceof Webvs.AstProgram) {
            var stmts = _.map(ast.statements, function(stmt) {return generateNode(stmt);});
            return stmts.join(";\n")+";";
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "VALUE") {
            return Webvs.glslFloatRepr(ast.value);
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "CONST") {
            return translateConstants(ast.value).toString();
        }
        if(ast instanceof Webvs.AstPrimaryExpr && (ast.type === "ID" || ast.type === "REG")) {
            return ast.value;
        }
    }

    var glslCode = [];
    var i;

    // glsl variable declarations
    glslCode = glslCode.concat(_.map(tables.nonUniforms, function(name) {
        return "float " + name + " = 0.0;";
    }));
    glslCode = glslCode.concat(_.map(tables.uniforms, function(name) {
        return "uniform float " + name + ";";
    }));
    // include required functions in glsl
    glslCode = glslCode.concat(_.chain(tables.glslUsedFuncs).map(function(name) {
        return ((name in glslFuncCode)?(glslFuncCode[name]):[]);
    }).flatten().value());

    // declarations for precomputed functions
    glslCode = glslCode.concat(_.chain(tables.preCompute).keys().map(function(name) {
        return "uniform float " + name + ";";
    }).value());

    // add the functions
    for(i = 0;i < glslFuncs.length;i++) {
        var name = glslFuncs[i];
        var ast = codeAst[name];
        if(ast) {
            var codeString = generateNode(ast);
            glslCode.push("void " + name + "() {");
            glslCode.push(codeString);
            glslCode.push("}");
        } else {
            glslCode.push("void " + name + "() {}");
        }
    }

    return glslCode.join("\n");
}

var funcArgLengths = {
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

var jsMathFuncs = ["min", "max", "sin", "cos", "abs", "tan", "asin", "acos", "atan", "log", "pow", "sqrt", "floor", "ceil"];

var glslPreComputeFuncs = ["getosc", "gettime"];

var glslFuncCode = {
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

function checkFunc(ast) {
    var requiredArgLength = funcArgLengths[ast.funcName];
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

function translateConstants(value) {
    switch(value) {
        case "pi": return Math.PI;
        case "e": return Math.E;
        case "phi": return 1.6180339887;
        default: throw new Error("Unknown constant " + value);
    }
}

})(Webvs);
