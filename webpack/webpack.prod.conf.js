const webpack = require('webpack'),
  OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin'),
  cssnano = require('cssnano'),
  merge = require('webpack-merge');

let plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: '"production"'
    }
  }),
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      sequences: true,
      properties: true,
      dead_code: true,
      conditionals: true,
      comparisons: true,
      booleans: true,
      loops: true,
      unused: true,
      if_return: true,
      reduce_vars: true,
      passes: 2,
      unsafe: true,
      warnings: false
    },
    output: {
      inline_script: true
    }
  }),
  new OptimizeCSSAssetsPlugin({
    cssProcessor: cssnano,
    cssProcessorOptions: {
      discardComments: {
        removeAll: true,
      },
      safe: true // run cssnano in safe mode
    },
    canPrint: false
  })
];

module.exports = merge(require('./webpack.base.conf'), {
  plugins: plugins
});
