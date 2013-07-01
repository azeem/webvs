{
    function makeBinaryExpr(head, tail) {
        var result = head;
        _.each(tail, function(tailItem) {
            result = new AstBinaryExpr(tailItem[1], result, tailItem[3]);
        });
        return result;
    }

    function flattenChars(val) {
        return _.flatten(val).join("");
    }
}

program = p:(statement __ (";" __ statement __)* ";"?) {
    var stmts = [p[0]];
    stmts = stmts.concat(_.map(p[2], function(pp) {
        return pp[2];
    }));
    return new AstProgram(stmts);
}

statement
		= lhs:assignable __ "=" __ e:expr { return new AstAssignment(lhs, e); }
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
		= op:unary_ops __ oper:func_call { return new AstUnaryExpr(op, oper); }
		/ func_call

func_call
		= funcName:([a-zA-Z_] [a-zA-Z_0-9]*) __ "(" __ args:((expr __ ",")* __ expr)? __ ")" {
		        var argsList = _.reject(_.flatten(args), function(tok) {
                    return (isWhitespace(tok) || tok == ",");
		        });
		       return new AstFuncCall(flattenChars(funcName), argsList);
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
		= val:([a-zA-Z_] [a-zA-Z_0-9]*) { return new AstPrimaryExpr(flattenChars(val).toLowerCase(), "ID"); }

constant
        = "$" val:([a-zA-Z_0-9]*) { return new AstPrimaryExpr(flattenChars(val).toLowerCase(), "CONST"); }

register
        = "@" val:([a-zA-Z_0-9]*)          { return new AstPrimaryExpr("__REG_AT_" + flattenChars(val).toLowerCase(), "REG"); }
        / val:([rR] [eE] [gG] [0-9] [0-9]) { return new AstPrimaryExpr("__REG_" + flattenChars(val).toLowerCase(), "REG"); }

value
		= val:([0-9]* "." [0-9]+ ([Ee] [0-9]+)?) { return new AstPrimaryExpr(parseFloat(flattenChars(val)), "VALUE"); }
		/ val:([a-fA-F0-9]+) [hH]                { return new AstPrimaryExpr(parseInt(flattenChars(val), 16), "VALUE"); }
        / val:([0-9]+) [dD]?                     { return new AstPrimaryExpr(parseInt(flattenChars(val), 10), "VALUE"); }

__
        = (whiteSpace / lineEnd / comment)*

whiteSpace
        = [\t\v\f \u00A0\uFEFF]

lineEnd
        = [\n\r\u2028\u2029]

comment
         = "/*" (!"*/" .)* "*/"   // multiline comment
         / "//" (!lineEnd .)*     // single line comment