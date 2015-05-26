'use strict';
var _ = require('lodash'),
  dom = require('../services/dom');

function createOptions(name, options) {
  return options.map(function (option) {
    return `
      <li class="editor-radio-item">
        <label class="option-label">${ _.startCase(option) }
          <input name="${name}" type="radio" rv-checked="data" value="${option}" />
        </label>
      </li>`;
  }).join('\n');
}

module.exports = function (result, args) {
  var bindings = result.bindings,
    name = bindings.name,
    options = args.options;

  // add some stuff to the bindings
  bindings.required = !!args.required;

  var tpl = `
      <span class="input-label">{ label }</span>
      <ul class="editor-radios">
        ${ createOptions(name, options) }
      </ul>
    `,
    field = dom.create(tpl);

  result.el = field;

  return result;
};