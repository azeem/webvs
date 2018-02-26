var path = require('path');

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
    }
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
    var target = env.TARGET || 'all';
    if(target == 'all') {
        return [commonJsConfig, webConfig];
    } else if(target === 'web') {
        return webConfig;
    } else {
        return commonJsConfig;
    }
}