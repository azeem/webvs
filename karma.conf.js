/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/21/13
 * Time: 10:18 AM
 * To change this template use File | Settings | File Templates.
 */
basePath = "";

files = [
    QUNIT,
    QUNIT_ADAPTER,
    "build/libs.js",
    "build/webvs.js",
    "test/*.js"
];

reporters = ['progress'];
port = 9876;
runnerPort = 9100;
colors = true;
logLevel = LOG_DEBUG;
autoWatch = false;
browsers = ['Chrome'];
captureTimeout = 60000;
