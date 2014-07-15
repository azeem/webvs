/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/11/13
 * Time: 1:32 AM
 * To change this template use File | Settings | File Templates.
 */

module.exports = function(grunt) {
    var jsFiles = [
        "src/Base.js",
        "src/Resources.js",
        "src/ResourceManager.js",

        "src/analyser/*.js",

        "src/Main.js",
        "src/Component.js",
        "src/Container.js",
        "src/EffectList.js",

        "src/webgl/ShaderProgram.js",
        "src/webgl/QuadBoxProgram.js",
        "src/webgl/CopyProgram.js",
        "src/webgl/FrameBufferManager.js",
        "src/webgl/ClearScreenProgram.js",

        "src/expr/Ast.js",
        "build/pegs_expr_parser.js",
        "src/expr/CodeInstance.js",
        "src/expr/CodeGenerator.js",

        "src/misc/GlobalVar.js",
        "src/misc/BufferSave.js",

        "src/trans/FadeOut.js",
        "src/trans/Convolution.js",
        "src/trans/ColorMap.js",
        "src/trans/ColorClip.js",
        "src/trans/DynamicMovement.js",
        "src/trans/Movement.js",
        "src/trans/ChannelShift.js",
        "src/trans/UniqueTone.js",
        "src/trans/Invert.js",
        "src/trans/Mosaic.js",
        "src/trans/Mirror.js",

        "src/render/SuperScope.js",
        "src/render/Simple.js",
        "src/render/Texer.js",
        "src/render/MovingParticle.js",
        "src/render/ClearScreen.js",
        "src/render/Picture.js"
    ];

    var libFiles = [
        "bower_components/underscore/underscore.js",
        "bower_components/backbone-events/backbone-events.js",
        "bower_components/stats.js/src/Stats.js"
    ];

    grunt.initConfig({
        jshint: {
            files: ["Gruntfile.js", "src/**/*.js"],
            options: {
                globals: {
                    Webvs: true
                },
                evil: true
            }
        },

        peg: {
            expr_lang: {
                grammar: "src/expr/ExprGrammar.pegjs",
                outputFile: "build/pegs_expr_parser.js",
                exportVar: "Webvs.PegExprParser",
                options: {
                    trackLineAndColumn : true,
                    cache: true
                }
            }
        },

        karma: {
            options: {
                configFile: "karma.conf.js"
            },
            test: {
                singleRun: true
            },
            debug: {
                singleRun: false,
                background: true
            }
        },

        jsdoc : {
            dist : {
                src: ["src/**/*.js", "README.md"], 
                options: {
                    template: "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
                    destination: 'doc',
                    configure: "jsdoc.conf.js"
                }
            }
        },

        connect: {
            server: {
                options: {
                    port: 8000,
                    base: ".",
                    directory: "."
                }
            }
        },

        watch: {
            scripts: {
                files: ["src/**/*.js"],
                tasks: ["default"]
            },

            doc: {
                files: ["src/**/*.js"],
                tasks: ["doc"]
            }
        },

        concat: {
            dev: {
                files: {
                    "build/webvs.js": jsFiles,
                    "build/libs.js": libFiles
                }
            }
        },

        uglify: {
            dist: {
                files: {
                    "dist/webvs.min.js": jsFiles,
                    "dist/libs.min.js": libFiles,
                    "dist/webvs.full.min.js": libFiles.concat(jsFiles)
                }
            }
        },

        clean: {
            build: ["build/*"],
            dist: ["dist/*"],
            doc: ["doc/*"]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-peg");
    grunt.loadNpmTasks("grunt-karma");
    grunt.loadNpmTasks("grunt-jsdoc");

    grunt.registerTask('default', ['clean:build', 'jshint', 'peg', 'concat:dev']);
    grunt.registerTask("doc", ["clean:doc", "jsdoc"]);
    grunt.registerTask('dist', ["default", 'uglify:dist']);
    grunt.registerTask('test', ["connect", "default", 'karma:test']);

    grunt.registerTask('debug', ["connect", "default", "watch:scripts"]);
    grunt.registerTask('debug_build', ["default", "watch:scripts"]);
    grunt.registerTask('debug_test', ["connect", "default", "karma:debug", "watch:scripts"]);
};
