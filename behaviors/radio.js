'use strict';
var label = require('../services/label'),
  dom = require('../services/dom');

module.exports = function (result, args) {
  var el = result.el,
    bindings = result.bindings;

  // add some stuff to the bindings
  bindings.label = label(bindings.name);
  bindings.options = args.options;
  bindings.required = args.required;

  var tpl = `
      <span class="input-label">{ label }</span>
      <ul class="editor-radios">
        <li rv-each-option="options" class="editor-radio-item">
          <label class="option-label">{ option }
            <input name="${bindings.name}" type="radio" rv-checked="data" rv-value="option" />
          </label>
        </li>
      </ul>
    `,
    field = dom.create(tpl);

  if (el.nodeType === 1) {
    el.appendChild(field);
  } else {
    el = field;
  }

  return {el: el, bindings: bindings, rivets: result.rivets };
};