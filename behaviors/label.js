/*
Label has no arguments!

It uses the _label denoted in this field's schema
 */

var dom = require('../services/dom');


function findOuterLabelEl(el) {
  if (el.classList && el.classList.contains('input-label')) {
    return el;
  } else {
    return dom.find(el, '.input-label');
  }
}

module.exports = function (result) {
  var label = dom.create('<span class="label-inner">{ label }</span>'),
    el = findOuterLabelEl(result.el);

  dom.prependChild(el, label);

  return result;
};
