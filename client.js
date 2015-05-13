/* this is the endpoint for byline-editor */
var riot = require('riot'),
  dom = require('./services/dom');

// init tags

// init toolbar stuff
require('tags/toolbar.tag');
riot.mount(dom.find('[data-component="editor-toolbar"]'), 'toolbar');