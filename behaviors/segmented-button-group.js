import _ from 'lodash';

const dom = require('@nymag/dom'),
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
 * Create label for value.
 * @param {string} id
 * @param {{}} val
 * @param {string} [val.icon]
 * @param {string} [val.text]
 * @param {string} val.value
 * @returns {string}
 */
function getLabel(id, val) {
  if (val.icon) {
    return `<label for="${id}" title="${getTitle(val.value)}"><img src="${site.get('assetPath') + val.icon }" alt="${ val.text || val.value }" /></label>`;
  } else {
    return `<label for="${id}" title="${getTitle(val.value)}">${ val.text || val.value }</label>`;
  }
}

/**
 * Create input for each value.
 * @param {string} name
 * @param {[{icon: string, text: string, value: string}]} values
 * @returns {string}
 */
function createValues(name, values) {
  return values.map(function (val, index) {
    var id = name + '-' + val.value + '-' + index;

    return `<input name="${name}" type="radio" id="${id}" rv-checked="${name}.data.value" value="${val.value}" />${ getLabel(id, val) }`;
  }).join('\n');
}

/**
 * create each group
 * @param {string} name passed to createValues
 * @param {[{title: string, values: array}]} options
 * @returns {string}
 */
function createOptions(name, options) {
  return options.map(function (option) {
    return `<div class="group">
      <span class="title">${option.title}</span>
      ${createValues(name, option.values)}
    </div>`;
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
        <div class="segmented-button-group" rv-field="${name}">
          ${ createOptions(name, options) }
        </div>
      </div>
    `);

  result.el = field;

  return result;
};
