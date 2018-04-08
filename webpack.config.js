var path = require('path');
var webpack = require('webpack');
var fs = require('fs');
var packageJson = require('./package.json');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');

function commonJsConfig(resourcePackUrl) {
    if(!resourcePackUrl) {
        resourcePackUrl = 'https://unpkg.com/webvs@' + packageJson.version + '/resources/';
    }

    return {
        entry: './index.ts',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'webvs.node.js',
            libraryTarget: 'commonjs2',
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
};

function webConfig(devServer, production) {
    const config = commonJsConfig(devServer ? '/resources/' : null);

    config.output = {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: 'Webvs',
        libraryTarget: 'window',
        libraryExport: 'default'
    };

    if (devServer) {
        config.serve = {
            dev: {
                publicPath: '/dist'
            },
        };
        config.output.publicPath = '/dist';
    }

    if (production) {
        config.entry = {
            "webvs": "./index.ts",
            "webvs.min": "./index.ts",
        };
        config.plugins.push(new UglifyJSPlugin({
            minimize: true,
            include: /\.min\.js$/
        }));
    } else {
        config.entry = {
            "webvs": ["./index.ts"]
        };
    }
    return config;
}

var target = process.env.TARGET || 'all';
if(target === 'dev') {
    module.exports = webConfig(true);
} else if(target == 'all') {
    module.exports = [commonJsConfig(), webConfig(false, true)];
} else if(target === 'web') {
    module.exports = webConfig();
} else if(target === 'cjs') {
    module.exports = commonJsConfig();
} else {
    console.error('Unknown target', target);
}