/*
Description arguments

value {string} the actual description
 */

var dom = require('../services/dom');

module.exports = function (result, args) {
  var el = result.el,
    description = args.value,
    tpl = `<p class="label-description">${ description }</p>`,
    descriptionEl = dom.create(tpl),
    input = dom.find(el, 'input') || dom.find(el, 'textarea') || dom.find(el, '.wysiwyg-input');

  dom.insertBefore(input, descriptionEl);
  return result;
};
