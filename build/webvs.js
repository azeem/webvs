(function() {
function extend(C, P, members) {
    var F = function() {};
    F.prototype = P.prototype;
    C.prototype = new F();
    C.super = P.prototype;
    C.prototype.constructor = C;
    if(members) {
        for(var key in members) {
            C.prototype[key] = members[key];
        }
    }
}

function noop() {}

function checkRequiredOptions(options, requiredOptions) {
    for(var i in requiredOptions) {
        var key =  requiredOptions[i];
        if(!(key in options)) {
            throw new Error("Required option " + key + "not found");
        }
    }
}

function isArray(value) {
    return Object.prototype.toString.call( value ) === '[object Array]';
}


function rand(max) {
    return Math.random()*max;
}

function assert(outcome, message) {
    if(!assert) {
        throw new Error("Assertion Failed: " + message);
    }
}

function flattenTokens(array, filter){
    if(!isArray(array)) {
        if(filter && filter(array)) {
            return [];
        }
        return array;
    }
    var flat = [];
    for (var i = 0; i < array.length; i++) {
        flat = flat.concat(flattenTokens(array[i], filter));
    }
    return flat;
}

function isWhitespace(str) {
    return (typeof str === "string" && str.match(/^(\s*)$/) !== null);
}

var requestAnimationFrame = (
    window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    function( callback ){
        return window.setTimeout(callback, 1000 / 60);
    }
);

var cancelAnimationFrame = (
    window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    function(requestId) {
        return window.clearTimeout(requestId);
    }
);
function Webvs(options) {
    checkRequiredOptions(options, ["canvas", "analyser"]);
    this.canvas = options.canvas;
    this.analyser = options.analyser;

    this._initGl();
    //this.loadPreset({clearFrame:true, components: []});
}
extend(Webvs, Object, {
    _initGl: function() {
        try {
            this.gl = this.canvas.getContext("experimental-webgl");
            this.resolution = {
                width: this.canvas.width,
                height: this.canvas.height
            };
        } catch(e) {
            throw new Error("Couldnt get webgl context" + e);
        }
    },

    loadPreset: function(preset) {
        this.preset = preset;
        this.stop();
        if(this.rootComponent) {
            this.rootComponent.destroyComponent();
        }
        this.rootComponent = new EffectList(preset);
    },

    resetCanvas: function() {
        this.stop();
        if(this.rootComponent) {
            this.rootComponent.destroyComponent();
            this.rootComponent = null;
        }
        this._initGl();
        if(this.preset) {
            this.rootComponent = new EffectList(this.preset);
        }
    },

    /**
     * Starts the animation
     */
    start: function() {
        if(!this.rootComponent) {
            return; // no preset loaded yet. cannot start!
        }

        var rootComponent = this.rootComponent;
        var promise = rootComponent.initComponent(this.gl, this.resolution, this.analyser);

        var _this = this;
        var drawFrame = function() {
            if(_this.analyser.isPlaying()) {
                rootComponent.updateComponent();
            }
            _this.animReqId = requestAnimationFrame(drawFrame);
        };

        // start rendering when the promise is  done
        promise.then(function() {
            _this.animReqId = requestAnimationFrame(drawFrame);
        });
    },

    stop: function() {
        if(typeof this.animReqId !== "undefined") {
            cancelAnimationFrame(this.animReqId);
        }
    }
});

function Component() {}
extend(Component, Object, {
    initComponent: function(gl, resolution, analyser) {
        this.gl = gl;
        this.resolution = resolution;
        this.analyser = analyser;
    },
    updateComponent: function() {},
    destroyComponent: function() {}
});

/**
 * ShaderComponent base class
 * @param gl gl context
 * @param resolution resolution of the canvas
 * @param options
 * @constructor
 */
function ShaderComponent(vertexSrc, fragmentSrc) {
    this.vertexSrc = vertexSrc;
    this.fragmentSrc = fragmentSrc;
}
extend(ShaderComponent, Component, {
    swapFrame: false,

    /**
     * Initialize the component. Called once before animation starts
     */
    initComponent: function(gl, resolution, analyser) {
        ShaderComponent.super.initComponent.call(this, gl, resolution, analyser);
        this._compileProgram(this.vertexSrc, this.fragmentSrc);
        this.resolutionLocation = this.gl.getUniformLocation(this.program, "u_resolution");
        this.init();
    },

    /**
     * Update the screen. Called for every frame of the animation
     */
    updateComponent: function() {
        ShaderComponent.super.updateComponent.apply(this, arguments);
        this.gl.uniform2f(this.resolutionLocation, this.resolution.width, this.resolution.height);
        this.update.apply(this, arguments);
    },

    destroyComponent: function() {
        var gl = this.gl;
        gl.deleteShader(this.vertex);
        gl.deleteShader(this.fragment);
        gl.deleteProgram(this.program);
    },

    _compileProgram: function(vertexSrc, fragmentSrc) {
        var gl = this.gl;
        var vertex = this._compileShader(vertexSrc, gl.VERTEX_SHADER);
        var fragment = this._compileShader(fragmentSrc, gl.FRAGMENT_SHADER);
        var program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);

        if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error("Program link Error: " + gl.getProgramInfoLog(program));
        }

        this.vertex = vertex;
        this.fragment = fragment;
        this.program = program;
    },

    _compileShader: function(shaderSrc, type) {
        var gl = this.gl;
        var shader = gl.createShader(type);
        gl.shaderSource(shader, shaderSrc);
        gl.compileShader(shader);
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error("Shader compilation Error: " + gl.getShaderInfoLog(shader));
        }
        return shader;
    }
});

/**
 * Trans component base class
 * @param fragmentSrc
 * @constructor
 */
