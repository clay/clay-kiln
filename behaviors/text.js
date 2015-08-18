/*
Text arguments

required {boolean} set input required (blocking)
pattern {regex} required input pattern (blocking)
minLength {number} minimum number of characters required (blocking)
maxLength {number} maximum number of characters allowed (blocking)
placeholder {string} placeholder that will display in the input
 */

var dom = require('../services/dom');

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
        <input class="input-text" data-field="${name}" type="text" rv-required="${name}.required" rv-pattern="${name}.pattern" rv-minLength="${name}.minLength" rv-maxLength="${name}.maxLength" rv-placeholder="${name}.placeholder" rv-value="${name}.data.value" />
      </label>
    `);

  result.el = textField;

  return result;
};
