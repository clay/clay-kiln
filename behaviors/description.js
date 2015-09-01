/*
Description arguments

value {string} the actual description
 */

var dom = require('../services/dom'),
  getInput = require('../services/get-input');

/**
 *
 * @param {{}} result
 * @param args
 * @returns {*}
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
