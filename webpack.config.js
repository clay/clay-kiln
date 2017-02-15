const ExtractTextPlugin = require('extract-text-webpack-plugin'),
  docs = new ExtractTextPlugin('behaviors/README.md'),
  styles = new ExtractTextPlugin('dist/clay-kiln-[name].css'),
  webpack = require('webpack'),
  LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

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
      loader: 'babel-loader',
      options: {
        plugins: ['lodash'],
        presets: ['es2015'],
      }
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
          sass: 'vue-style-loader!css-loader!postcss-loader!sass-loader',
          docs: ExtractTextPlugin.extract('raw-loader')
        }
      }
    }]
  },
  plugins: [
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
  ]
};
