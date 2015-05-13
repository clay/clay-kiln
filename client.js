'use strict';
var ds = require('dollar-slice');

// init controllers
ds.get(__dirname + '/controllers/editor-toolbar', document.querySelector('[data-component="editor-toolbar"]'));

window.setTimeout(function () {
  var components = document.querySelectorAll('[data-component]'),
    i = 0,
    l = components.length,
    component, name;

  // iterate through all components on the page, instantiate component-edit on them if they aren't editor components
  for (; i < l; i++) {
    component = components[i];
    name = component.getAttribute('data-component');

    // todo: order this by leaf components? make sure not to add event handlers twice
    if (name !== 'editor-toolbar' && name !== 'nym2015-layout') {
      DS.get(__dirname + '/controllers/component-edit', component);
    }
  }
}, 0);