function Trans(fragmentSrc) {
    var vertexSrc = [
        "attribute vec2 a_texCoord;",
        "varying vec2 v_texCoord;",
        "void main() {",
        "    v_texCoord = a_texCoord;",
        "    gl_Position = vec4((a_texCoord*2.0)-1.0, 0, 1);",
        "}"
    ].join("\n");
    Trans.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(Trans, ShaderComponent, {
    swapFrame: true,

    destroyComponent: function() {
        Trans.super.destroyComponent.call(this);
        var gl = this.gl;

        gl.deleteBuffer(this.texCoordBuffer);
    },

    init: function() {
        var gl = this.gl;
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                0.0,  0.0,
                1.0,  0.0,
                0.0,  1.0,
                0.0,  1.0,
                1.0,  0.0,
                1.0,  1.0
            ]),
            gl.STATIC_DRAW
        );

        this.vertexPositionLocation = gl.getAttribLocation(this.program, "a_texCoord");
        this.curRenderLocation = gl.getUniformLocation(this.program, "u_curRender");
    },

    update: function(texture) {
        var gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.curRenderLocation, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.vertexPositionLocation);
        gl.vertexAttribPointer(this.vertexPositionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
});

// Webvs constants
var constants = {
    REPLACE: 1,
    MAXIMUM: 2,
    ADDITIVE: 3
};

//put all constants into the global variable
for(var key in constants) {
    Webvs[key] = constants[key];
}

function setBlendMode(gl, mode) {
    switch(mode) {
        case constants.BLEND_REPLACE:
            gl.blendFunc(gl.ONE, gl.ZERO);
            gl.blendEquation(gl.FUNC_ADD);
            break;
        case constants.BLEND_MAXIMUM:
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.blendEquation(gl.MAX);
            break;
        default: throw new Error("Invalid blend mode");
    }
}

