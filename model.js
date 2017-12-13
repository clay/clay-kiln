const pkg = require('./package.json');

module.exports.render = function (uri, data) {
  data.kilnVersion = pkg.version;
  return data;
};
