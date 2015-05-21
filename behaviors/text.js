'use strict';
var label = require('../services/label'),
  dom = require('../services/dom');

module.exports = function (result, args) {
  var el = result.el,
    bindings = result.bindings;

  // add some stuff to the bindings
  bindings.label = label(bindings.name);
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