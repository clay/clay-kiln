var _ = require('lodash'),
  dom = require('../services/dom'),
  site = require('../services/site');

/**
 * format values for use in title attributes (for mouseover tooltips)
 * @param {string} val
 * @returns {string}
 */
function getTitle(val) {
  return val.split('-').map(_.startCase).join(' ');
}

/**
 * Create label for option.
 * @param {string} id
 * @param {{}} option
 * @param {string} [option.icon]
 * @param {string} [option.text]
 * @param {string} option.value
 * @returns {string}
 */
function getLabel(id, option) {
  if (option.icon) {
    return `<label for="${id}" title="${getTitle(option.value)}"><img src="${site.get('assetPath') + option.icon }" alt="${ option.text || option.value }" /></label>`;
  } else {
    return `<label for="${id}" title="${getTitle(option.value)}">${ option.text || option.value }</label>`;
  }
}

/**
 * Create input for each option.
 * @param {string} name
 * @param {[{icon: string, text: string, value: string}]} options
 * @returns {string}
 */
function createOptions(name, options) {
  return options.map(function (option, index) {
    var id = name + '-' + option.value + '-' + index;

    return `<input name="${name}" rv-field="${name}" type="radio" id="${id}" rv-checked="${name}.data.value" value="${option.value}" />${ getLabel(id, option) }`;
  }).join('\n');
}

/**
 * Replace the result.el with segmented buttons.
 * @param {{name: string}} result
 * @param {{options: [{icon: string, text: string, value: string}]}} args   Options is array for buttons
 * @returns {{}}
 */
module.exports = function (result, args) {
  var name = result.name,
    options = args.options,
    field = dom.create(`
      <div class="input-label">
        <div class="segmented-button">
          ${ createOptions(name, options) }
        </div>
      </div>
    `);

  result.el = field;

  return result;
};
