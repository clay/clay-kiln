import _ from 'lodash';

var dom = require('@nymag/dom');

/**
 * Create options for select.
 * @param {[string]} options
 * @returns {string}
 */
function createOptions(options) {
  return options.map(function (option) {
    return `<option value="${option}">${ _.startCase(option) || 'None' }</option>`;
  }).join('\n');
}

/**
 * Replace result.el with select drop-down of options
 * @param {{name: string}} result
 * @param {{options: [string]}} args
 * @returns {{}}
 */
module.exports = function (result, args) {
  var name = result.name,
    options = args.options,
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
