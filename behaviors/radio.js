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
        <label>
          <input rv-field="${name}" type="radio" rv-checked="${name}.data.value" value="${option}" />
          ${ _.startCase(option) || 'None' }
        </label>
      </li>`;
  }).join('\n');
}

module.exports = function (result, args) {
  var name = result.name,
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
