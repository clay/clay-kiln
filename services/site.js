var _ = require('lodash'),
  path = require('path'),
  dom = require('@nymag/dom'),
  references = require('./references'),
  editorEl = dom.find('[' + references.referenceAttribute + '*="/components/clay-kiln"] .kiln-toolbar'),
  data = {};

/**
 * add protocol to uris that need it
 * @param {string} uri
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

/**
 *
 * @param {string} str
 * @returns {*}
 */
function normalizePath(str) {
  if (str.length > 1) {
    return str;
  } else {
    return ''; // because routes start with slashes, and we want to avoid foo.com//route
  }
}

// get site host, path, port, and other things
if (editorEl) {
  data.host = editorEl.getAttribute('data-site-host');
  data.path = normalizePath(editorEl.getAttribute('data-site-path'));
  data.assetPath = editorEl.getAttribute('data-site-assetpath');
  data.slug = editorEl.getAttribute('data-site-slug');
  data.name = editorEl.getAttribute('data-site-name');
  data.port = location.port;
  data.prefix = path.join(data.host, data.path);
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

_.set(window, 'kiln.services.site', module.exports); // export for plugins
