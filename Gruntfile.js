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
        ".tmp/pegs_expr_parser.js",
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
        "src/render/Voxer.js",
        "src/render/MovingParticle.js",
        "src/render/ClearScreen.js",
        "src/render/Picture.js"
    ];

    var libFiles = [
        "bower_components/underscore/underscore.js",
        "bower_components/backbone-events/backbone-events.js",
        "bower_components/stats.js/src/Stats.js",
        "bower_components/gl-matrix/dist/gl-matrix.js",
        "bower_components/webgl-obj-loader/webgl-obj-loader.js"
    ];

    grunt.initConfig({
        jshint: {
            files: ["Gruntfile.js", "src/**/*.js", "test/**/*.js"],
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
                outputFile: ".tmp/pegs_expr_parser.js",
                exportVar: "Webvs.PegExprParser",
                options: {
                    trackLineAndColumn : true,
                    cache: true
                }
            }
        },

        karma: {
            options: {
                frameworks: ["qunit"],
                plugins: ["karma-qunit", "karma-chrome-launcher", "karma-firefox-launcher"],
                files: ["./test/fixQUnit.js"].concat(libFiles, jsFiles, [
                    "./bower_components/seedrandom/seedrandom.js",
                    "./test/base.js",
                    "./test/render/Voxer.test.js"
                    //"./test/**/*.js"
                ]),
                proxies: {
                    "/assert": "http://localhost:8000/test/assert/",
                    "/images": "http://localhost:8000/test/images/",
                    "/resources": "http://localhost:8000/resources/"
                },
                reporters: ['progress'],
                port: 9876,
                runnerPort: 9100,
                colors: true,
                logLevel: "DEBUG",
                autoWatch: false,
                captureTimeout: 60000
            },
            test: {
                singleRun: true,
                browsers: ["Firefox", "Chrome"]
            },
            debug: {
                singleRun: false,
                background: true,
                browsers: ["Firefox"]
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
            test: {
                files: ["src/**/*.js", "test/**/*.js"],
                tasks: ["default", "karma:debug:run"]
            },
            build: {
                files: ["src/**/*.js", "test/**/*.js"],
                tasks: ["default"]
            }
        },

        concat: {
            build: {
                files: {
                    "build/webvs.js": jsFiles
                }
            }
        },

        uglify: {
            dist: {
                files: {
                    "build/webvs.min.js": "build/webvs.js"
                }
            }
        },

        clean: {
            build: ["build/*"]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-peg");
    grunt.loadNpmTasks("grunt-karma");
    grunt.loadNpmTasks("grunt-jsdoc");

    grunt.registerTask('default', ['jshint', 'peg', 'concat']);
    grunt.registerTask('dist', ["clean", "default", 'uglify']);

    grunt.registerTask("debug", ["connect", "watch:build"]);

    grunt.registerTask('test', ["connect", "default", 'karma:test']);
    grunt.registerTask('debug_test', ["connect", "default", "karma:debug:start", "watch:test"]);
};
