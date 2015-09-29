var settings = require('./karma.conf.js').settings,
  _ = require('lodash');

module.exports = function (karma) {
  karma.set(_.assign(settings, {
    singleRun: false,
    autoWatch: true,
    autoWatchBatchDelay: 1000,
    browsers: ['Chrome']
  }));
};
