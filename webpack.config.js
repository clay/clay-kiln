var ExtractTextPlugin = require('extract-text-webpack-plugin'),
  autoprefixer = require('autoprefixer'),
  path = require('path');

module.exports = {
  target: 'web',
  entry: {
    edit: './edit.js',
    view: './view.js',
    'view-public': './view-public.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'clay-kiln-[name].js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        presets: ['es2015'],
      }
    }, {
      test: /\.scss|.css$/,
      loader: ExtractTextPlugin.extract(
        'style', // backup loader when not building .css file
        'css!!postcss-loader!sass' // loaders to preprocess CSS
      )
    }],
    noParse: [
      path.resolve('./node_modules/dollar-slice')
    ]
  },
  postcss: function () {
    return [autoprefixer({browsers: ['last 2 versions', 'ie >= 9', 'ios >= 7', 'android >= 4.4.2']})];
  },
  plugins: [
    new ExtractTextPlugin('clay-kiln-[name].css')
  ]
};
