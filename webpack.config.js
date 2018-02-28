var path = require('path');
var webpack = require('webpack');
var fs = require('fs');
var packageJson = require('./package.json');

var resourcePackUrl = 'https://unpkg.com/webvs@' + packageJson.version + '/resources/';
console.log(resourcePackUrl);
var commonJsConfig = {
    entry: './index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webvs.node.js',
        libraryTarget: 'commonjs2'
    },
    resolve: {
        extensions: ['.ts', '.js', '.pegjs']
    },
    module: {
        rules: [
            {
                test: /\.pegjs$/,
                loader: 'pegjs-loader'
            },
            { 
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            RESOURCE_PACK_URL: JSON.stringify(resourcePackUrl),
            WEBVS_VERSION: JSON.stringify(packageJson.version)
        })
    ]
};

var webConfig = Object.assign({}, commonJsConfig, {
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webvs.js',
        library: 'Webvs',
        libraryTarget: 'window'
    }
});

module.exports = function(env) {
    var target = (env && env.TARGET) || 'all';
    if(target == 'all') {
        return [commonJsConfig, webConfig];
    } else if(target === 'web') {
        return webConfig;
    } else {
        return commonJsConfig;
    }
}