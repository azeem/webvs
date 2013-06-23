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
        for(var name in this.codeSrc) {
            try {
                codeAst[name] = Webvs.PegExprParser.parse(this.codeSrc[name]);
                variables[name] = _.uniq(this._getVars(codeAst[name]));
            } catch(e) {
                throw new Error("Error parsing " + name + " : " + e);
            }
        }
        this.codeAst = codeAst;

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

    /**
     * Generates code and returns a code instance containing
     * executable functions for the avs expressions. Empty no-op
     * functions are inserted if the expression was not supplied
     * @param funcs functions to be generated.
     * @returns {CodeInstance}
     */
    generateJs: function(funcs) {
        var js = new CodeInstance();
        var that = this;

        // clear all instance variables
        _.each(this.instanceVars, function(ivar) {
            js[ivar] = 0;
        });

        // generate code and assign function
        _.each(this.codeAst, function(codeAst, name) {
            if(!_.contains(funcs, name)) {
                return;
            }
            var codeString = that._generateJs(codeAst, that.localVars[name]);
            js[name] = new Function(codeString);
        });

        // add noops for missing expressions
        _.each(_.difference(funcs, _.functions(js)), function(name) {
            js[name] = noop;
        });
        return js;
    },

    /**
     * Generates glsl code for avs expressions. Empty void-void functions
     * are generated for missing functions
     * @param funcs list of functions to be generated
     * @param treatAsNonUniform these instance variables will be treated as non uniforms
     * @returns {string} string containing generated glsl code
     */
    generateGlsl: function(funcs, treatAsNonUniform) {
        var code = [];
        var that = this;

        // generate uniform and global declarations
        _.each(this.instanceVars, function(ivar) {
            var prefix = "";
            if(!_.contains(treatAsNonUniform, ivar)) {
                prefix = "uniform ";
            }
            code.push(prefix + "float " + ivar + ";");
        });

        // generate functions
        _.each(this.codeAst, function(codeAst, name) {
            if(!_.contains(funcs, name)) {
                return;
            }
            var codeString = that._generateGlsl(codeAst, that.localVars[name]);
            code.push("void " + name + "() {");
            code.push(codeString);
            code.push("}");
        });

        // generate noops for missing functions
        _.each(_.difference(funcs, _.keys(this.codeAst)), function(name) {
            code.push("void " + name + "() {}");
        });

        return code.join("\n");
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
            var args = _.map(ast.args, function(arg) {return that._generateGlsl(arg);}).join(",");
            return "(" + this._translateGlslFuncName(ast.funcName) + "(" + args + "))";
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
            var args = _.map(ast.args, function(arg) {return that._generateJs(arg);}).join(",");
            return "(" + this._translateJsFuncName(ast.funcName) + "(" + args + "))";
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

    _getVars: function(ast) {
        var that = this;
        if(ast instanceof AstBinaryExpr) {
            var leftVars = this._getVars(ast.leftOperand);
            var rightVars = this._getVars(ast.rightOperand);
            return leftVars.concat(rightVars);
        }
        if(ast instanceof AstUnaryExpr) {
            return this._getVars(ast.operand);
        }
        if(ast instanceof AstFuncCall) {
            return _.map(ast.args, function(arg) {return that._getVars(arg);} );
        }
        if(ast instanceof AstAssignment) {
            var vars = this._getVars(ast.expr);
            return vars.concat(ast.identifier);
        }
        if(ast instanceof AstProgram) {
            return _.flatMap(ast.statements, function(stmt) {return that._getVars(stmt);});
        }
        if(ast instanceof AstPrimaryExpr) {
            if(typeof ast.value === "string" && ast.value[0] !== "$") {
                return [ast.value];
            } else {
                return [];
            }
        }
    },

    _translateGlslFuncName: function(name) {
        switch(name) {
            case "sin": return "sin";
            case "cos": return "cos";
            case "tan": return "tan";
            case "asin": return "asin";
            case "acos": return "acos";
            case "atan": return "atan";
            case "log": return "log";
            //case "rand": return "this.rand";
        }
    },

    _translateJsFuncName: function(name) {
        switch(name) {
            case "sin": return "Math.sin";
            case "cos": return "Math.cos";
            case "tan": return "Math.tan";
            case "asin": return "Math.asin";
            case "acos": return "Math.acos";
            case "atan": return "Math.atan";
            case "log": return "Math.log";
            case "rand": return "this.rand";
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

    /**
     * bind state values to uniforms
     * @param gl
     * @param program
     * @param exclude
     */
    bindUniforms: function(gl, program, exclude) {
        _.each(this, function(value, name) {
            if(typeof value !== "number") {
                return;
            }
            var location = gl.getUniformLocation(program, name);
            gl.uniform1f(location, value);
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