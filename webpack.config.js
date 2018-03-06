var path = require('path');
var webpack = require('webpack');
var fs = require('fs');
var packageJson = require('./package.json');

function commonJsConfig(devServer) {
    let resourcePackUrl;
    if(devServer) {
        resourcePackUrl = '/resources/';
    } else {
        resourcePackUrl = 'https://unpkg.com/webvs@' + packageJson.version + '/resources/';
    }

    var config = {
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
        ],
    }

    if(devServer) {
        config.serve = {
            dev: {
                publicPath: '/dist'
            }
        };
    }

    return config;
};

function webConfig(devServer) {
    const cjsConfig = commonJsConfig(devServer);
    return Object.assign({}, cjsConfig, {
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'webvs.js',
            library: 'Webvs',
            libraryTarget: 'window',
            libraryExport: 'default'
        }
    });
}

var target = process.env.TARGET || 'all';
if(target === 'dev') {
    module.exports = webConfig(true);
} else if(target == 'all') {
    module.exports = [commonJsConfig(), webConfig()];
} else if(target === 'web') {
    module.exports = webConfig();
} else if(target === 'cjs') {
    module.exports = commonJsConfig();
} else {
    console.error('Unknown target', target);
}