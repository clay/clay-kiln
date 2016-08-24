'use strict'; // eslint-disable-line
// note: use strict above is applied to the whole browserified doc
var nodeUrl = require('url'),
  references = require('./services/references'),
  behaviors = require('./services/forms/behaviors'),
  decorators = require('./services/components/decorators'),
  dom = require('@nymag/dom'),
  EditorToolbar = require('./controllers/kiln-toolbar'),
  render = require('./services/components/render'),
  progress = require('./services/progress'),
  Konami = require('konami-js'),
  takeOffEveryZig = require('./services/pane/move-zig'),
  plugins = require('./services/plugins'),
  eventify = require('eventify'),
  connectionLostMessage = 'Connection Lost. Changes will <strong>NOT</strong> be saved.';

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
behaviors.add('select', require('./behaviors/select'));
behaviors.add('simple-list', require('./behaviors/simple-list'));
behaviors.add('simple-list-primary', require('./behaviors/simple-list-primary'));
behaviors.add('wysiwyg', require('./behaviors/wysiwyg'));
behaviors.add('autocomplete', require('./behaviors/autocomplete'));
behaviors.add('drop-image', require('./behaviors/drop-image'));
behaviors.add('label', require('./behaviors/label'));
behaviors.add('segmented-button', require('./behaviors/segmented-button'));
behaviors.add('page-ref', require('./behaviors/page-ref'));
behaviors.add('magic-button', require('./behaviors/magic-button'));
behaviors.add('codemirror', require('./behaviors/codemirror'));
behaviors.add('site-specific-select', require('./behaviors/site-specific-select'));

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
    window.kiln = window.kiln || {}; // make sure global kiln object exists
    eventify.enable(window.kiln); // enable events on global kiln object, so plugins can add listeners
    plugins.init(); // initialize plugins before adding handlers
    render.addComponentsHandlers(document);
    return new EditorToolbar(dom.find('[' + references.referenceAttribute + '*="/components/clay-kiln"]'));
  }
});

// handle connection loss

window.addEventListener('load', function () {
  // test connection loss on page load
  if (!navigator.onLine) {
    // we're offline!
    progress.open('offline', connectionLostMessage);
  }
});

window.addEventListener('online', function () {
  progress.close(); // in case there are any status messages open, close them
});

window.addEventListener('offline', function () {
  progress.done('offline'); // turn any progress indicators to grey and end them
  progress.open('offline', connectionLostMessage);
});

new Konami(takeOffEveryZig);
