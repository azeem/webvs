{
    function makeBinaryExpr(head, tail) {
        var result = head;
        _.each(tail, function(tailItem) {
            result = new AstBinaryExpr(tailItem[1], result, tailItem[3]);
        });
        return result;
    }
}

program = p:(statement sep* (";" sep* statement sep*)* ";"?) {
    var stmts = _.reject(_.flatten(p), function(tok) {
        return (isWhitespace(tok) || tok == ";")
    });
    return new AstProgram(stmts);
}

statement
		= id:identifier sep* "=" sep* e:expr { return new AstAssignment(id, e); }
		/ expr

unary_ops = "+" / "-"
additive_ops = "+" / "-"
multiplicative_ops = "*" / "/" / "%"
boolean_ops = "&" / "|"

expr = boolean_expr

boolean_expr
		= head:additive_expr tail:(sep* boolean_ops sep* additive_expr)* { return makeBinaryExpr(head, tail); }

additive_expr
		 = head:multiplicative_expr tail:(sep* additive_ops sep* multiplicative_expr)* { return makeBinaryExpr(head, tail); }

multiplicative_expr
		= head:unary tail:(sep* multiplicative_ops sep* unary)* { return makeBinaryExpr(head, tail); }

unary
		= op:unary_ops sep* oper:func_call { return new AstUnaryExpr(op, oper); }
		/ func_call

func_call
		= funcName:identifier sep* "(" sep* args:((expr sep* ",")* sep* expr)? sep* ")" {
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
		= val:([a-zA-Z_$] [a-zA-Z_0-9]*) {
		    return _.flatten(val).join("").toLowerCase();
		}

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


sep
	= [' '\t\r\n]