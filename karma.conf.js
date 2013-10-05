/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/21/13
 * Time: 10:18 AM
 * To change this template use File | Settings | File Templates.
 */
module.exports = function(config) {
    config.set({
        basePath: "",
        frameworks: ["qunit"],
        files: [
            "build/libs.js",
            "build/webvs.js",
            "test/*.js"
        ],
        reporters: ['progress'],
        port: 9876,
        runnerPort: 9100,
        colors: true,
        logLevel: config.LOG_DEBUG,
        autoWatch: true,
        browsers: ['ChromeWithWebgl'],
        captureTimeout: 60000,
        customLaunchers: {
            ChromeWithWebgl: {
                base: "Chrome",
                flags: ["--enable-webgl", "--ignore-gpu-blacklist"]
            }
        }
    });
};
