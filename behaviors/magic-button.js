const site = require('../services/site'),
  dom = require('../services/dom'),
  getInput = require('../services/get-input');

/**
 * Create magic button.
 * @param {{name: string, bindings: {}}} result
 * @param {object} args  described in detail below:
 * @param {string} [args.field] grab the value of this field
 * @param {string} [args.transform] key of the transform to apply to the value
 * @param {string} args.url to get data from
 * @param {string} args.property to get from the returned data
 * @returns {{}}
 */
module.exports = function (result, args) {
  var name = result.name,
    el = result.el,
    input = getInput(el),
    button = dom.create(`<button class="magic-button">
      <img src="${site.get('assetPath')}/media/components/clay-kiln/magic-button.svg" alt="Magic Button">
    </button>`);

  // add the button right before the input
  dom.insertBefore(input, button);

  // log the name
  console.log(name)

  return result;
};
