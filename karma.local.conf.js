var settings = require('./karma.conf.js').settings,
  _ = require('lodash');

module.exports = function (karma) {
  'use strict';

  karma.set(_.assign(settings, {
    browsers: ['Chrome']
  }));
};