Webvs.rand = rand;
window.Webvs = Webvs;
function ExprCodeGenerator(codeSrc) {
    this.codeSrc = codeSrc;
}
extend(ExprCodeGenerator, Object, {    
    _parseSrc: function() {
        // parse all the src
        var codeAst;
        for(var name in this.codeSrc) {
            try {
                codeAst[name] = Webvs.PegExprParser.parse(this.codeSrc);                
            } catch(e) {
                throw new Error("Error parsing " + name + " : " + e);
            }
        }
    }
    // _getVariables: function(ast) {

    // }
});

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
Webvs.PegExprParser = (function(){
  /*
   * Generated by PEG.js 0.7.0.
   *
   * http://pegjs.majda.cz/
   */
  
  function quote(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
     return '"' + s
      .replace(/\\/g, '\\\\')  // backslash
      .replace(/"/g, '\\"')    // closing quote character
      .replace(/\x08/g, '\\b') // backspace
      .replace(/\t/g, '\\t')   // horizontal tab
      .replace(/\n/g, '\\n')   // line feed
      .replace(/\f/g, '\\f')   // form feed
      .replace(/\r/g, '\\r')   // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
      + '"';
  }
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "program": parse_program,
        "statement": parse_statement,
        "unary_ops": parse_unary_ops,
        "additive_ops": parse_additive_ops,
        "multiplicative_ops": parse_multiplicative_ops,
        "boolean_ops": parse_boolean_ops,
        "boolean_expr": parse_boolean_expr,
        "additive_expr": parse_additive_expr,
        "multiplicative_expr": parse_multiplicative_expr,
        "unary": parse_unary,
        "func_call": parse_func_call,
        "primary_expr": parse_primary_expr,
        "identifier": parse_identifier,
        "value": parse_value,
        "sep": parse_sep
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "program";
      }
      
      var pos = 0;
      var reportFailures = 0;
      var rightmostFailuresPos = 0;
      var rightmostFailuresExpected = [];
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        var escapeChar;
        var length;
        
        if (charCode <= 0xFF) {
          escapeChar = 'x';
          length = 2;
        } else {
          escapeChar = 'u';
          length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function matchFailed(failure) {
        if (pos < rightmostFailuresPos) {
          return;
        }
        
        if (pos > rightmostFailuresPos) {
          rightmostFailuresPos = pos;
          rightmostFailuresExpected = [];
        }
        
        rightmostFailuresExpected.push(failure);
      }
      
      function parse_program() {
        var result0, result1, result2, result3, result4, result5, result6, result7;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_statement();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_sep();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_sep();
          }
          if (result1 !== null) {
            result2 = [];
            pos2 = pos;
            if (input.charCodeAt(pos) === 59) {
              result3 = ";";
              pos++;
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("\";\"");
              }
            }
            if (result3 !== null) {
              result4 = [];
              result5 = parse_sep();
              while (result5 !== null) {
                result4.push(result5);
                result5 = parse_sep();
              }
              if (result4 !== null) {
                result5 = parse_statement();
                if (result5 !== null) {
                  result6 = [];
                  result7 = parse_sep();
                  while (result7 !== null) {
                    result6.push(result7);
                    result7 = parse_sep();
                  }
                  if (result6 !== null) {
                    result3 = [result3, result4, result5, result6];
                  } else {
                    result3 = null;
                    pos = pos2;
                  }
                } else {
                  result3 = null;
                  pos = pos2;
                }
              } else {
                result3 = null;
                pos = pos2;
              }
            } else {
              result3 = null;
              pos = pos2;
            }
            while (result3 !== null) {
              result2.push(result3);
              pos2 = pos;
              if (input.charCodeAt(pos) === 59) {
                result3 = ";";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\";\"");
                }
              }
              if (result3 !== null) {
                result4 = [];
                result5 = parse_sep();
                while (result5 !== null) {
                  result4.push(result5);
                  result5 = parse_sep();
                }
                if (result4 !== null) {
                  result5 = parse_statement();
                  if (result5 !== null) {
                    result6 = [];
                    result7 = parse_sep();
                    while (result7 !== null) {
                      result6.push(result7);
                      result7 = parse_sep();
                    }
                    if (result6 !== null) {
                      result3 = [result3, result4, result5, result6];
                    } else {
                      result3 = null;
                      pos = pos2;
                    }
                  } else {
                    result3 = null;
                    pos = pos2;
                  }
                } else {
                  result3 = null;
                  pos = pos2;
                }
              } else {
                result3 = null;
                pos = pos2;
              }
            }
            if (result2 !== null) {
              if (input.charCodeAt(pos) === 59) {
                result3 = ";";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\";\"");
                }
              }
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, p) {
            var stmts = flattenTokens(p, function(item) {
                return (isWhitespace(item) || item == ";");
            });
            return new AstProgram(stmts);
        })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_statement() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_identifier();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_sep();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_sep();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 61) {
              result2 = "=";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"=\"");
              }
            }
            if (result2 !== null) {
              result3 = [];
              result4 = parse_sep();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse_sep();
              }
              if (result3 !== null) {
                result4 = parse_boolean_expr();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, id, e) { return new AstAssignment(id, e); })(pos0, result0[0], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_boolean_expr();
        }
        return result0;
      }
      
      function parse_unary_ops() {
        var result0;
        
        if (input.charCodeAt(pos) === 43) {
          result0 = "+";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"+\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 45) {
            result0 = "-";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"-\"");
            }
          }
        }
        return result0;
      }
      
      function parse_additive_ops() {
        var result0;
        
        if (input.charCodeAt(pos) === 43) {
          result0 = "+";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"+\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 45) {
            result0 = "-";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"-\"");
            }
          }
        }
        return result0;
      }
      
      function parse_multiplicative_ops() {
        var result0;
        
        if (input.charCodeAt(pos) === 42) {
          result0 = "*";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"*\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 47) {
            result0 = "/";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"/\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 37) {
              result0 = "%";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"%\"");
              }
            }
          }
        }
        return result0;
      }
      
      function parse_boolean_ops() {
        var result0;
        
        if (input.charCodeAt(pos) === 38) {
          result0 = "&";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"&\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 124) {
            result0 = "|";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"|\"");
            }
          }
        }
        return result0;
      }
      
      function parse_boolean_expr() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_additive_expr();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_sep();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_sep();
          }
          if (result1 !== null) {
            result2 = parse_boolean_ops();
            if (result2 !== null) {
              result3 = [];
              result4 = parse_sep();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse_sep();
              }
              if (result3 !== null) {
                result4 = parse_boolean_expr();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, lo, op, ro) { return new AstBinaryExpr(op, lo, ro); })(pos0, result0[0], result0[2], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_additive_expr();
        }
        return result0;
      }
      
      function parse_additive_expr() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_multiplicative_expr();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_sep();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_sep();
          }
          if (result1 !== null) {
            result2 = parse_additive_ops();
            if (result2 !== null) {
              result3 = [];
              result4 = parse_sep();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse_sep();
              }
              if (result3 !== null) {
                result4 = parse_additive_expr();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, lo, op, ro) { return new AstBinaryExpr(op, lo, ro); })(pos0, result0[0], result0[2], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_multiplicative_expr();
        }
        return result0;
      }
      
      function parse_multiplicative_expr() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_unary();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_sep();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_sep();
          }
          if (result1 !== null) {
            result2 = parse_multiplicative_ops();
            if (result2 !== null) {
              result3 = [];
              result4 = parse_sep();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse_sep();
              }
              if (result3 !== null) {
                result4 = parse_multiplicative_expr();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, lo, op, ro) { return new AstBinaryExpr(op, lo, ro); })(pos0, result0[0], result0[2], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_unary();
        }
        return result0;
      }
      
      function parse_unary() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_unary_ops();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_sep();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_sep();
          }
          if (result1 !== null) {
            result2 = parse_func_call();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, op, oper) { return new AstUnaryExpr(op, oper); })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_func_call();
        }
        return result0;
      }
      
      function parse_func_call() {
        var result0, result1, result2, result3, result4, result5, result6, result7;
        var pos0, pos1, pos2, pos3;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_identifier();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_sep();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_sep();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 40) {
              result2 = "(";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"(\"");
              }
            }
            if (result2 !== null) {
              result3 = [];
              result4 = parse_sep();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse_sep();
              }
              if (result3 !== null) {
                pos2 = pos;
                result4 = [];
                pos3 = pos;
                result5 = parse_boolean_expr();
                if (result5 !== null) {
                  result6 = [];
                  result7 = parse_sep();
                  while (result7 !== null) {
                    result6.push(result7);
                    result7 = parse_sep();
                  }
                  if (result6 !== null) {
                    if (input.charCodeAt(pos) === 44) {
                      result7 = ",";
                      pos++;
                    } else {
                      result7 = null;
                      if (reportFailures === 0) {
                        matchFailed("\",\"");
                      }
                    }
                    if (result7 !== null) {
                      result5 = [result5, result6, result7];
                    } else {
                      result5 = null;
                      pos = pos3;
                    }
                  } else {
                    result5 = null;
                    pos = pos3;
                  }
                } else {
                  result5 = null;
                  pos = pos3;
                }
                while (result5 !== null) {
                  result4.push(result5);
                  pos3 = pos;
                  result5 = parse_boolean_expr();
                  if (result5 !== null) {
                    result6 = [];
                    result7 = parse_sep();
                    while (result7 !== null) {
                      result6.push(result7);
                      result7 = parse_sep();
                    }
                    if (result6 !== null) {
                      if (input.charCodeAt(pos) === 44) {
                        result7 = ",";
                        pos++;
                      } else {
                        result7 = null;
                        if (reportFailures === 0) {
                          matchFailed("\",\"");
                        }
                      }
                      if (result7 !== null) {
                        result5 = [result5, result6, result7];
                      } else {
                        result5 = null;
                        pos = pos3;
                      }
                    } else {
                      result5 = null;
                      pos = pos3;
                    }
                  } else {
                    result5 = null;
                    pos = pos3;
                  }
                }
                if (result4 !== null) {
                  result5 = [];
                  result6 = parse_sep();
                  while (result6 !== null) {
                    result5.push(result6);
                    result6 = parse_sep();
                  }
                  if (result5 !== null) {
                    result6 = parse_boolean_expr();
                    if (result6 !== null) {
                      result4 = [result4, result5, result6];
                    } else {
                      result4 = null;
                      pos = pos2;
                    }
                  } else {
                    result4 = null;
                    pos = pos2;
                  }
                } else {
                  result4 = null;
                  pos = pos2;
                }
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result5 = [];
                  result6 = parse_sep();
                  while (result6 !== null) {
                    result5.push(result6);
                    result6 = parse_sep();
                  }
                  if (result5 !== null) {
                    if (input.charCodeAt(pos) === 41) {
                      result6 = ")";
                      pos++;
                    } else {
                      result6 = null;
                      if (reportFailures === 0) {
                        matchFailed("\")\"");
                      }
                    }
                    if (result6 !== null) {
                      result0 = [result0, result1, result2, result3, result4, result5, result6];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, funcName, args) {
        		        var argsList = flattenTokens(args, function(item) {
                            return (isWhitespace(item) || item == ",");
        		        });
        		       return new AstFuncCall(funcName, argsList);
        		})(pos0, result0[0], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_primary_expr();
        }
        return result0;
      }
      
      function parse_primary_expr() {
        var result0, result1, result2;
        var pos0, pos1;
        
        result0 = parse_value();
        if (result0 === null) {
          result0 = parse_identifier();
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            if (input.charCodeAt(pos) === 40) {
              result0 = "(";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"(\"");
              }
            }
            if (result0 !== null) {
              result1 = parse_boolean_expr();
              if (result1 !== null) {
                if (input.charCodeAt(pos) === 41) {
                  result2 = ")";
                  pos++;
                } else {
                  result2 = null;
                  if (reportFailures === 0) {
                    matchFailed("\")\"");
                  }
                }
                if (result2 !== null) {
                  result0 = [result0, result1, result2];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, e) { return e; })(pos0, result0[1]);
            }
            if (result0 === null) {
              pos = pos0;
            }
          }
        }
        return result0;
      }
      
      function parse_identifier() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (/^[a-zA-Z_]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[a-zA-Z_]");
          }
        }
        if (result0 !== null) {
          result1 = [];
          if (/^[a-zA-Z_0-9]/.test(input.charAt(pos))) {
            result2 = input.charAt(pos);
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[a-zA-Z_0-9]");
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            if (/^[a-zA-Z_0-9]/.test(input.charAt(pos))) {
              result2 = input.charAt(pos);
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[a-zA-Z_0-9]");
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, val) {
        		    return flattenTokens(val).join("");
        		})(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_value() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = [];
        if (/^[0-9]/.test(input.charAt(pos))) {
          result1 = input.charAt(pos);
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("[0-9]");
          }
        }
        while (result1 !== null) {
          result0.push(result1);
          if (/^[0-9]/.test(input.charAt(pos))) {
            result1 = input.charAt(pos);
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("[0-9]");
            }
          }
        }
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 46) {
            result1 = ".";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\".\"");
            }
          }
          if (result1 !== null) {
            if (/^[0-9]/.test(input.charAt(pos))) {
              result3 = input.charAt(pos);
              pos++;
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("[0-9]");
              }
            }
            if (result3 !== null) {
              result2 = [];
              while (result3 !== null) {
                result2.push(result3);
                if (/^[0-9]/.test(input.charAt(pos))) {
                  result3 = input.charAt(pos);
                  pos++;
                } else {
                  result3 = null;
                  if (reportFailures === 0) {
                    matchFailed("[0-9]");
                  }
                }
              }
            } else {
              result2 = null;
            }
            if (result2 !== null) {
              pos2 = pos;
              if (/^[Ee]/.test(input.charAt(pos))) {
                result3 = input.charAt(pos);
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("[Ee]");
                }
              }
              if (result3 !== null) {
                if (/^[0-9]/.test(input.charAt(pos))) {
                  result5 = input.charAt(pos);
                  pos++;
                } else {
                  result5 = null;
                  if (reportFailures === 0) {
                    matchFailed("[0-9]");
                  }
                }
                if (result5 !== null) {
                  result4 = [];
                  while (result5 !== null) {
                    result4.push(result5);
                    if (/^[0-9]/.test(input.charAt(pos))) {
                      result5 = input.charAt(pos);
                      pos++;
                    } else {
                      result5 = null;
                      if (reportFailures === 0) {
                        matchFailed("[0-9]");
                      }
                    }
                  }
                } else {
                  result4 = null;
                }
                if (result4 !== null) {
                  result3 = [result3, result4];
                } else {
                  result3 = null;
                  pos = pos2;
                }
              } else {
                result3 = null;
                pos = pos2;
              }
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, val) {
        		    return parseFloat(flattenTokens(val).join(""));
        		})(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          if (/^[a-fA-F0-9]/.test(input.charAt(pos))) {
            result1 = input.charAt(pos);
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("[a-fA-F0-9]");
            }
          }
          if (result1 !== null) {
            result0 = [];
            while (result1 !== null) {
              result0.push(result1);
              if (/^[a-fA-F0-9]/.test(input.charAt(pos))) {
                result1 = input.charAt(pos);
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("[a-fA-F0-9]");
                }
              }
            }
          } else {
            result0 = null;
          }
          if (result0 !== null) {
            if (/^[hH]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[hH]");
              }
            }
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, val) {
          		    return parseInt(flattenTokens(val).join(""), 16);
          		})(pos0, result0[0]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            if (/^[0-9]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[0-9]");
              }
            }
            if (result1 !== null) {
              result0 = [];
              while (result1 !== null) {
                result0.push(result1);
                if (/^[0-9]/.test(input.charAt(pos))) {
                  result1 = input.charAt(pos);
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("[0-9]");
                  }
                }
              }
            } else {
              result0 = null;
            }
            if (result0 !== null) {
              if (/^[dD]/.test(input.charAt(pos))) {
                result1 = input.charAt(pos);
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("[dD]");
                }
              }
              result1 = result1 !== null ? result1 : "";
              if (result1 !== null) {
                result0 = [result0, result1];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, val) {
                        return parseInt(flattenTokens(val).join(""), 10);
                    })(pos0, result0[0]);
            }
            if (result0 === null) {
              pos = pos0;
            }
          }
        }
        return result0;
      }
      
      function parse_sep() {
        var result0;
        
        if (/^[' '\t\r\n]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[' '\\t\\r\\n]");
          }
        }
        return result0;
      }
      
      
      function cleanupExpected(expected) {
        expected.sort();
        
        var lastExpected = null;
        var cleanExpected = [];
        for (var i = 0; i < expected.length; i++) {
          if (expected[i] !== lastExpected) {
            cleanExpected.push(expected[i]);
            lastExpected = expected[i];
          }
        }
        return cleanExpected;
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i < Math.max(pos, rightmostFailuresPos); i++) {
          var ch = input.charAt(i);
          if (ch === "\n") {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var offset = Math.max(pos, rightmostFailuresPos);
        var found = offset < input.length ? input.charAt(offset) : null;
        var errorPosition = computeErrorPosition();
        
        throw new this.SyntaxError(
          cleanupExpected(rightmostFailuresExpected),
          found,
          offset,
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(expected, found, offset, line, column) {
    function buildMessage(expected, found) {
      var expectedHumanized, foundHumanized;
      
      switch (expected.length) {
        case 0:
          expectedHumanized = "end of input";
          break;
        case 1:
          expectedHumanized = expected[0];
          break;
        default:
          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
            + " or "
            + expected[expected.length - 1];
      }
      
      foundHumanized = found ? quote(found) : "end of input";
      
      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
    }
    
    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.message = buildMessage(expected, found);
    this.offset = offset;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();
/**
 * Special component that copies texture to target.
 * Also blends in additional texture if provided
 * @constructor
 */
function Copy(blendMode) {
    var blendEq;
    switch(blendMode) {
        case constants.REPLACE:
            blendEq = "src";
            break;
        case constants.MAXIMUM:
            blendEq = "max(src, dest)";
            break;
        case constants.ADDITIVE:
            blendEq = "clamp(src+dest, vec4(0,0,0,0), vec4(1,1,1,1))";
            break;
        default:
            throw new Error("Invalid copy blend mode");
    }

    var fragmentSrc = [
        "precision mediump float;",
        "uniform sampler2D u_curRender;",
        blendMode != constants.REPLACE?"uniform sampler2D u_destTexture;":"",
        "varying vec2 v_texCoord;",
        "void main() {",
        blendMode != constants.REPLACE?"vec4 dest = texture2D(u_destTexture, v_texCoord);":"",
        "   vec4 src = texture2D(u_curRender, v_texCoord);",
        "   gl_FragColor = " + blendEq + ";",
        "}"
    ].join("\n");
    Copy.super.constructor.call(this, fragmentSrc);
}
extend(Copy, Trans, {
    init: function() {
        var gl = this.gl;
        this.destTextureLocation = gl.getUniformLocation(this.program, "u_destTexture");
        Copy.super.init.call(this);
    },

    update: function(srcTexture, destTexture) {
        var gl = this.gl;
        if(destTexture) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, destTexture);
            gl.uniform1i(this.destTextureLocation, 1);
        }
        Copy.super.update.call(this, srcTexture);
    }
});

function EffectList(options) {
    checkRequiredOptions(options, ["components"]);

    this._constructComponent(options.components);
    this.output = options.output?options.output:constants.REPLACE;
    this.clearFrame = options.clearFrame?options.clearFrame:false;
    this.first = true;

    EffectList.super.constructor.call(this);
}
extend(EffectList, Component, {
    swapFrame: true,

    _constructComponent: function(optList) {
        var components = [];
        for(var i = 0;i < optList.length;i++) {
            var type = optList[i].type;
            var component = new Webvs[type](optList[i]);
            components.push(component);
        }
        this.components = components;
    },

    initComponent: function(gl, resolution, analyser) {
        EffectList.super.initComponent.call(this, gl, resolution, analyser);
        this._initFrameBuffer();

        var components = this.components;
        var copyComponent = new Copy(this.output);

        // initialize all the components
        var initPromises = [];
        for(var i = 0;i < components.length;i++) {
            var res = components[i].initComponent(gl, resolution, analyser);
            if(res) {
                initPromises.push(res);
            }
        }
        copyComponent.initComponent(gl, this.resolution, analyser);

        this.copyComponent = copyComponent;
        return D.all(initPromises);
    },

    updateComponent: function(inputTexture) {
        EffectList.super.updateComponent.call(this, inputTexture);
        var gl = this.gl;

        // save the current framebuffer
        var targetFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

        // switch to internal framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.resolution.width, this.resolution.height);
        this._setFBAttachment();

        if(this.clearFrame || this.first) {
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            this.first = false;
        }

        // render all the components
        var components = this.components;
        for(var i = 0;i < components.length;i++) {
            var component = components[i];
            gl.useProgram(component.program);
            if(component.swapFrame) {
                var oldTexture = this._getCurrentTextrue();
                this._swapFBAttachment();
                component.updateComponent(oldTexture);
            } else {
                component.updateComponent();
            }
        }

        // switch to old framebuffer and copy the data
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFrameBuffer);
        gl.useProgram(this.copyComponent.program);
        gl.viewport(0, 0, this.resolution.width, this.resolution.height);
        assert(inputTexture || this.output == constants.REPLACE, "Cannot blend");
        this.copyComponent.updateComponent(this.frameAttachments[this.currAttachment].texture, inputTexture);
    },

    destroyComponent: function() {
        EffectList.super.destroyComponent.call(this);
        var gl = this.gl;
        var i;

        // destory all the sub-components
        for(i = 0;i < this.components.length;i++) {
            this.components[i].destroyComponent();
        }
        this.copyComponent.destroyComponent();

        // delete the framebuffer
        for(i = 0;i < 2;i++) {
            gl.deleteRenderbuffer(this.frameAttachments[i].renderbuffer);
            gl.deleteTexture(this.frameAttachments[i].texture);
        }
        gl.deleteFramebuffer(this.framebuffer);
    },

    _initFrameBuffer: function() {
        var gl = this.gl;

        var framebuffer = gl.createFramebuffer();
        var attachments = [];
        for(var i = 0;i < 2;i++) {
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.resolution.width, this.resolution.height,
                0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            var renderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.resolution.width, this.resolution.height);

            attachments[i] = {
                texture: texture,
                renderbuffer: renderbuffer
            };
        }

        this.framebuffer = framebuffer;
        this.frameAttachments = attachments;
        this.currAttachment = 0;
    },

    _setFBAttachment: function() {
        var attachment = this.frameAttachments[this.currAttachment];
        var gl = this.gl;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, attachment.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, attachment.renderbuffer);
    },

    _getCurrentTextrue: function() {
        return this.frameAttachments[this.currAttachment].texture;
    },

    _swapFBAttachment: function() {
        this.currAttachment = (this.currAttachment + 1) % 2;
        this._setFBAttachment();
    }
});

