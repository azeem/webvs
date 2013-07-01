/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/11/13
 * Time: 1:32 AM
 * To change this template use File | Settings | File Templates.
 */

module.exports = function(grunt) {
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
                grammar: "src/expr_grammar.pegjs",
                outputFile: "build/pegs_expr_parser.js",
                exportVar: "Webvs.PegExprParser",
                options: {
                    trackLineAndColumn : true
                }
            }
        },

        karma: {
            webvs: {
                configFile: "karma.conf.js"//,
                //background: true
            }
        },

        concat: {
            webvs: {
                src: [
                    "src/js/utils.js",
                    "src/js/core.js",
                    "src/js/exprparser.js",
                    "build/pegs_expr_parser.js",
                    "src/js/effectlist.js",
                    "src/js/dancer_adapter.js",
                    "src/js/render/*.js",
                    "src/js/trans/*.js"
                ],
                dest: "build/webvs.js",
                options: {
                    stripBanners: true,
                    banner: "(function() {\n",
                    footer: "\n})();"
                }
            }
        },

        copy: {
            dev: {
                files:[
                    {expand: true, flatten:true, cwd: "src/", src: ["demo/**.!(html)"], dest: "build/"},
                ]
            },
            dist: {
                files: [
                    {expand: true, flatten:true, cwd: "src/", src: ["demo/**.!(html|js)"], dest: "dist/"},
                ]
            }
        },

        watch: {
            scripts: {
                files: ["src/**/*.js", "!src/**/*.test.js", "src/**/*.pegjs"],
                tasks: ["default"]
            }
//            karma: {
//                files: ["src/**/*.js", "src/**/*.pegs"],
//                tasks: ['karma:unit:run']
//            }
        },

        uglify: {
            dist: {
                files: {
                    "dist/demo.min.js": "build/demo.js",
                    "dist/webvs.min.js": "build/webvs.js",
                    "dist/libs.min.js": "lib/*.js"
                }
            }
        },

        preprocess: {
            dev: {
                options: {
                    context: {
                        mode: "dev"
                    }
                },
                src: "src/demo/index.html",
                dest: "build/index.html"
            },
            dist: {
                options: {
                    context: {
                        mode: "dist"
                    }
                },
                src: "src/demo/index.html",
                dest: "dist/index.html"
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-preprocess");
    grunt.loadNpmTasks("grunt-peg");
    grunt.loadNpmTasks("grunt-karma");

    grunt.registerTask('default', ['jshint', 'peg', 'concat', 'copy:dev', "preprocess:dev"]);
    grunt.registerTask("dist", ["default", "uglify:dist", "copy:dist", "preprocess:dist"]);
};