'use strict';
var Promise = require('bluebird'),
  glob = require('glob'),
  fs = require('fs');

module.exports = function () {
  var d = Promise.defer(),
    templates;

  glob(__dirname + '/templates/*', function (err, files) {
    templates = files.map(function (file) {
      return fs.readFileSync(file).toString();
    });

    if (err) {
      d.reject(err);
    } else {
      d.resolve({ templates: templates });
    }
  });

  return d.promise;
};