var settings = require('./karma.conf.js').settings,
  WatchIgnorePlugin = require('webpack').WatchIgnorePlugin,
  _ = require('lodash');

// generating code coverage reports for local tests
settings.coverageReporter.reporters = [
  { type: 'html', dir: 'coverage/' },
  { type: 'text-summary' }
];

module.exports = function (karma) {
  let localSettings = _.assign(settings, {
    singleRun: false,
    autoWatch: true,
    autoWatchBatchDelay: 2000,
    browsers: ['Chrome']
  });

  _.set(localSettings, 'webpack.watch', true);
  _.set(localSettings, 'webpack.plugins', [
    new WatchIgnorePlugin([
      /node_modules\//ig,
      /coverage\//ig,
      /dist\//ig
    ])
  ]);
  karma.set(localSettings);
};
