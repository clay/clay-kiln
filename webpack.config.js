var ExtractTextPlugin = require('extract-text-webpack-plugin'),
  autoprefixer = require('autoprefixer'),
  path = require('path');

module.exports = {
  target: 'web',
  entry: {
    edit: './client.js',
    view: './view.js'
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "clay-kiln-[name].js"
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
    return [autoprefixer];
  },
  resolve: {
    alias: {
      'codemirror-css': path.resolve('node_modules/codemirror/lib/codemirror.css'),
      'flatpickr-css': path.resolve('node_modules/flatpickr/dist/flatpickr.min.css')
    }
  },
  plugins: [
    new ExtractTextPlugin('clay-kiln.css')
  ]
};
