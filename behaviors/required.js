var dom = require('@nymag/dom');

/**
 * Add a "required" bit of text after the label (if it exists)
 * @param {{name: string, el: Element}} result
 * @returns {{}}
 */
module.exports = function (result) {
  var el = result.el,
    tpl = '<span class="label-required">required</span>',
    requiredEl = dom.create(tpl),
    label = dom.find(el, '.label-inner');

  // only add "required" if there's a label
  if (label) {
    dom.insertAfter(label, requiredEl);
  }

  return result;
};
