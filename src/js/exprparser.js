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
        var variables = {};
        var funcUsages = {};
        for(var name in this.codeSrc) {
            try {
                codeAst[name] = Webvs.PegExprParser.parse(this.codeSrc[name]);
                var vars = this._getVars(codeAst[name]);
                variables[name] = _.uniq(vars[0]);
                funcUsages[name] = _.uniq(vars[1]);
            } catch(e) {
                throw new Error("Error parsing " + name + " : " + e);
            }
        }
        this.codeAst = codeAst;
        this.funcUsages = funcUsages;

        // find the variables shared between expressions
        var sharedVars = [];
        for(var vName in variables) {
            for(var vName2 in variables) {
                if(vName2 == vName) {
                    continue;
                }
                sharedVars = sharedVars.concat(_.intersection(variables[vName], variables[vName2]));
            }
        }

        this.instanceVars = _.uniq(this.externalVars.concat(sharedVars));

        // find local variables for each expression
        var localVars = {};
        for(var varName in variables) {
            localVars[varName] = _.difference(variables[varName], this.instanceVars);
        }
        this.localVars = localVars;
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
            var codeString = that._generateJs(ast, that.localVars[name]);
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
        // generate glsl functions
        _.each(glslFuncList, function(name) {
            var ast = that.codeAst[name];
            var codeString = that._generateGlsl(ast, that.localVars[name]);
            glsl.push("void " + name + "() {");
            glsl.push(codeString);
            glsl.push("}");
        });
        // generate noops for missing functions
        _.each(missingGlslFuncList, function(name) {
            glsl.push("void " + name + "() {}");
        });

        if(_.contains(glslFuncList, "rand")) {
            inst.hasRandom = true;
        }
        inst._treatAsNonUniform = treatAsNonUniform;

        return [inst, glsl.join("")];
    },

    funcArgLengths: {
        "above": 2,
        "below": 2,
        "equal": 2,
        "pow": 2,
        "if": 3,
        "sin": 1,
        "cos": 1,
        "tan": 1,
        "asin": 1,
        "acos": 1,
        "atan": 1,
        "log": 1,
        "rand": 1
    },

    jsMathFuncs: ["sin", "cos", "tan", "asin", "acos", "atan", "log", "pow"],

    glslFuncCode: {
        "rand": [
            "uniform vec2 __randStep;",
            "vec2 __randSeed;",
            "float rand(float max) {",
            "   __randCur += __randStep;",
            "   float val = fract(sin(dot(__randSeed.xy ,vec2(12.9898,78.233))) * 43758.5453);",
            "   return (floor(val*max)+1);",
            "}"
        ].join("\n")
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

    _generateGlsl: function(ast, localVars) {
        var that = this;

        if(ast instanceof AstBinaryExpr) {
            return "(" + this._generateGlsl(ast.leftOperand) + ast.operator + this._generateGlsl(ast.rightOperand) + ")";
        }
        if(ast instanceof AstUnaryExpr) {
            return "(" + ast.operator + this._generateGlsl(ast.operand) + ")";
        }
        if(ast instanceof AstFuncCall) {
            this._checkFunc(ast);
            switch(ast.funcName) {
                case "above":
                    return [
                        "(",
                        this._generateGlsl(ast.args[0]),
                        ">",
                        this._generateGlsl(ast.args[1]),
                        "?1.0:0.0)"
                    ].join("");
                case "below":
                    return [
                        "(",
                        this._generateGlsl(ast.args[0]),
                        "<",
                        this._generateGlsl(ast.args[1]),
                        "?1.0:0.0)"
                    ].join("");
                case "equal":
                    return [
                        "(",
                        this._generateGlsl(ast.args[0]),
                        "==",
                        this._generateGlsl(ast.args[1]),
                        "?1.0:0.0)"
                    ].join("");
                case "if":
                    return [
                        "(",
                        this._generateGlsl(ast.args[0]),
                        "!=0.0?",
                        this._generateGlsl(ast.args[1]),
                        ":",
                        this._generateGlsl(ast.args[2]),
                        ")"
                    ].join("");
                default:
                    var args = _.map(ast.args, function(arg) {return that._generateGlsl(arg);}).join(",");
                    return "(" + ast.funcName + "(" + args + "))";
            }
        }
        if(ast instanceof AstAssignment) {
            return ast.identifier + "=" + this._generateGlsl(ast.expr);
        }
        if(ast instanceof AstProgram) {
            var declarations = _.map(localVars, function(localVar){
                return "float " + localVar + "=0.0";
            });
            var stmts = _.map(ast.statements, function(stmt) {return that._generateGlsl(stmt);});
            return declarations.concat(stmts).join(";\n")+";";
        }
        if(ast instanceof AstPrimaryExpr) {
            var suffix = "";
            if(typeof ast.value === "number" && ast.value%1 === 0) {
                suffix = ".0";
            }
            return this._translateConstants(ast.value).toString() + suffix;
        }
    },

    _generateJs: function(ast, localVars) {
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
            prefix = "";
            if(_.contains(this.instanceVars, ast.identifier)) {
                prefix = "this.";
            }
            return prefix + ast.identifier + "=" + this._generateJs(ast.expr);
        }
        if(ast instanceof AstProgram) {
            var declarations = _.map(localVars, function(localVar){
                return "var " + localVar + "=0";
            });
            var stmts = _.map(ast.statements, function(stmt) {return that._generateJs(stmt);});
            return declarations.concat(stmts).join(";\n");
        }
        if(ast instanceof AstPrimaryExpr) {
            prefix = "";
            if(typeof ast.value === "string" && _.contains(this.instanceVars, ast.value)) {
                prefix = "this.";
            }
            return prefix + this._translateConstants(ast.value).toString();
        }
    },

    _mergeVars: function(vars1, vars2) {
        return [vars1[0].concat(vars2[0]), vars1[1].concat(vars2[1])];
    },


    _getVars: function(ast) {
        var that = this;
        var vars;

        if(ast instanceof AstBinaryExpr) {
            var leftVars = this._getVars(ast.leftOperand);
            var rightVars = this._getVars(ast.rightOperand);
            return this._mergeVars(leftVars, rightVars);
        }
        if(ast instanceof AstUnaryExpr) {
            return this._getVars(ast.operand);
        }
        if(ast instanceof AstFuncCall) {
            vars = [[],[ast.funcName]];
            _.each(ast.args, function(arg) {
               vars = that._mergeVars(vars, that._getVars(arg));
            });
            return vars;
        }
        if(ast instanceof AstAssignment) {
            vars = this._getVars(ast.expr);
            return this._mergeVars(this._getVars(ast.expr), [[ast.identifier],[]]);
        }
        if(ast instanceof AstProgram) {
            vars = [[],[]];
            _.each(ast.statements, function(stmt) {
                vars = that._mergeVars(vars, that._getVars(stmt));
            });
            return vars;
        }
        if(ast instanceof AstPrimaryExpr) {
            if(typeof ast.value === "string" && ast.value[0] !== "$") {
                return [[ast.value], []];
            } else {
                return [[], []];
            }
        }
    },

    _translateConstants: function(value) {
        switch(value) {
            case "$pi": return Math.PI;
            case "$e": return Math.E;
            case "$phi": return 1.6180339887;
            default: return value;
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
        return Math.random()*max;
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

        // bind random step value if there are usages of random
        if(this.hasRandom) {
            var step = [Math.random()/100, Math.random()/100];
            gl.uniform2fv(that._getLocation(program, gl, "__randStep"), step);
        }
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

function AstAssignment(identifier, expr) {
    this.identifier = identifier;
    this.expr = expr;
}
extend(AstAssignment, AstBase);

function AstProgram(statements) {
    this.statements = statements;
}
extend(AstProgram, AstBase);

function AstPrimaryExpr(value) {
    this.value = value;
}
extend(AstPrimaryExpr, AstBase);