var path = require('path');

module.exports = {
    entry: './src/Main.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webvs.js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            { 
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            }
        ]
    }
};