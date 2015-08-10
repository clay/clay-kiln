var dom = require('./dom'),
  references = require('./references'),
  editorEl = dom.find('[' + references.referenceAttribute + '*="/components/byline-editor"]'),
  data = {};

// get site host, path, port, and other things
data.host = editorEl.getAttribute('data-site-host');
data.path = editorEl.getAttribute('data-site-path');
data.port = location.port;

module.exports = data;
