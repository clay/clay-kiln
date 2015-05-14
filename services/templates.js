'use strict';
var _ = require('lodash'),
  dom = require('./dom'),

  // cache templates
  templates = {};

module.exports.apply = function (name, data) {
  var template,
    el = document.createElement('div');

  if (!templates[name]) {
    template = dom.find('.' + name + '[type="text/template"]');
    if (!template) {
      throw new Error('Template not found: ' + name);
    }
    templates[name] = _.template(dom.find('.' + name + '[type="text/template"]').innerHTML);
  }

  el.innerHTML = templates[name](data);
  return dom.getFirstChildElement(el);
};