window.Webvs.EffectList = EffectList;

function DancerAdapter(dancer) {
    this.dancer = dancer;
    this.beat = false;

    var _this = this;
    this.kick = dancer.createKick({
        onKick: function(mag) {
            _this.beat = true;
        },

        offKick: function() {
            _this.beat = false;
        }
    });
    this.kick.on();
}
extend(DancerAdapter, Object, {
    isPlaying: function() {
        return this.dancer.isPlaying();
    },

    getWaveform: function() {
        return this.dancer.getWaveform();
    },

    getSpectrum: function() {
        return this.dancer.getSpectrum();
    }
});

window.Webvs.DancerAdapter = DancerAdapter;
function OnBeatClear(options) {
    options = options?options:{};
    this.n = options.n?options.n:1;
    this.color = options.color?options.color:[0,0,0];

    if(this.color.length != 3) {
        throw new Error("Invalid clear color, must be an array of 3");
    }
    for(var i = 0;i < this.color.length;i++) {
        this.color[i] = this.color[i]/255;
    }

    this.blend = options.blend?options.blend:false;
    this.prevBeat = false;
    this.beatCount = 0;

    var vertexSrc = [
        "attribute vec2 a_position;",
        "void main() {",
        "   gl_Position = vec4(a_position, 0, 1);",
        "}"
    ].join("\n");

    var fragmentSrc = [
        "precision mediump float;",
        "uniform vec3 u_color;",
        "void main() {",
        "   gl_FragColor = vec4(u_color, 1);",
        "}"
    ].join("\n");


    OnBeatClear.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(OnBeatClear, ShaderComponent, {
    init: function() {
        var gl = this.gl;

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1,  -1,
                1,  -1,
                -1,  1,
                -1,  1,
                1,  -1,
                1,  1
            ]),
            gl.STATIC_DRAW
        );

        this.positionLocation = gl.getAttribLocation(this.program, "a_position");
        this.colorLocation = gl.getUniformLocation(this.program, "u_color");
    },

    update: function() {
        var gl = this.gl;

        var clear = false;
        if(this.analyser.beat && !this.prevBeat) {
            this.beatCount++;
            if(this.beatCount == this.n) {
                clear = true;
                this.beatCount = 0;
            }
        }
        this.prevBeat = this.analyser.beat;

        if(clear) {
            if(this.blend) {
                // do average blending
                gl.enable(gl.BLEND);
                gl.blendColor(0.5, 0.5, 0.5, 1);
                gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);
            }
            gl.uniform3fv(this.colorLocation, this.color);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.enableVertexAttribArray(this.positionLocation);
            gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            if(this.blend) {
                gl.disable(gl.BLEND);
            }
        }
    },

    destroyComponent: function() {
        OnBeatClear.super.destroyComponent.call(this);
        this.gl.deleteBuffer(this.vertexBuffer);
    }
});

