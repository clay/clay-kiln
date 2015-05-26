'use strict';
var _ = require('lodash'),
  dom = require('../services/dom');

function createOptions(options) {
  return options.map(function (option) {
    return `<option value="${option}">${ _.startCase(option) || 'None' }</option>`;
  }).join('\n');
}

module.exports = function (result, args) {
  var bindings = result.bindings,
    options = args.options;

  // add some stuff to the bindings
  bindings.required = !!args.required;

  var tpl = `
      <label class="input-label"><span class="label-inner">{ label }</span> 
        <select class="editor-select" name="${bindings.name}" rv-value="data">
          ${ createOptions(options) }
        </select>
      </label>
    `,
    field = dom.create(tpl);

  result.el = field;

  return result;
};