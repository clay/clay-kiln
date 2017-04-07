const ExtractTextPlugin = require('extract-text-webpack-plugin'),
  docs = new ExtractTextPlugin('behaviors/README.md'),
  styles = new ExtractTextPlugin('dist/clay-kiln-[name].css'),
  webpack = require('webpack'),
  LodashModuleReplacementPlugin = require('lodash-webpack-plugin'),
  OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin'),
  cssnano = require('cssnano'),
  prod = process.argv.indexOf('-p') !== -1;

let plugins = [
  styles,
  docs,
  new LodashModuleReplacementPlugin({
    shorthands: true, // allow _.map(collection, prop)
    cloning: true, // used by edit
    caching: true, // cache _.cloneDeep, etc
    collections: true, // allow objects in collection methods
    deburring: true, // remove diacritical marks
    unicode: true, // support unicode
    memoizing: true, // used by cache
    coercions: true, // allow coercions
    flattening: true, // allow flattening methods
    paths: true, // allow deep _.get, _.set, _.has
    // note: we're explicitly not allowing chaining or currying
  }),
  new webpack.optimize.OccurrenceOrderPlugin,
  new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
];

if (prod) {
  plugins = plugins.concat([
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
        unsafe: true
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
  ]);
}

module.exports = {
  target: 'web',
  entry: {
    edit: './edit.js',
    view: './view.js',
    'view-public': './view-public.js'
  },
  output: {
    path: __dirname,
    filename: 'dist/clay-kiln-[name].js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }, {
      test: /\.scss|.css$/,
      use: styles.extract({
        fallback: 'style-loader',
        use: ['css-loader', 'postcss-loader', 'sass-loader']
      })
    }, {
      test: /\.svg$/,
      use: 'raw-loader'
    }, {
      test: /\.vue$/,
      loader: 'vue-loader',
      options: {
        loaders: {
          css: 'vue-style-loader!css-loader!postcss-loader',
          sass: 'vue-style-loader!css-loader!postcss-loader!sass-loader',
          docs: docs.extract('raw-loader')
        }
      }
    }, {
      test: /\.woff2$/,
      loader: 'url-loader?limit=65000&mimetype=application/font-woff2&name=public/fonts/[name].[ext]'
    }]
  },
  plugins: plugins
};
