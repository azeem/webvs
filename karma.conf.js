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
            "test/webgl-debug.js",
            "test/base.js",
            //"test/*.test.js"
            "test/trans/ChannelShift.test.js",
            "test/trans/ColorClip.test.js",
            "test/trans/ColorMap.test.js",
            "test/trans/Convolution.test.js",
            "test/trans/DynamicMovement.test.js",
            "test/trans/FadeOut.test.js",
            "test/trans/UniqueTone.test.js",
        ],
        proxies: {
            "/images": "http://localhost:8000/test/images/"
        },
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
