/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * AVS expression parser and code generator.
 * Generates JS and GLSL code from avs expressions
 * @param {object.<string, string>} codeSrc - object containing avs expression code string
 * @param {Array.<string>} externalVars - list of variables that will be supplied externally.
 * @memberof Webvs
 * @constructor
 */
function ExprCodeGenerator(codeSrc) {
    this.codeSrc = {};
    for(var key in codeSrc) {
        var code = codeSrc[key];
        if(_.isArray(code)) {
            code = code.join("\n");
        }
        code = code.trim();
        if(code !== "") {
            this.codeSrc[key] = code;
        }
    }
    this._parseSrc();
}
Webvs.ExprCodeGenerator = Webvs.defineClass(ExprCodeGenerator, Object, {
    _parseSrc: function() {
        // Generate AST and find variables usages in all the expressions
        var codeAst = {};
        var variables = [];
        var funcUsages = {};
        var registerUsages = [];
        for(var name in this.codeSrc) {
            try {
                var codeSrc = this.codeSrc[name];
                codeAst[name] = Webvs.PegExprParser.parse(codeSrc);
                var vars = [];
                var fu = [];
                this._getVars(codeAst[name], variables, fu, registerUsages);
                funcUsages[name] = fu;
            } catch(e) {
                throw new Error("Error parsing " + name + "(" + e.line + ":" + e.column + ")" + " : " + e);
            }
        }
        this.codeAst = codeAst;
        this.funcUsages = funcUsages;

        // find instance variables
        this.instanceVars = _.uniq(variables);

        // find register variable usages
        this.registerUsages = _.uniq(registerUsages);
    },

    /**
     * Generates js and glsl executable code for each expression code string
     * @param {Array.<string>} jsFuncs - functions to be generated as javascript
     * @param {Array.<string>} jsFuncs - functions to be generated as glsl
     * @param {Array.<string>} treatAsNonUniform - variables to be treated as 
     *                                             uniform variables in the glsl code
     * @returns {Array} pair containing {@link Webvs.CodeInstance} and a glsl code
     * @memberof Webvs.ExprCodeGenerator#
     */
    generateJs: function(jsFuncs) {
        var codeInst = new Webvs.CodeInstance();

        _.each(this.instanceVars, function(ivar) {
            codeInst[ivar] = 0;
        });

        var jsFuncList = _.intersection(_.keys(this.codeAst), jsFuncs);
        var missingJsFuncList = _.difference(jsFuncs, jsFuncList);

        // generate javascript functions and assign to code instance
        _.each(jsFuncList, function(name) {
            var ast = this.codeAst[name];
            var codeString = this._generateJs(ast);
            codeInst[name] = new Function(codeString);
        }, this);
        // add noops for missing expressions
        _.each(missingJsFuncList, function(name) {
            codeInst[name] = Webvs.noop;
        });

        codeInst._registerUsages = this.registerUsages;

        return codeInst;
    },

    generateGlsl: function(glslFuncs, treatAsNonUniform, codeInst) {
        var glsl = [];
        treatAsNonUniform = treatAsNonUniform || [];

        _.each(_.difference(this.instanceVars, treatAsNonUniform), function(ivar) {
            // create declarations for instance variables in glsl
            glsl.push("uniform float " + ivar + ";");
        });
        _.each(treatAsNonUniform, function(nuvar) {
            // create declarations and init for non uniform variables in glsl
            glsl.push("float " + nuvar + " = 0.0;");
        });

        var glslFuncList = _.intersection(_.keys(this.codeAst), glslFuncs);
        var missingGlslFuncList = _.difference(glslFuncs, glslFuncList);
        var glsFuncUsages = _.uniq(
            _.flatMap(glslFuncList, function(name) { return this.funcUsages[name]; }, this)
        );

        // include required functions in glsl
        _.each(glsFuncUsages, function(usage) {
            var code = this.glslFuncCode[usage];
            if(!code) {
                return;
            }
            glsl.push(code);
        }, this);
        var preCompute = []; // list of precomputed bindings
        var generatedGlslFuncs = [];
        // generate glsl functions
        _.each(glslFuncList, function(name) {
            var ast = this.codeAst[name];
            var codeString = this._generateGlsl(ast, preCompute);
            generatedGlslFuncs.push("void " + name + "() {");
            generatedGlslFuncs.push(codeString);
            generatedGlslFuncs.push("}");
        }, this);
        // add the uniform declarations for precomputed functions
        glsl = glsl.concat(_.map(preCompute, function(item) {
            return "uniform float " + item[1] + ";";
        }));
        glsl = glsl.concat(generatedGlslFuncs);

        // generate noops for missing functions
        _.each(missingGlslFuncList, function(name) {
            glsl.push("void " + name + "() {}");
        });

        // create required bindings in the code instance
        codeInst._preCompute = preCompute;
        if(_.contains(glslFuncList, "rand")) {
            codeInst._hasRandom = true;
        }
        if(_.contains(glslFuncList, "gettime")) {
            codeInst._hasGettime = true;
        }
        codeInst._instanceVars = this.instanceVars;

        return glsl.join("\n");
    },

    funcArgLengths: {
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
    },

    jsMathFuncs: ["min", "max", "sin", "cos", "abs", "tan", "asin", "acos", "atan", "log", "pow", "sqrt", "floor", "ceil"],

    glslFuncCode: {
        "rand": [
            "uniform vec2 __randStep;",
            "vec2 __randSeed;",
            "float rand(float max) {",
            "   __randCur += __randStep;",
            "   float val = fract(sin(dot(__randSeed.xy ,vec2(12.9898,78.233))) * 43758.5453);",
            "   return (floor(val*max)+1);",
            "}"
        ].join("\n"),
        "gettime": [
            "uniform float __gettime0;",
            "int gettime(int startTime) {",
            "   int time = 0;",
            "   if(startTime == 0) {",
            "       time = __gettime0;",
            "   }",
            "   return time;",
            "}"
        ].join("\n")
    },

    _checkFunc: function(ast) {
        var requiredArgLength = this.funcArgLengths[ast.funcName];
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
    },

    _generateGlsl: function(ast, preCompute) {

        if(ast instanceof Webvs.AstBinaryExpr) {
            return "(" + this._generateGlsl(ast.leftOperand, preCompute) + ast.operator + this._generateGlsl(ast.rightOperand, preCompute) + ")";
        }
        if(ast instanceof Webvs.AstUnaryExpr) {
            return "(" + ast.operator + this._generateGlsl(ast.operand, preCompute) + ")";
        }
        if(ast instanceof Webvs.AstFuncCall) {
            this._checkFunc(ast);
            switch(ast.funcName) {
                case "above":
                    return [
                        "(",
                        this._generateGlsl(ast.args[0], preCompute),
                        ">",
                        this._generateGlsl(ast.args[1], preCompute),
                        "?1.0:0.0)"
                    ].join("");
                case "below":
                    return [
                        "(",
                        this._generateGlsl(ast.args[0], preCompute),
                        "<",
                        this._generateGlsl(ast.args[1], preCompute),
                        "?1.0:0.0)"
                    ].join("");
                case "equal":
                    return [
                        "(",
                        this._generateGlsl(ast.args[0], preCompute),
                        "==",
                        this._generateGlsl(ast.args[1], preCompute),
                        "?1.0:0.0)"
                    ].join("");
                case "if":
                    return [
                        "(",
                        this._generateGlsl(ast.args[0], preCompute),
                        "!=0.0?",
                        this._generateGlsl(ast.args[1], preCompute),
                        ":",
                        this._generateGlsl(ast.args[2], preCompute),
                        ")"
                    ].join("");
                case "select":
                    var selectExpr = this._generateGlsl(ast.args[0], preCompute);
                    var that = this;
                    var generateSelect = function(args, i) {
                        if(args.length == 1) {
                            return that._generateGlsl(args[0], preCompute);
                        }
                        else {
                            return [
                                "(("+selectExpr+" === "+i+")?",
                                "("+that._generateGlsl(args[0], preCompute)+"):",
                                "("+generateSelect(_.last(args, args.length-1), i+1)+"))"
                            ].join("");
                        }
                    };
                    return generateSelect(_.last(ast.args, ast.args.length-1), 0);
                case "sqr":
                    return "(pow((" + this._generateGlsl(ast.args[0], preCompute) + "), 2))";
                case "band":
                    return "(float(("+this._generateGlsl(ast.args[0], preCompute)+")&&("+this._generateGlsl(ast.args[1], preCompute)+")))";
                case "bor":
                    return "(float(("+this._generateGlsl(ast.args[0], preCompute)+")||("+this._generateGlsl(ast.args[1], preCompute)+")))";
                case "bnot":
                    return "(float(!("+this._generateGlsl(ast.args[0], preCompute)+")))";
                case "invsqrt":
                    return "(1/sqrt("+this._generateGlsl(ast.args[0], preCompute)+"))";
                case "atan2":
                    return "(atan(("+this._generateGlsl(ast.args[0], preCompute)+"),("+this._generateGlsl(ast.args[1], preCompute)+"))";
                case "getosc":
                    var allStatic = _.every(ast.args, function(arg) {
                        return arg instanceof Webvs.AstPrimaryExpr;
                    });
                    if(!allStatic) {
                        throw new Error("Non Pre-Computable arguments for getosc in shader code, use variables or constants");
                    }
                    var uniformName = "__PC_" +  ast.funcName + "_" + pos;
                    var item = [ast.funcName, uniformName].concat(_.map(ast.args, function(arg) {return arg.value;}));
                    var pos = _.indexOf(preCompute, item);
                    if(pos == -1) {
                        preCompute.push(item);
                        pos = preCompute.length-1;
                    }
                    return uniformName;
                default:
                    var args = _.map(ast.args, function(arg) {return this._generateGlsl(arg, preCompute);}, this).join(",");
                    var funcName = ast.funcName;
                    if(_.contains(this.varArgFuncs, ast.funcName)) {
                        funcName += ast.args.length;
                    }
                    return "(" + funcName + "(" + args + "))";
            }
        }
        if(ast instanceof Webvs.AstAssignment) {
            return this._generateGlsl(ast.lhs, preCompute) + "=" + this._generateGlsl(ast.expr, preCompute);
        }
        if(ast instanceof Webvs.AstProgram) {
            var stmts = _.map(ast.statements, function(stmt) {return this._generateGlsl(stmt, preCompute);}, this);
            return stmts.join(";\n")+";";
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "VALUE") {
            return Webvs.glslFloatRepr(ast.value);
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "CONST") {
            return this._translateConstants(ast.value).toString();
        }
        if(ast instanceof Webvs.AstPrimaryExpr && (ast.type === "ID" || ast.type === "REG")) {
            return ast.value;
        }
    },

    _generateJs: function(ast) {
        var prefix;

        if(ast instanceof Webvs.AstBinaryExpr) {
            return "(" + this._generateJs(ast.leftOperand) + ast.operator + this._generateJs(ast.rightOperand) + ")";
        }
        if(ast instanceof Webvs.AstUnaryExpr) {
            return "(" + ast.operator + this._generateJs(ast.operand) + ")";
        }
        if(ast instanceof Webvs.AstFuncCall) {
            this._checkFunc(ast);
            switch(ast.funcName) {
                case "above":
                    return [
                        "(",
                        this._generateJs(ast.args[0]),
                        ">",
                        this._generateJs(ast.args[1]),
                        "?1:0)"
                    ].join("");
                case "below":
                    return [
                        "(",
                        this._generateJs(ast.args[0]),
                        "<",
                        this._generateJs(ast.args[1]),
                        "?1:0)"
                    ].join("");
                case "equal":
                    return [
                        "(",
                        this._generateJs(ast.args[0]),
                        "==",
                        this._generateJs(ast.args[1]),
                        "?1:0)"
                    ].join("");
                case "if":
                    return [
                        "(",
                        this._generateJs(ast.args[0]),
                        "!==0?",
                        this._generateJs(ast.args[1]),
                        ":",
                        this._generateJs(ast.args[2]),
                        ")"
                    ].join("");
                case "select":
                    var code = ["((function() {"];
                    code.push("switch("+this._generateJs(ast.args[0])+") {");
                    _.each(_.last(ast.args, ast.args.length-1), function(arg, i) {
                        code.push("case "+i+": return "+this._generateJs(arg)+";");
                    }, this);
                    code.push("default : throw new Error('Unknown selector value in select');");
                    code.push("}}).call(this))");
                    return code.join("");
                case "sqr":
                    return "(Math.pow((" + this._generateJs(ast.args[0]) + "),2))";
                case "band":
                    return "((("+this._generateJs(ast.args[0])+")&&("+this._generateJs(ast.args[1])+"))?1:0)";
                case "bor":
                    return "((("+this._generateJs(ast.args[0])+")||("+this._generateJs(ast.args[1])+"))?1:0)";
                case "bnot":
                    return "((!("+this._generateJs(ast.args[0])+"))?1:0)";
                case "invsqrt":
                    return "(1/Math.sqrt("+this._generateJs(ast.args[0])+"))";
                case "atan2":
                    return "(Math.atan(("+this._generateJs(ast.args[0])+")/("+this._generateJs(ast.args[1])+")))";
                default:
                    var args = _.map(ast.args, function(arg) {return this._generateJs(arg);}, this).join(",");
                    if(_.contains(this.jsMathFuncs, ast.funcName)) {
                        prefix = "Math.";
                    } else {
                        prefix = "this.";
                    }
                    return "(" + prefix + ast.funcName + "(" + args + "))";
            }
        }
        if(ast instanceof Webvs.AstAssignment) {
            return this._generateJs(ast.lhs) + "=" + this._generateJs(ast.expr);
        }
        if(ast instanceof Webvs.AstProgram) {
            var stmts = _.map(ast.statements, function(stmt) {return this._generateJs(stmt);}, this);
            return stmts.join(";\n");
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "VALUE") {
            return ast.value.toString();
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "CONST") {
            return this._translateConstants(ast.value).toString();
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "ID") {
            return "this." + ast.value;
        }
        if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "REG") {
            return "this._registerBank[\"" + ast.value + "\"]";
        }
    },

    _getVars: function(ast, vars, funcUsages, regUsages) {
        if(ast instanceof Webvs.AstBinaryExpr) {
            this._getVars(ast.leftOperand, vars, funcUsages, regUsages);
            this._getVars(ast.rightOperand, vars, funcUsages, regUsages);
        }

        else if(ast instanceof Webvs.AstUnaryExpr) {
            this._getVars(ast.operand, vars, funcUsages, regUsages);
        }
        else if(ast instanceof Webvs.AstFuncCall) {
            funcUsages.push(ast.funcName);
            _.each(ast.args, function(arg) {
               this._getVars(arg, vars, funcUsages, regUsages);
            }, this);
        }
        else if(ast instanceof Webvs.AstAssignment) {
            this._getVars(ast.lhs, vars, funcUsages, regUsages);
            this._getVars(ast.expr, vars, funcUsages, regUsages);
        }
        else if(ast instanceof Webvs.AstProgram) {
            _.each(ast.statements, function(stmt) {
                this._getVars(stmt, vars, funcUsages, regUsages);
            }, this);
        }
        else if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "ID") {
            vars.push(ast.value);
        }
        else if(ast instanceof Webvs.AstPrimaryExpr && ast.type === "REG") {
            regUsages.push(ast.value);
        }
    },

    _translateConstants: function(value) {
        switch(value) {
            case "pi": return Math.PI;
            case "e": return Math.E;
            case "phi": return 1.6180339887;
            default: throw new Error("Unknown constant " + value);
        }
    }
});

})(Webvs);
