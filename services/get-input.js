// this is a tiny little service that reliably gets the input element of a field
var dom = require('./dom');

function getInput(el) {
  return dom.find(el, '.checkbox-group') || dom.find(el, 'input') || dom.find(el, 'textarea') || dom.find(el, '.wysiwyg-input');
}

function isInput(el) {
  return el && (el.nodeType === 'INPUT' || el.nodeType === 'TEXTAREA' || el.classList.contains('wysiwyg-input'));
}

module.exports = getInput;
module.exports.isInput = isInput;
