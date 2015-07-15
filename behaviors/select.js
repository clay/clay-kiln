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
  var bindings = result.bindings,
    options = args.options,
    field;

  field = dom.create(`
    <label class="input-label"><span class="label-inner">{ label }</span>
      <select class="editor-select" data-field="${bindings.name}" rv-value="data.value">
        ${ createOptions(options) }
      </select>
    </label>
  `);

  result.el = field;

  return result;
};
