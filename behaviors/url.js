'use strict';
var dom = require('../services/dom');

module.exports = function (result, args) {
  var bindings = result.bindings;

  // add some stuff to the bindings
  bindings.required = !!args.required;
  bindings.placeholder = args.placeholder || '';

  var tpl = `
      <label class="input-label"><span class="label-inner">{ label }</span> 
        <input name="${bindings.name}" type="url" rv-required="required" rv-placeholder="placeholder" rv-value="data.value" />
      </label>
    `,
    urlField = dom.create(tpl);

  result.el = urlField;

  return result;
};