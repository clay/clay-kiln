'use strict';
var Promise = require('bluebird'),
  glob = require('glob');

module.exports = function () {
  var d = Promise.defer();

  glob('./templates/*.html', function (err, files) {
    if (err) {
      d.reject(err);
    } else {
      d.resolve({ templates: files });
    }
  });

  return d.promise;
};