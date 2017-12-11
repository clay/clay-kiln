var settings = require('./karma.conf.js').settings,
  _ = require('lodash');

// generating code coverage reports for local tests
settings.coverageReporter.reporters = [
  { type: 'html', dir: 'coverage/' },
  { type: 'text-summary' }
];

module.exports = function (karma) {
  let localSettings = _.assign(settings, {
    singleRun: true,
    // autoWatch: false,
    // autoWatchBatchDelay: 2000,
    browsers: ['Chrome']
  });

  _.set(localSettings, 'webpack.watch', true);
  _.set(localSettings, 'webpack.watchOptions', {
    aggregateTimeout: 300,
    ignored: /(node_modules|coverage|dist|docs|media|styleguide|.git|.github)/,
    poll: 1000
  });
  karma.set(localSettings);
};
