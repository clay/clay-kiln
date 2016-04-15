var dom = require('@nymag/dom'),
  getField = require('../services/field-helpers').getField;

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
    field = getField(el);

  dom.insertBefore(field, descriptionEl);
  return result;
};
