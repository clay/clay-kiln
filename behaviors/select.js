/*
Select arguments

options {array} array of strings
 */

var _ = require('lodash'),
  dom = require('../services/dom');

function createOptions(options) {
  return options.map(function (option) {
    return `<option value="${option}">${ _.startCase(option) || 'None' }</option>`;
  }).join('\n');
}

module.exports = function (result, args) {
  var name = result.name,
    options = args.options,
    field;

  field = dom.create(`
    <label class="input-label">
      <select class="editor-select" rv-field="${name}" rv-value="${name}.data.value">
        ${ createOptions(options) }
      </select>
    </label>
  `);

  result.el = field;

  return result;
};
