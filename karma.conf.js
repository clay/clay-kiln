const files = [
    {pattern: 'test/setup.js', watched: false}
  ],
  settings = {
    autoWatch: false,
    colors: true,
    singleRun: true,
    preprocessors: {
      'test/setup.js': ['webpack', 'sourcemap']
    },
    frameworks: ['mocha', 'sinon', 'chai'],
    webpack: {
      target: 'web',
      module: {
        rules: [{
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            presets: ['es2015'],
            plugins: ['istanbul']
          }
        }]
      }
    },
    reporters: ['dots', 'coverage'],
    coverageReporter: {
      type: 'lcovonly',
      dir: 'coverage/',
      includeAllSources: true,
      watermarks: {
        statements: [50, 75],
        functions: [50, 75],
        branches: [50, 75],
        lines: [50, 75]
      }
    },
    files: files
  };

module.exports = function (karma) {
  karma.set(settings);
};

module.exports.files = files;
module.exports.settings = settings;
