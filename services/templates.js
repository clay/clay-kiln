'use strict';
var _template = require('lodash/string/template'),
  dom = require('./dom'),
  templates = {};

module.exports.apply = function (name, data) {
  var template,
    el = document.createElement('div');

  if (!templates[name]) {
    template = dom.find('.' + name + '[type="text/template"]');
    if (!template) {
      throw new Error('Template not found: ' + name);
    }
    templates[name] = _template(dom.find('.' + name + '[type="text/template"]').innerHTML);
  }

  el.innerHTML = templates[name](data);
  return dom.getFirstChildElement(el);
};