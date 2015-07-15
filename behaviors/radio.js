/*
Radio arguments

options {array} array of strings
 */

var _ = require('lodash'),
  dom = require('../services/dom');

function createOptions(name, options) {
  return options.map(function (option) {
    return `
      <li class="editor-radio-item">
        <label class="option-label">${ _.startCase(option) || 'None' }
          <input data-field="${name}" type="radio" rv-checked="data.value" value="${option}" />
        </label>
      </li>`;
  }).join('\n');
}

module.exports = function (result, args) {
  var bindings = result.bindings,
    name = bindings.name,
    options = args.options,
    field;

  field = dom.create(`
    <span class="input-label">
    <ul class="editor-radios">
      ${ createOptions(name, options) }
    </ul>
  `);

  result.el = field;

  return result;
};
