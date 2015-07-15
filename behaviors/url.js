/*
Url arguments

required {boolean} set input required (blocking)
placeholder {string} placeholder that will display in the input
 */

var dom = require('../services/dom');

module.exports = function (result, args) {
  var bindings = result.bindings,
  urlField;

  // add some stuff to the bindings
  bindings.required = !!args.required;
  bindings.placeholder = args.placeholder || '';

  urlField = dom.create(`
    <label class="input-label">
      <input data-field="${bindings.name}" type="url" rv-required="required" rv-placeholder="placeholder" rv-value="data.value" />
    </label>
  `);

  result.el = urlField;

  return result;
};
