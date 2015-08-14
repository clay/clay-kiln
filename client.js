'use strict'; // eslint-disable-line
// note: use strict above is applied to the whole browserified doc
var nodeUrl = require('url'),
  references = require('./services/references'),
  behaviors = require('./services/behaviors'),
  decorators = require('./services/decorators'),
  dom = require('./services/dom'),
  EditorToolbar = require('./controllers/kiln-toolbar'),
  render = require('./services/render'),
  pageToolbar;

// manually add built-in behaviors
// since browserify's require() uses static analysis
behaviors.add('component-ref', require('./behaviors/component-ref'));
behaviors.add('text', require('./behaviors/text'));
behaviors.add('soft-maxlength', require('./behaviors/soft-maxlength'));
behaviors.add('radio', require('./behaviors/radio'));
behaviors.add('description', require('./behaviors/description'));
behaviors.add('checkbox', require('./behaviors/checkbox'));
behaviors.add('textarea', require('./behaviors/textarea'));
behaviors.add('url', require('./behaviors/url'));
behaviors.add('select', require('./behaviors/select'));
behaviors.add('simple-list', require('./behaviors/simple-list'));
behaviors.add('simple-list-primary', require('./behaviors/simple-list-primary'));
behaviors.add('wysiwyg', require('./behaviors/wysiwyg'));
behaviors.add('autocomplete', require('./behaviors/autocomplete'));
behaviors.add('drop-image', require('./behaviors/drop-image'));
behaviors.add('label', require('./behaviors/label'));
behaviors.add('segmented-button', require('./behaviors/segmented-button'));
behaviors.add('page-ref', require('./behaviors/page-ref'));

// add default decorators
decorators.add(require('./decorators/placeholder'));
decorators.add(require('./decorators/focus'));
decorators.add(require('./decorators/component-list'));

// kick off controller loading when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  var parsed = nodeUrl.parse(location.href, true, true);

  if (parsed.query.edit) {
    render.addComponentsHandlers(document);
    // because eslint complains if we don't use the new thing we've created.  We will add to this later.
    pageToolbar = new EditorToolbar(dom.find('[' + references.referenceAttribute + '*="/components/clay-kiln"]'));
  }
});

// expose behavior adding
module.exports.addBehavior = behaviors.add;

// and expose decorator adding, while we're at it
module.exports.addDecorator = decorators.add;
