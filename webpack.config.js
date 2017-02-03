const ExtractTextPlugin = require('extract-text-webpack-plugin'),
  path = require('path'),
  styles = new ExtractTextPlugin('clay-kiln-[name].css');

module.exports = {
  target: 'web',
  entry: {
    edit: './edit.js',
    view: './view.js',
    'view-public': './view-public.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'clay-kiln-[name].js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      options: {
        presets: ['es2015'],
      }
    }, {
      test: /\.scss|.css$/,
      use: styles.extract({
        fallbackLoader: 'style-loader',
        loader: ['css-loader', 'postcss-loader', 'sass-loader']
      })
    }]
  },
  plugins: [
    styles
  ]
};
