'use strict';
var label = require('../services/label'),
  dom = require('../services/dom');

module.exports = function (result, options) {
  var el = result.el,
    bindings = result.bindings,
    args = options.args,
    data = options.data || '',
    name = options.name;

  // add some stuff to the bindings
  bindings.data = data;
  bindings.label = label(name);
  bindings.name = name;
  bindings.required = args.required;

  var tpl = `
      <label><span class="input-label">{ label }</span> 
        <input name="{ name }" type="text" rv-required="required" rv-pattern="pattern" rv-minLength="minLength" rv-maxLength="maxLength" rv-placeholder="placeholder" rv-value="data" />
      </label>
    `,
    textField = dom.create(tpl);

  if (el.nodeType === 1) {
    el.appendChild(textField);
  } else {
    el = textField;
  }

  return {el: el, bindings: bindings, rivets: result.rivets };
};