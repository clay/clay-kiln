var dom = require('@nymag/dom'),
  getInput = require('../services/get-input');

/**
 * Add a description before the input.
 * @param {{name: string, el: Element}} result
 * @param {{value: string}} args    args.value is the description text.
 * @returns {{}}
 */
module.exports = function (result, args) {
  var el = result.el,
    description = args.value,
    tpl = `<p class="label-description">${ description }</p>`,
    descriptionEl = dom.create(tpl),
    input = getInput(el);

  dom.insertBefore(input, descriptionEl);
  return result;
};
