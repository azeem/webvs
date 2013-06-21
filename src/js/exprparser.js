function ExprCodeGenerator(codeSrc) {
    this.codeSrc = codeSrc;
    this._parseSrc();
}
extend(ExprCodeGenerator, Object, {    
    _parseSrc: function() {
        // parse all the src
        var codeAst;
        for(var name in this.codeSrc) {
            try {
                codeAst[name] = Webvs.PegExprParser.parse(this.codeSrc[name]);
            } catch(e) {
                throw new Error("Error parsing " + name + " : " + e);
            }
        }
    }
});
window.Webvs.ExprCodeGenerator = ExprCodeGenerator;

function AstBase() {}
extend(AstBase, Object, {
    getVars: function() {}
});

function AstBinaryExpr(operator, leftOperand, rightOperand) {
    this.operator = operator;
    this.leftOperand = leftOperand;
    this.rightOperand = rightOperand;
}
extend(AstBinaryExpr, AstBase, {
    getVars: function() {
        var leftVars = this.leftOperand.getVars();
        var rightVars = this.rightOperand.getVars();
        return leftVars.concat(rightVars);
    }
});

function AstUnaryExpr(operator, operand) {
    this.operator = operator;
    this.operand = operand;
}
extend(AstUnaryExpr, AstBase, {
    getVars: function() {
        return operand.getVars();
    }
});

function AstFuncCall(funcName, args) {
    this.funcName = funcName;
    this.args = args;
}
extend(AstFuncCall, AstBase, {
    getVars: function() {
        var vars = [];
        for(var i = 0;i < this.args.length;i++) {
            this.vars = this.vars.concat(this.args[i].getVars());
        }
        return vars;
    }
});

function AstAssignment(identifier, expr) {
    this.identifier = identifier;
    this.expr = expr;
}
extend(AstAssignment, AstBase, {
    getVars: function() {
        var vars = this.expr.getVars();
        return vars.concat(this.identifier);
    }
});

function AstProgram(statements) {
    this.statements = statements;
}
extend(AstProgram, AstBase, {
    getVars: function() {
        var vars = [];
        for(var i = 0;i < this.statements.length;i++) {
            vars = vars.concat(this.statements[i].getVars());
        }
        return vars;
    }
});

function AstPrimaryExpr(value) {
    this.value = value;
}
extend(AstPrimaryExpr, AstBase, {
    getVars: function() {
        if(typeof this.value === "string") {
            return [this.value];
        }
        return [];
    }
});