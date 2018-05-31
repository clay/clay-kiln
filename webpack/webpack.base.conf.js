const path = require('path'),
  ExtractTextPlugin = require('extract-text-webpack-plugin'),
  docs = new ExtractTextPlugin('docs/inputs.md'),
  styles = new ExtractTextPlugin('dist/clay-kiln-[name].css'),
  webpack = require('webpack'),
  LodashModuleReplacementPlugin = require('lodash-webpack-plugin'),
  kilnVersion = require('./package.json').version;

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
  new webpack.DefinePlugin({
    'process.env': {
      KILN_VERSION: `"${kilnVersion}"`,
      LOG: '"trace"'
    }
  }),
  new webpack.optimize.ModuleConcatenationPlugin(),
  new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/) // some dependency (chrono-node) is using moment.js (allow that, but make them drop their 300kB of locales)
];

module.exports = {
  target: 'web',
  node: {
    __filename: true, // actually expand filenames, used for logging
    __dirname: true
  },
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
      // todo: remove vue-unit (and update vue-unit dep) once vue-unit hits 0.3.0
      test: /node_modules\/(@tom-kitchin\/vue-unit|keen-ui|striptags|clayutils)\//,
      loader: 'babel-loader'
    }, {
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
        esModule: false, // todo: enable this when we can use it with keenUI
        extractCSS: true,
        loaders: {
          css: styles.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'postcss-loader', 'sass-loader?data=@import "styleguide/keen-variables.scss";']
          }),
          sass: styles.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'postcss-loader', 'sass-loader?data=@import "styleguide/keen-variables.scss";']
          }),
          scss: styles.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'postcss-loader', 'sass-loader?data=@import "styleguide/keen-variables.scss";']
          }),
          docs: docs.extract('raw-loader')
        }
      }
    }]
  },
  resolve: {
    // note: when importing vue components, you don't have to specify .vue
    // also, when importing keen-ui components, do so as `keen/UiComponentName`,
    // so they get imported correctly when testing
    extensions: ['.js', '.json', '.vue'],
    alias: {
      keen: path.resolve(__dirname, 'node_modules/keen-ui/src')
    }
  },
  plugins: plugins
};
