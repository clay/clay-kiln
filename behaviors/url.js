var dom = require('../services/dom');

/**
 * Create an URL input.
 * @param {{name: string, bindings: {}}} result
 * @param {{required: boolean, placeholder: string}} args  described in detail below:
 * @param {boolean} args.required     set input required (blocking)
 * @param {string}  args.placeholder  placeholder that will display in the input
 * @returns {*}
 */
module.exports = function (result, args) {
  var bindings = result.bindings,
    name = result.name,
    urlField;

  // add some stuff to the bindings
  bindings.required = !!args.required;
  bindings.placeholder = args.placeholder || '';

  urlField = dom.create(`
    <label class="input-label">
      <input class="input-url" rv-field="${name}" type="url" rv-required="${name}.required" rv-placeholder="${name}.placeholder" rv-value="${name}.data.value" />
    </label>
  `);

  result.el = urlField;

  return result;
};
