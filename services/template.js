'use strict';
var _ = require('lodash'),

  // cache templates
  templates = {};

// set up template config
_.templateSettings.interpolate = /{{\=([\s\S]+?)}}/g; // {{= foo }}
_.templateSettings.escape = /{{([\s\S]+?)}}/g; // {{ foo }}
_.templateSettings.evaluate = /{{%([\s\S]+?)}}/g; // {% if foo... %}
_.templateSettings.variable = 'args';

/**
 * compile and use templates
 * @param  {string} name      
 * @param  {{}} data      
 * @param  {string} tplString 
 * @return {NodeElement}           
 */
module.exports = function (name, data, tplString) {
  var el;
  if (!templates[name]) {
    templates[name] = _.template(tplString);
  }

  el = document.createDocumentFragment();
  el.innerHTML = templates[name](data);
  return el.cloneNode(true);
};