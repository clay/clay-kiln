'use strict';
var dom = require('../services/dom');

module.exports = function (result, args) {
  var textField,
    bindings = result.bindings;

  // add some stuff to the bindings
  bindings.required = args.required;

  textField = dom.create(`
      <label class="input-label"><span class="label-inner">{ label }</span>
        <input class="input-text" name="${bindings.name}" type="text" rv-required="required" rv-pattern="pattern" rv-minLength="minLength" rv-maxLength="maxLength" rv-placeholder="placeholder" rv-value="data" />
      </label>
    `);

  result.el = textField;

  return result;
};