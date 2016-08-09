var settings = require('./karma.conf.js').settings,
  _ = require('lodash');

// generating code coverage reports for local tests
settings.coverageReporter.type = 'html';

module.exports = function (karma) {
  karma.set(_.assign(settings, {
    singleRun: false,
    autoWatch: true,
    autoWatchBatchDelay: 1000,
    reporters: ['spec', 'coverage'],
    browsers: ['Chrome']
  }));
};
