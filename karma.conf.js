var webpack = require('webpack');
process.env.TARGET = 'web';
var webpackConfig = require('./webpack.config');
var packageJson = require('./package.json');

module.exports = function(config) {
  config.set({
    basePath: './',
    frameworks: ['mocha'],
    mime: {
      'text/x-typescript': ['ts']
    },
    files: [
      'test/func/testIndex.ts',
      {pattern: './test/func/assert/**/*', included: false},
      {pattern: './resources/**/*', included: false}
    ],
    preprocessors: {
      'test/func/testIndex.ts': ['webpack']
    },
    webpack: {
      resolve: webpackConfig.resolve,
      module: webpackConfig.module,
      plugins: [
        new webpack.DefinePlugin({
          RESOURCE_PACK_URL: JSON.stringify('/base/resources/'),
          WEBVS_VERSION: JSON.stringify(packageJson.version)
        })
      ]
    },
    reporters: ['mocha'],
    browsers: ['Chrome'],
  })
}
