var dom = require('./dom'),
  references = require('./references'),
  editorEl = dom.find('[' + references.referenceAttribute + '*="/components/byline-editor"]'),
  data = {};

function normalizePath(path) {
  if (path.length > 1) {
    return path;
  } else {
    return ''; // because routes start with slashes, and we want to avoid foo.com//route
  }
}

// get site host, path, port, and other things
if (editorEl) {
  data.host = editorEl.getAttribute('data-site-host');
  data.path = normalizePath(editorEl.getAttribute('data-site-path'));
  data.port = location.port;
  data.prefix = data.host + ':' + data.port + data.path;
  data.protocol = location.protocol;
}

module.exports.get = function (prop) {
  return data[prop];
};

// for testing
module.exports.set = function (obj) {
  data = obj;
};
