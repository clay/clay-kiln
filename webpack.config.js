const path = require('path'),
  ExtractTextPlugin = require('extract-text-webpack-plugin'),
  docs = new ExtractTextPlugin('docs/inputs.md'),
  styles = new ExtractTextPlugin('dist/clay-kiln-[name].css'),
  webpack = require('webpack'),
  LodashModuleReplacementPlugin = require('lodash-webpack-plugin'),
  OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin'),
  cssnano = require('cssnano'),
  prod = process.argv.indexOf('-p') !== -1,
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

if (prod) {
  plugins = plugins.concat([
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
  ]);
}

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