window.Webvs.OnBeatClear = OnBeatClear;
function Picture(options) {
    checkRequiredOptions(options, ["src", "x", "y"]);
    this.src = options.src;
    this.x = options.x;
    this.y = options.y;
    var vertexSrc = [
        "attribute vec2 a_texCoord;",
        "varying vec2 v_texCoord;",
        "uniform vec2 u_resolution;",
        "uniform vec2 u_imageResolution;",
        "uniform vec2 u_imagePos;",

        "void main() {",
        "    v_texCoord = a_texCoord*vec2(1,-1);",
        "    vec2 clipSpace = ((a_texCoord*u_imageResolution+u_imagePos)/u_resolution)*2.0-1.0;",
        "    gl_Position = vec4(clipSpace*vec2(1, -1), 0, 1);",
        "}"
    ].join("\n");

    var fragmentSrc = [
        "precision mediump float;",
        "uniform sampler2D u_image;",
        "varying vec2 v_texCoord;",

        "void main() {",
        "   gl_FragColor = texture2D(u_image, v_texCoord);",
        "}"
    ].join("\n");
    Picture.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(Picture, ShaderComponent, {
    init: function() {
        var gl = this.gl;

        var imageTexture = gl.createTexture();
        var deferred = D();
        var image = new Image();
        image.src = this.src;
        this.imageTexture = imageTexture;
        var self = this;
        image.onload = function() {
            self.imageResolution = [image.width, image.height];
            gl.bindTexture(gl.TEXTURE_2D, imageTexture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            deferred.resolve();
        };

        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                0.0,  0.0,
                1.0,  0.0,
                0.0,  1.0,
                0.0,  1.0,
                1.0,  0.0,
                1.0,  1.0
            ]),
            gl.STATIC_DRAW
        );

        this.imageLocation = gl.getUniformLocation(this.program, "u_image");
        this.imagePosLocation = gl.getUniformLocation(this.program, "u_imagePos");
        this.imageResLocation = gl.getUniformLocation(this.program, "u_imageResolution");
        this.texCoordLocation = gl.getAttribLocation(this.program, "a_texCoord");
        return deferred.promise;
    },

    update: function() {
        var gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
        gl.uniform1i(this.imageLocation, 0);

        gl.uniform2f(this.imagePosLocation, this.x, this.y);
        gl.uniform2f(this.imageResLocation, this.imageResolution[0], this.imageResolution[1]);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.texCoordLocation);
        gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    },

    destroyComponent: function() {
        Picture.super.destroyComponent.call(this);
        var gl = this.gl;

        gl.deleteTexture(this.imageTexture);
        gl.dleteBuffer(this.texCoordBuffer);
    }
});

