/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

/**
 * AVS expression parse and code generator.
 * Generates JS and GLSL code from avs expressions
 * @param codeSrc
 * @param externalVars list of variables that will be supplied externally
 *                     these variables will be instance values of the generated
 *                     code instance
 * @constructor
 */
function ExprCodeGenerator(codeSrc, externalVars) {
    this.codeSrc = codeSrc;
    this.externalVars = externalVars?externalVars:[];
    this._parseSrc();
}
extend(ExprCodeGenerator, Object, {
    _parseSrc: function() {
        // Generate AST and find variables usages in all the expressions
        var codeAst = {};
        var variables = [];
        var funcUsages = {};
        var registerUsages = [];
        for(var name in this.codeSrc) {
            try {
                var codeSrc = this.codeSrc[name];
                if(_.isArray(codeSrc)) {
                    codeSrc = codeSrc.join("\n");
                }
                codeAst[name] = Webvs.PegExprParser.parse(codeSrc);
                var vars = [];
                var fu = [];
                this._getVars(codeAst[name], variables, fu, registerUsages);
                funcUsages[name] = _.uniq(fu);
            } catch(e) {
                throw new Error("Error parsing " + name + "(" + e.line + ":" + e.column + ")" + " : " + e);
            }
        }
        this.codeAst = codeAst;
        this.funcUsages = funcUsages;

        // find instance variables
        this.instanceVars = _.uniq(this.externalVars.concat(variables));

        // find register variable usages
        this.registerUsages = _.uniq(registerUsages);
    },

    generateCode: function(jsFuncs, glslFuncs, treatAsNonUniform) {
        var inst = new CodeInstance();
        var that = this;
        var glsl = [];

        _.each(this.instanceVars, function(ivar) {
            // clear instance variables in code instance
            inst[ivar] = 0;

            // create declarations for instance variables in glsl
            var prefix = "";
            if(!_.contains(treatAsNonUniform, ivar)) {
                prefix = "uniform ";
            }
            glsl.push(prefix + "float " + ivar + ";");
        });

        var jsFuncList = _.intersection(_.keys(this.codeAst), jsFuncs);
        var missingJsFuncList = _.difference(jsFuncs, jsFuncList);

        // generate javascript functions and assign to code instance
        _.each(jsFuncList, function(name) {
            var ast = that.codeAst[name];
            var codeString = that._generateJs(ast);
            inst[name] = new Function(codeString);
        });
        // add noops for missing expressions
        _.each(missingJsFuncList, function(name) {
            inst[name] = noop;
        });

        var glslFuncList = _.intersection(_.keys(this.codeAst), glslFuncs);
        var missingGlslFuncList = _.difference(glslFuncs, glslFuncList);
        var glsFuncUsages = _.uniq(_.flatMap(glslFuncList, function(name) { return that.funcUsages[name]; }));

        // include required functions in glsl
        _.each(glsFuncUsages, function(name) {
            glsl.push(that.glslFuncCode[name]);
        });
        var preCompute = []; // list of precomputed bindings
        var generatedGlslFuncs = [];
        // generate glsl functions
        _.each(glslFuncList, function(name) {
            var ast = that.codeAst[name];
            var codeString = that._generateGlsl(ast, preCompute);
            generatedGlslFuncs.push("void " + name + "() {");
            generatedGlslFuncs.push(codeString);
            generatedGlslFuncs.push("}");
        });
        // add the uniform declarations for precomputed functions
        glsl = glsl.concat(_.map(preCompute, function(item) {
            return "uniform float " + item[1] + ";";
        }));
        glsl = glsl.concat(generatedGlslFuncs);
        inst._preCompute = preCompute;

        // generate noops for missing functions
        _.each(missingGlslFuncList, function(name) {
            glsl.push("void " + name + "() {}");
        });

        if(_.contains(glslFuncList, "rand")) {
            inst.hasRandom = true;
        }
        if(_.contains(glslFuncList, "gettime")) {
            inst.hasGettime = true;
        }
        inst._treatAsNonUniform = treatAsNonUniform;
        inst._registerUsages = this.registerUsages;

        return [inst, glsl.join("")];
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
        "getosc": 3
    },

    jsMathFuncs: ["sin", "cos", "abs", "tan", "asin", "acos", "atan", "log", "pow", "sqrt", "floor", "ceil"],

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
        ],
    },

    _checkFunc: function(ast) {
        var requiredArgLength = this.funcArgLengths[ast.funcName];
        if(requiredArgLength === undefined) {
            throw Error("Unknown function " + ast.funcName);
        }
        if(ast.args.length != requiredArgLength) {
            throw Error(ast.funcName + " accepts " + requiredArgLength + " arguments");
        }
    },

    _generateGlsl: function(ast, preCompute) {
        var that = this;

        if(ast instanceof AstBinaryExpr) {
            return "(" + this._generateGlsl(ast.leftOperand, preCompute) + ast.operator + this._generateGlsl(ast.rightOperand, preCompute) + ")";
        }
        if(ast instanceof AstUnaryExpr) {
            return "(" + ast.operator + this._generateGlsl(ast.operand, preCompute) + ")";
        }
        if(ast instanceof AstFuncCall) {
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
                        return arg instanceof AstPrimaryExpr;
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
                    var args = _.map(ast.args, function(arg) {return that._generateGlsl(arg, preCompute);}).join(",");
                    return "(" + ast.funcName + "(" + args + "))";
            }
        }
        if(ast instanceof AstAssignment) {
            return this._generateGlsl(ast.lhs, preCompute) + "=" + this._generateGlsl(ast.expr, preCompute);
        }
        if(ast instanceof AstProgram) {
            var stmts = _.map(ast.statements, function(stmt) {return that._generateGlsl(stmt, preCompute);});
            return declarations.concat(stmts).join(";\n")+";";
        }
        if(ast instanceof AstPrimaryExpr && ast.type === "VALUE") {
            return glslFloatRepr(ast.value);
        }
        if(ast instanceof AstPrimaryExpr && ast.type === "CONST") {
            return this._translateConstants(ast.value).toString();
        }
        if(ast instanceof AstPrimaryExpr && (ast.type === "ID" || ast.type === "REG")) {
            return ast.value;
        }
    },

    _generateJs: function(ast) {
        var prefix;
        var that = this;

        if(ast instanceof AstBinaryExpr) {
            return "(" + this._generateJs(ast.leftOperand) + ast.operator + this._generateJs(ast.rightOperand) + ")";
        }
        if(ast instanceof AstUnaryExpr) {
            return "(" + ast.operator + this._generateJs(ast.operand) + ")";
        }
        if(ast instanceof AstFuncCall) {
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
                    var args = _.map(ast.args, function(arg) {return that._generateJs(arg);}).join(",");
                    if(_.contains(this.jsMathFuncs, ast.funcName)) {
                        prefix = "Math.";
                    } else {
                        prefix = "this.";
                    }
                    return "(" + prefix + ast.funcName + "(" + args + "))";
            }
        }
        if(ast instanceof AstAssignment) {
            return this._generateJs(ast.lhs) + "=" + this._generateJs(ast.expr);
        }
        if(ast instanceof AstProgram) {
            var stmts = _.map(ast.statements, function(stmt) {return that._generateJs(stmt);});
            return stmts.join(";\n");
        }
        if(ast instanceof AstPrimaryExpr && ast.type === "VALUE") {
            return ast.value.toString();
        }
        if(ast instanceof AstPrimaryExpr && ast.type === "CONST") {
            return this._translateConstants(ast.value).toString();
        }
        if(ast instanceof AstPrimaryExpr && ast.type === "ID") {
            return "this." + ast.value;
        }
        if(ast instanceof AstPrimaryExpr && ast.type === "REG") {
            return "this._registerBank[\"" + ast.value + "\"]";
        }
    },

    _getVars: function(ast, vars, funcUsages, regUsages) {
        var that = this;

        if(ast instanceof AstBinaryExpr) {
            this._getVars(ast.leftOperand, vars, funcUsages, regUsages);
            this._getVars(ast.rightOperand, vars, funcUsages, regUsages);
        }

        else if(ast instanceof AstUnaryExpr) {
            this._getVars(ast.operand, vars, funcUsages, regUsages);
        }
        else if(ast instanceof AstFuncCall) {
            funcUsages.push(ast.funcName);
            _.each(ast.args, function(arg) {
               that._getVars(arg, vars, funcUsages, regUsages);
            });
        }
        else if(ast instanceof AstAssignment) {
            this._getVars(ast.lhs, vars, funcUsages, regUsages);
            this._getVars(ast.expr, vars, funcUsages, regUsages);
        }
        else if(ast instanceof AstProgram) {
            _.each(ast.statements, function(stmt) {
                that._getVars(stmt, vars, funcUsages, regUsages);
            });
        }
        else if(ast instanceof AstPrimaryExpr && ast.type === "ID") {
            vars.push(ast.value);
        }
        else if(ast instanceof AstPrimaryExpr && ast.type === "REG") {
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
window.Webvs.ExprCodeGenerator = ExprCodeGenerator;

/**
 * An object that encapsulated, Generated executable code
 * and its state values. Also contains implementations of
 * functions callable from expressions
 * @constructor
 */
function CodeInstance() {}
extend(CodeInstance, Object, {
    rand: function(max) { 
        return Math.floor(Math.random() * max) + 1;
    },

    gettime: function(startTime) {
        switch(startTime) {
            case 0:
                var currentTime = (new Date()).getTime();
                return (currentTime-this._bootTime)/1000;
            default: throw new Error("Invalid startTime mode for gettime call");
        }
    },

    getosc: function(band, width, channel) {
        var osc = this._analyser.getWaveform();
        var pos = Math.floor((band - width/2)*osc.length);
        var end = Math.floor((band + width/2)*osc.length);

        var sum = 0;
        for(var i = pos;i <= end;i++) {
            sum += osc[i];
        }
        return sum/(end-pos+1);
    },

    _locationCache: {},
    _getLocation: function(program, gl, name) {
        var location = this._locationCache[name];
        if(typeof location === "undefined") {
            location = gl.getUniformLocation(program, name);
            this._locationCache[name] = location;
        }
        return location;
    },

    /**
     * bind state values to uniforms
     * @param gl
     * @param program
     * @param exclude
     */
    bindUniforms: function(gl, program) {
        var that = this;
        // bind all values
        var toBeBound = _.difference(_.keys(this), this._treatAsNonUniform);
        _.each(toBeBound, function(name) {
            var value = that[name];
            if(typeof value !== "number") { return; }
            gl.uniform1f(that._getLocation(program, gl, name), value);
        });

        // bind registers
        _.each(this._registerUsages, function(name) {
            gl.uniform1f(that._getLocation(program, gl, name), this._registerBank[name]);
        });

        // bind random step value if there are usages of random
        if(this.hasRandom) {
            var step = [Math.random()/100, Math.random()/100];
            gl.uniform2fv(this._getLocation(program, gl, "__randStep"), step);
        }

        // bind time values for gettime calls
        if(this.hasGettime) {
            var time0 = ((new Date()).getTime()-this._bootTime)/1000;
            gl.uniform1f(this._getLocation(program, gl, "__gettime0"), time0);
        }

        // bind precomputed values
        _.each(this._preCompute, function(item, index) {
            var args = _.map(_.last(item, item.length-2), function(arg) {
                if(_.isString(arg)) {
                    if(arg.substring(0, 5) == "__REG") {
                        return this._registerBank[arg];
                    } else {
                        return this[arg];
                    }
                } else {
                    return arg;
                }
            });
            var result = this[item[0]].apply(this, args);
            gl.uniform1f(this._getLocation(program, gl, item[1]), result);
        });
    },

    setup: function(registerBank, bootTime, analyser) {
        this._registerBank = registerBank;
        this._bootTime = bootTime;
        this._analyser = analyser;

        // clear all used registers
        _.each(this._registerUsages, function(name) {
            if(!_.has(registerBank, name)) {
                registerBank[name] = 0;
            }
        });
    }
});

/*** Abstract Syntax Tree for AVS expressions ***/

function AstBase() {}
extend(AstBase, Object);

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

function AstFuncCall(funcName, args) {
    this.funcName = funcName;
    this.args = args;
}
extend(AstFuncCall, AstBase);

function AstAssignment(lhs, expr) {
    this.lhs = lhs;
    this.expr = expr;
}
extend(AstAssignment, AstBase);

function AstProgram(statements) {
    this.statements = statements;
}
extend(AstProgram, AstBase);

function AstPrimaryExpr(value, type) {
    this.value = value;
    this.type = type;
}
extend(AstPrimaryExpr, AstBase);
