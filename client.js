'use strict'; // eslint-disable-line
// note: use strict above is applied to the whole browserified doc
var nodeUrl = require('url'),
  references = require('@nymdev/references'),
  behaviors = require('./services/behaviors'),
  decorators = require('./services/decorators'),
  dom = require('./services/dom'),
  EditorToolbar = require('./controllers/kiln-toolbar'),
  render = require('./services/render');

// manually add built-in behaviors
// since browserify's require() uses static analysis
behaviors.add('component-ref', require('./behaviors/component-ref'));
behaviors.add('text', require('./behaviors/text'));
behaviors.add('required', require('./behaviors/required'));
behaviors.add('soft-maxlength', require('./behaviors/soft-maxlength'));
behaviors.add('radio', require('./behaviors/radio'));
behaviors.add('description', require('./behaviors/description'));
behaviors.add('checkbox', require('./behaviors/checkbox'));
behaviors.add('checkbox-group', require('./behaviors/checkbox-group'));
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
// note: external behaviors, decorators, and validation rules should already be added
// when this event fires
document.addEventListener('DOMContentLoaded', function () {
  var parsed = nodeUrl.parse(location.href, true, true);

  if (parsed.query.edit) {
    render.addComponentsHandlers(document);
    return new EditorToolbar(dom.find('[' + references.referenceAttribute + '*="/components/clay-kiln"]'));
  }
});