window.Webvs.Picture = Picture;
function SuperScope(options) {
    checkRequiredOptions(options, ["code"]);

    if(options.code in SuperScope.examples) {
        this.code = SuperScope.examples[options.code]();
    } else if(typeof(options.code) === 'function') {
        this.code = options.code();
    } else {
        throw new Error("Invalid superscope");
    }

    this.spectrum = options.spectrum?options.spectrum:false;
    this.dots = options.dots?options.dots:false;

    var colors = options.colors?options.colors:[[255,255,255]];
    for(var i = 0;i < colors.length;i++) {
        if(colors[i].length != 3) {
            throw new Error("Invalid color, must be an array of 3");
        }
        for(var j = 0;j < 3;j++) {
            colors[i][j] = colors[i][j]/255;
        }
    }
    this.colors = colors;
    this.currentColor = colors[0];
    this.maxStep = 100;

    this.step = this.maxStep; // so that we compute steps, the first time
    this.colorId = 0;
    this.colorStep = [0,0,0];

    this.thickness = options.thickness?options.thickness:1;

    this.code.init = this.code.init?this.code.init:noop;
    this.code.onBeat = this.code.onBeat?this.code.onBeat:noop;
    this.code.perFrame = this.code.perFrame?this.code.perFrame:noop;
    this.code.perPoint = this.code.perPoint?this.code.perPoint:noop;

    this.inited = false;

    var vertexSrc = [
        "attribute vec2 a_position;",
        "attribute vec3 a_color;",
        "varying vec3 v_color;",
        "uniform float u_pointSize;",
        "void main() {",
        "   gl_PointSize = u_pointSize;",
        "   gl_Position = vec4(clamp(a_position, vec2(-1,-1), vec2(1,1)), 0, 1);",
        "   v_color = a_color;",
        "}"
    ].join("\n");

    var fragmentSrc = [
        "precision mediump float;",
        "varying vec3 v_color;",
        "void main() {",
        "   gl_FragColor = vec4(v_color, 1);",
        "}"
    ].join("\n");

    SuperScope.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(SuperScope, ShaderComponent, {
    init: function() {
        var gl = this.gl;

        this.code.w = this.resolution.width;
        this.code.h = this.resolution.height;

        this.pointBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();
        this.vertexPositionLocation = gl.getAttribLocation(this.program, "a_position");
        this.vertexColorLocation = gl.getAttribLocation(this.program, "a_color");
        this.pointSizeLocation = gl.getUniformLocation(this.program, "u_pointSize");
    },

    update: function() {
        var gl = this.gl;
        var code = this.code;

        this._stepColor();
        code.red = this.currentColor[0];
        code.green = this.currentColor[1];
        code.blue = this.currentColor[2];

        if(!this.inited) {
            code.init();
            // initialize all known variables to zero
            // incase any script tries to access it before
            // its value is  initialized
            code.i = 0;
            code.v = 0;
            code.x = 0;
            code.y = 0;
            this.inited = true;
        }

        var beat = this.analyser.beat;
        code.beat = beat?1:0;
        code.perFrame();
        if(beat) {
            code.onBeat();
        }

        var nPoints = Math.floor(code.n);
        var data = this.spectrum ? this.analyser.getSpectrum() : this.analyser.getWaveform();
        var bucketSize = data.length/nPoints;
        var pbi = 0;
        var cdi = 0;

        var pointBufferData = new Float32Array((this.dots?nPoints:(nPoints*2-2)) * 2);
        var colorData = new Float32Array((this.dots?nPoints:(nPoints*2-2)) * 3);
        for(var i = 0;i < nPoints;i++) {
            var value = 0;
            var size = 0;
            for(var j = Math.floor(i*bucketSize);j < (i+1)*bucketSize;j++,size++) {
                value += data[j];
            }
            value = value/size;

            var pos = i/(nPoints-1);
            code.i = pos;
            code.v = value;
            code.perPoint();
            pointBufferData[pbi++] = code.x;
            pointBufferData[pbi++] = code.y*-1;
            colorData[cdi++] = code.red;
            colorData[cdi++] = code.green;
            colorData[cdi++] = code.blue;
            if(i !== 0 && i != nPoints-1 && !this.dots) {
                pointBufferData[pbi++] = code.x;
                pointBufferData[pbi++] = code.y*-1;
                colorData[cdi++] = code.red;
                colorData[cdi++] = code.green;
                colorData[cdi++] = code.blue;
            }
        }

        gl.uniform1f(this.pointSizeLocation, this.thickness);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, pointBufferData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.vertexPositionLocation);
        gl.vertexAttribPointer(this.vertexPositionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.vertexColorLocation);
        gl.vertexAttribPointer(this.vertexColorLocation, 3, gl.FLOAT, false, 0, 0);

        var prevLineWidth;
        if(!this.dots) {
            prevLineWidth = gl.getParameter(gl.LINE_WIDTH);
            gl.lineWidth(this.thickness);
        }

        gl.drawArrays(this.dots?gl.POINTS:gl.LINES, 0, pbi/2);

        if(!this.dots) {
            gl.lineWidth(prevLineWidth);
        }
    },

    destroyComponent: function() {
        SuperScope.super.destroyComponent.call(this);
        var gl = this.gl;

        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.colorBuffer);
    },

    _stepColor: function() {
        var i;
        if(this.colors.length > 1) {
            if(this.step == this.maxStep) {
                var curColor = this.colors[this.colorId];
                this.colorId = (this.colorId+1)%this.colors.length;
                var nextColor = this.colors[this.colorId];
                for(i = 0;i < 3;i++) {
                    this.colorStep[i] = (nextColor[i]-curColor[i])/this.maxStep;
                }
                this.step = 0;
                this.currentColor = curColor;
            } else {
                for(i = 0;i < 3;i++) {
                    this.currentColor[i] += this.colorStep[i];
                }
                this.step++;
            }
        }
    }
});
SuperScope.examples = {
    diagonalScope: function() {
        var t;
        return {
            n: 100,
            init: function() {
                t = 1;
            },
            onBeat: function() {
                t = -t;
            },
            perPoint: function() {
                var sc = 0.4*Math.sin(this.i*Math.PI);
                this.x = 2*(this.i-0.5-this.v*sc)*t;
                this.y = 2*(this.i-0.5+this.v*sc);
            }
        };
    },
    spiralGraphFun: function() {
        var t = 0;
        return {
            n: 100,
            perFrame: function() {
                t = t + 0.01;
            },
            onBeat: function() {
                this.n = 80+rand(120.0);
            },
            perPoint: function() {
                var r = this.i*Math.PI*128+t;
                this.x = Math.cos(r/64)*0.7+Math.sin(r)*0.3;
                this.y = Math.sin(r/64)*0.7+Math.cos(r)*0.3;
            }
        };
    },
    threeDScopeDish: function() {
        return {
            n: 200,
            perPoint: function() {
                var iz = 1.3+Math.sin(this.i*Math.PI*2)*(this.v+0.5)*0.88;
                var ix = Math.cos(this.i*Math.PI*2)*(this.v+0.5)*0.88;
                var iy = -0.3+Math.abs(Math.cos(this.v*3.14159));
                this.x=ix/iz;
                this.y=iy/iz;
            }
        };
    },
    vibratingWorm: function() {
        var dt = 0.01;
        var t = 0;
        var sc = 1;
        return {
            init: function() {
                this.n = this.w;
            },
            perFrame: function() {
                t=t+dt;
                dt=0.9*dt+0.001;
                if(t > 2*Math.PI) {
                    t = t-2*Math.PI;
                }
            },
            perPoint: function(i, v) {
                this.x=Math.cos(2*this.i+t)*0.9*(this.v*0.5+0.5);
                this.y=Math.sin(this.i*2+t)*0.9*(this.v*0.5+0.5);
            }
        };
    }
};

