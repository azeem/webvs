{
    var _ = require('lodash');
    var Ast = require('./Ast.ts');

    function makeBinaryExpr(head, tail) {
        var result = head;
        tail.forEach(function(tailItem) {
            result = new Ast.BinaryExpr(tailItem[1], result, tailItem[3]);
        });
        return result;
    }

    function flattenChars(val) {
        return _.flatten(val).join("");
    }
}

program = p:(__ statement __ (";" __ statement __)* ";"? __) {
    var stmts = [p[1]];
    stmts = stmts.concat(_.map(p[3], function(pp) {
        return pp[2];
    }));
    return new Ast.Program(stmts);
}

statement
		= lhs:assignable __ "=" __ e:expr { return new Ast.Assignment(lhs, e); }
		/ expr

unary_ops = "+" / "-"
additive_ops = "+" / "-"
multiplicative_ops = "*" / "/" / "%"
boolean_ops = "&" / "|"

expr = boolean_expr

boolean_expr
		= head:additive_expr tail:(__ boolean_ops __ additive_expr)* { return makeBinaryExpr(head, tail); }

additive_expr
		 = head:multiplicative_expr tail:(__ additive_ops __ multiplicative_expr)* { return makeBinaryExpr(head, tail); }

multiplicative_expr
		= head:unary tail:(__ multiplicative_ops __ unary)* { return makeBinaryExpr(head, tail); }

unary
		= op:unary_ops __ oper:func_call { return new Ast.UnaryExpr(op, oper); }
		/ func_call

func_call
		= funcName:([a-zA-Z_] [a-zA-Z_0-9]*) __ "(" args:((__ expr __ ",")* __ expr)? __ ")" {
		        var argsList = [];
		        _.each(args[0], function(toks) {
		            argsList.push(toks[1]);
		        });
                argsList.push(args[2]);
                return new Ast.FuncCall(flattenChars(funcName), argsList);
		}
		/ primary_expr

primary_expr
		= value
		/ constant
		/ register
	    / identifier
		/ "(" e:expr ")" { return e; }

assignable
        = register
        / identifier

identifier
		= val:([a-zA-Z_] [a-zA-Z_0-9]*) { return new Ast.PrimaryExpr(flattenChars(val).toLowerCase(), "ID"); }

constant
        = "$" val:([a-zA-Z_0-9]*) { return new Ast.PrimaryExpr(flattenChars(val).toLowerCase(), "CONST"); }

register
        = "@" val:([a-zA-Z_0-9]*)          { return new Ast.PrimaryExpr("__REG_AT_" + flattenChars(val).toLowerCase(), "REG"); }
        / val:([rR] [eE] [gG] [0-9] [0-9]) { return new Ast.PrimaryExpr("__REG_" + flattenChars(val).toLowerCase(), "REG"); }

value
		= val:([0-9]* "." [0-9]+ ([Ee] [0-9]+)?) { return new Ast.PrimaryExpr(parseFloat(flattenChars(val)), "VALUE"); }
		/ val:([a-fA-F0-9]+) [hH]                { return new Ast.PrimaryExpr(parseInt(flattenChars(val), 16), "VALUE"); }
        / val:([0-9]+) [dD]?                     { return new Ast.PrimaryExpr(parseInt(flattenChars(val), 10), "VALUE"); }

__
        = (whiteSpace / lineEnd / comment)*

whiteSpace
        = [\t\v\f \u00A0\uFEFF]

lineEnd
        = [\n\r\u2028\u2029]

comment
         = "/*" (!"*/" .)* "*/"   // multiline comment
         / "//" (!lineEnd .)*     // single line comment
