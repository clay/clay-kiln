var dom = require('../services/dom');

/**
 * Replace result.el with text input.
 * @param {{name: string, bindings: {}}} result
 * @param {{}} args   defined in detail below:
 * @param {boolean} args.required    set input required (blocking)
 * @param {RegExp}  args.pattern     required input pattern (blocking)
 * @param {number}  args.minLength   minimum number of characters required (blocking)
 * @param {number}  args.maxLength   maximum number of characters allowed (blocking)
 * @param {string}  args.placeholder placeholder that will display in the input
 * @returns {*}
 */
module.exports = function (result, args) {
  var textField,
    bindings = result.bindings,
    name = result.name;

  // add some stuff to the bindings
  bindings.required = args.required;
  bindings.pattern = args.pattern;
  bindings.minLength = args.minLength;
  bindings.maxLength = args.maxLength;
  bindings.placeholder = args.placeholder;

  textField = dom.create(`
      <label class="input-label">
        <input class="input-text" rv-field="${name}" type="text" rv-required="${name}.required" rv-pattern="${name}.pattern" rv-minLength="${name}.minLength" rv-maxLength="${name}.maxLength" rv-placeholder="${name}.placeholder" rv-value="${name}.data.value" />
      </label>
    `);

  result.el = textField;

  return result;
};