window.Webvs.SuperScope = SuperScope;
/**
 * Applies a 3x3 convolution kernel
 * @param kernel
 * @constructor
 */
function Convolution(options) {
    checkRequiredOptions(options, ["kernel"]);
    var fragmentSrc = [
        "precision mediump float;",
        "uniform vec2 u_resolution;",
        "uniform sampler2D u_curRender;",
        "varying vec2 v_texCoord;",

        "uniform float u_kernel[9];",
        "uniform float u_kernelWeight;",
        "void main() {",
        "   vec2 onePixel = vec2(1.0, 1.0)/u_resolution;",
        "   vec4 colorSum = texture2D(u_curRender, v_texCoord + onePixel * vec2(-1, 1)) * u_kernel[0] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(0, -1)) * u_kernel[1] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(1, -1)) * u_kernel[2] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(-1, 0)) * u_kernel[3] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(0, 0))  * u_kernel[4] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(1, 0))  * u_kernel[5] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(-1, 1)) * u_kernel[6] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(0, 1))  * u_kernel[7] + ",
        "                   texture2D(u_curRender, v_texCoord + onePixel * vec2(1, 1))  * u_kernel[8];",
        "   gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1.0);",
        "}"
    ].join("\n");

    if(options.kernel in Convolution.kernels) {
        this.kernel = Convolution.kernels[options.kernel];
    } else if(isArray(options.kernel) && options.kernel.length == 9) {
        this.kernel = options.kernel;
    } else {
        throw new Error("Invalid convolution kernel");
    }


    var kernelWeight = 0;
    for(var i = 0;i < this.kernel.length;i++) {
        kernelWeight += this.kernel[i];
    }
    this.kernelWeight = kernelWeight;
    Convolution.super.constructor.call(this, fragmentSrc);
}
Convolution.kernels = {
    normal: [
        0, 0, 0,
        0, 1, 0,
        0, 0, 0
    ],
    gaussianBlur: [
        0.045, 0.122, 0.045,
        0.122, 0.332, 0.122,
        0.045, 0.122, 0.045
    ],
    unsharpen: [
        -1, -1, -1,
        -1,  9, -1,
        -1, -1, -1
    ],
    emboss: [
        -2, -1,  0,
        -1,  1,  1,
        0,  1,  2
    ],
    blur: [
        1, 1, 1,
        1, 1, 1,
        1, 1, 1
    ]
};
extend(Convolution, Trans, {
    init: function() {
        var gl = this.gl;

        this.kernelLocation = gl.getUniformLocation(this.program, "u_kernel[0]");
        this.kernelWeightLocation = gl.getUniformLocation(this.program, "u_kernelWeight");
        Convolution.super.init.call(this);
    },

    update: function(texture) {
        var gl = this.gl;

        gl.uniform1fv(this.kernelLocation, this.kernel);
        gl.uniform1f(this.kernelWeightLocation, this.kernelWeight);
        Convolution.super.update.call(this, texture);
    }

});

