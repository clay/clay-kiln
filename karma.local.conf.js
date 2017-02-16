var settings = require('./karma.conf.js').settings,
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
  karma.set(localSettings);
};
