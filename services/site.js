var dom = require('./dom'),
  references = require('./references'),
  editorEl = dom.find('[' + references.referenceAttribute + '*="/components/byline-editor"]'),
  data = {};

/**
 * add protocol to uris that need it
 * @param {string} uri
 * @param {object} site
 * @returns {string}
 */
function addProtocol(uri) {
  var hasProtocol = uri.indexOf(data.protocol) === 0;

  if (!hasProtocol) {
    return data.protocol + '//' + uri;
  } else {
    return uri;
  }
}

/**
 * add port to uris that need it
 * note: if the current port is 80, it doesn't need it
 * @param {string} uri
 * @param {object} site
 * @returns {string}
 */
function addPort(uri) {
  var hasPort = data.port === '80' || uri.indexOf(':' + data.port) !== -1;

  if (!hasPort) {
    return uri.replace(data.host, data.host + ':' + data.port);
  } else {
    return uri;
  }
}

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

// helpers
module.exports.addProtocol = addProtocol;
module.exports.addPort = addPort;
