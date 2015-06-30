'use strict'; // eslint-disable-line
// note: use strict above is applied to the whole browserified doc
var ds = require('dollar-slice'),
  references = require('./services/references'),
  behaviors = require('./services/behaviors'),
  decorators = require('./services/decorators'),
  dom = require('./services/dom'),
  EditorToolbar = require('./controllers/editor-toolbar'),
  select = require('./services/select'),
  pageToolbar;

// manually add built-in behaviors
// since browserify's require() uses static analysis
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

// add default decorators
decorators.add(require('./services/placeholder'));
decorators.add(require('./services/focus'));
decorators.add(require('./services/component-list'));

// kick off controller loading when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  var componentEdit = require('./controllers/component-edit'),
    components = document.querySelectorAll('[' + references.referenceAttribute + ']'),
    i = 0,
    l = components.length,
    component, ref, name;

  // iterate through all components on the page
  // instantiate component-edit on them if they aren't editor components
  // call select.handler on them to add component-bars
  for (; i < l; i++) {
    component = components[i];
    ref = component.getAttribute(references.referenceAttribute);
    name = references.getComponentNameFromReference(ref);

    if (name && name !== 'editor-toolbar') {
      select.handler(component, { ref: ref }); // note: not passing data or path into here
      ds.controller('component-edit', componentEdit);
      ds.get('component-edit', component);
    }
  }

  // because eslint complains if we don't use the new thing we've created.  We will add to this later.
  pageToolbar = new EditorToolbar(dom.find('[' + references.componentAttribute + '="editor-toolbar"]'));
  console.log('toolbar initialized: ', pageToolbar);
});