window.Webvs.Convolution = Convolution;
function FadeOut(options) {
    options = options?options:{};
    this.speed = options.speed?options.speed:1;
    this.color = options.color?options.color:[0,0,0];

    if(this.color.length != 3) {
        throw new Error("Invalid clear color, must be an array of 3");
    }
    for(var i = 0;i < this.color.length;i++) {
        this.color[i] = this.color[i]/255;
    }

    this.frameCount = 0;
    this.maxFrameCount = Math.floor(1/this.speed);

    var vertexSrc = [
        "attribute vec2 a_position;",
        "void main() {",
        "   gl_Position = vec4(a_position, 0, 1);",
        "}"
    ].join("\n");

    var fragmentSrc = [
        "precision mediump float;",
        "uniform vec3 u_color;",
        "void main() {",
        "   gl_FragColor = vec4(u_color, 1);",
        "}"
    ].join("\n");


    FadeOut.super.constructor.call(this, vertexSrc, fragmentSrc);
}
extend(FadeOut, ShaderComponent, {
    init: function() {
        var gl = this.gl;

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1,  -1,
                1,  -1,
                -1,  1,
                -1,  1,
                1,  -1,
                1,  1
            ]),
            gl.STATIC_DRAW
        );

        this.positionLocation = gl.getAttribLocation(this.program, "a_position");
        this.colorLocation = gl.getUniformLocation(this.program, "u_color");
    },

    update: function() {
        var gl = this.gl;
        this.frameCount++;
        if(this.frameCount == this.maxFrameCount) {
            this.frameCount = 0;
            // do average blending
            gl.enable(gl.BLEND);
            gl.blendColor(0.5, 0.5, 0.5, 1);
            gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);

            gl.uniform3fv(this.colorLocation, this.color);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.enableVertexAttribArray(this.positionLocation);
            gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            gl.disable(gl.BLEND);
        }
    },

    destroyComponent: function() {
        FadeOut.super.destroyComponent.call(this);
        this.gl.deleteBuffer(this.vertexBuffer);
    }
});

window.Webvs.FadeOut = FadeOut;
})();