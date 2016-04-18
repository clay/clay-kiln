// this is a tiny little service that helps get things for field behaviors
var dom = require('@nymag/dom');

function getField(el) {
  // rv-field denotes the element that talks to the data model
  return dom.find(el, '[rv-field]');
}

function getInput(el) {
  return dom.find(el, '.checkbox-group') || dom.find(el, 'input') || dom.find(el, 'textarea') || dom.find(el, '.wysiwyg-input');
}

function isInput(el) {
  return !!el && (el.nodeName === 'INPUT' || el.nodeName === 'TEXTAREA' || el.classList.contains('wysiwyg-input'));
}

module.exports.getField = getField;
module.exports.getInput = getInput;
module.exports.isInput = isInput;
