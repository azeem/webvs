{
    function makeBinaryExpr(head, tail) {
        var result = head;
        _.each(tail, function(tailItem) {
            result = new AstBinaryExpr(tailItem[1], result, tailItem[3]);
        });
        return result;
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
		= id:identifier __ "=" __ e:expr { return new AstAssignment(id, e); }
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
		= funcName:funcNameIdentifier __ "(" __ args:((expr __ ",")* __ expr)? __ ")" {
		        var argsList = _.reject(_.flatten(args), function(tok) {
                    return (isWhitespace(tok) || tok == ",");
		        });
		       return new AstFuncCall(funcName, argsList);
		}
		/ primary_expr

primary_expr
		= val:value      {return new AstPrimaryExpr(val);}
		/ id:identifier  {return new AstPrimaryExpr(id);}
		/ "(" e:expr ")" { return e; }

identifier
		= val:([a-zA-Z_$] [a-zA-Z_0-9]*) { return _.flatten(val).join("").toLowerCase(); }

funcNameIdentifier
        = val:([a-zA-Z_] [a-zA-Z_0-9]*) { return _.flatten(val).join("").toLowerCase(); }

value
		= val:([0-9]* "." [0-9]+ ([Ee] [0-9]+)?) {
		    return parseFloat(_.flatten(val).join(""));
		}
		/ val:([a-fA-F0-9]+) [hH] {
		    return parseInt(_.flatten(val).join(""), 16);
		}
        / val:([0-9]+) [dD]? {
            return parseInt(_.flatten(val).join(""), 10);
        }

__
        = (whiteSpace / lineEnd / comment)*

whiteSpace
        = [\t\v\f \u00A0\uFEFF]

lineEnd
        = [\n\r\u2028\u2029]

comment
         = "/*" (!"*/" .)* "*/"   // multiline comment
         / "//" (!lineEnd .)*     // single line comment