'use strict'; // eslint-disable-line
// note: use strict above is applied to the whole browserified doc
var ds = require('dollar-slice'),
  references = require('./services/references'),
  behaviors = require('./services/behaviors'),
  dom = require('./services/dom'),
  EditorToolbar = require('./controllers/editor-toolbar'),
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

// kick off controller loading when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  var components = document.querySelectorAll('[' + references.componentAttribute + ']'),
    i = 0,
    l = components.length,
    component, name;

  // iterate through all components on the page, instantiate component-edit on them if they aren't editor components
  for (; i < l; i++) {
    component = components[i];
    name = component.getAttribute(references.componentAttribute);

    // todo: order this by leaf components? make sure not to add event handlers twice
    if (name !== 'editor-toolbar' && name !== 'nym2015-layout') {
      ds.controller('component-edit', require('./controllers/component-edit'));
      ds.get('component-edit', component);
    }
  }

  // because eslint complains if we don't use the new thing we've created.  We will add to this later.
  pageToolbar = new EditorToolbar(dom.find('[' + references.componentAttribute + '="editor-toolbar"]'));
  console.log('toolbar initialized: ', pageToolbar);
});
