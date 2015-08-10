var dom = require('./dom'),
  references = require('./references'),
  editorEl = dom.find('[' + references.referenceAttribute + '*="/components/byline-editor"]'),
  data = {};

// get site host, path, port, and other things
if (editorEl) {
  data.host = editorEl.getAttribute('data-site-host');
  data.path = editorEl.getAttribute('data-site-path');
  data.port = location.port;
  data.prefix = data.host + ':' + data.port + data.path;
}

module.exports.get = function (prop) {
  return data[prop];
};

// for testing
module.exports.set = function (obj) {
  data = obj;
};
