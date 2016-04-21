var dom = require('@nymag/dom');

/**
 * Find the outer label which often wraps the input elements.
 * @param {Element} el
 * @returns {Element|null}
 */
function findOuterLabelEl(el) {
  if (el.classList && el.classList.contains('input-label')) {
    return el;
  } else {
    return dom.find(el, '.input-label');
  }
}

/**
 * Add a label above the input. No args because uses _label from the field's schema
 * @param {{el: Element, bindings: {}}} result
 * @returns {{}}
 */
module.exports = function (result) {
  var label = dom.create(`<span class="label-inner">${result.bindings.label}</span>`),
    el = findOuterLabelEl(result.el);

  dom.prependChild(el, label);

  return result;
};
