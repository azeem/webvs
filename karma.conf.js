/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/21/13
 * Time: 10:18 AM
 * To change this template use File | Settings | File Templates.
 */
module.exports = function(config) {
    config.set({
        frameworks: ["qunit"],
        files: [
            "./build/libs.js",
            "./build/webvs.js",
            "./bower_components/seedrandom/seedrandom.js",
            "./test/webgl-debug.js",
            "./test/base.js",
            "./test/**/*.test.js"
        ],
        proxies: {
            "/assert": "http://localhost:8000/test/assert/",
            "/images": "http://localhost:8000/test/images/",
            "/resources": "http://localhost:8000/resources/"
        },
        reporters: ['progress'],
        port: 9876,
        runnerPort: 9100,
        colors: true,
        logLevel: config.LOG_DEBUG,
        autoWatch: false,
        browsers: ['Firefox', 'Chrome'],
        captureTimeout: 60000
    });
};
