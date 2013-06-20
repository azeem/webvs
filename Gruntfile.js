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
            files: ["Gruntfile.js", "src/**/*.js", "demo/**/*.js"],
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
                exportVar: "Webvs.PegExprParser"
            }
        },

        concat: {
            webvs: {
                src: [
                    "src/utils.js",
                    "src/core.js",
                    "src/exprparser.js",
                    "build/pegs_expr_parser.js",
                    "src/effectlist.js",
                    "src/dancer_adapter.js",
                    "src/render/*.js",
                    "src/trans/*.js"
                ],
                dest: "build/webvs.js",
                options: {
                    stripBanners: true,
                    banner: "(function() {\n",
                    footer: "\n})();"
                }
            }
        },

        watch: {
            scripts: {
                files: ["src/**/*.js", "src/**/*.pegs"],
                tasks: ["default"]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks('grunt-peg');

    grunt.registerTask('default', ['jshint', 'peg', 'concat']);
};