import _ from 'lodash';

const dom = require('@nymag/dom');

/**
 * Create list item and input for each option.
 * @param {string} name
 * @param {[string]} options
 * @returns {string}
 */
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

/**
 * Create list of radio options.
 * @param {{name: string}} result
 * @param {{options: [string]}} args        Use an array of strings for the options.
 * @returns {{name: string, el: Element}}
 */
module.exports = function (result, args) {
  var name = result.name,
    options = args.options,
    field = dom.create(`
      <span class="input-label">
        <ul class="editor-radios">
          ${ createOptions(name, options) }
        </ul>
      </span>
    `);

  result.el = field;
  return result;
};
