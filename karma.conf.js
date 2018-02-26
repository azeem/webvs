var webpackConfig = require('./webpack.config')({TARGET: 'web'});

module.exports = function(config) {
  config.set({
    basePath: './',
    frameworks: ['mocha'],
    mime: {
      'text/x-typescript': ['ts']
    },
    files: [
      'test/func/**/*.test.ts',
      {pattern: './test/func/assert/**/*', included: false}
    ],
    preprocessors: {
      'test/func/**/*.test.ts': ['webpack']
    },
    webpack: {
      resolve: webpackConfig.resolve,
      module: webpackConfig.module,
    },
    reporters: ['mocha'],
    browsers: ['Chrome'],
  })
}
