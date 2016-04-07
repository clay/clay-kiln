var dom = require('@nymag/dom'),
  db = require('../services/edit/db'),
  _ = require('lodash'),
  site = require('../services/site'),
  getInput = require('../services/get-input'),
  textProp = 'text';

import cid from '../services/cid';

/**
 *
 * @param {[string]|[{text: string}]} items
 * @returns {[string]}
 */
function flattenText(items) {
  var pluckedText = _.compact(_.pluck(items, textProp)),
    hasTextProp = _.isString(_.first(pluckedText));

  return hasTextProp ? pluckedText : items;
}

/**
 * Converts array of strings to option elements.
 * @param {array} items
 * @returns {Element}
 */
function formatOptions(items) {
  var optionsEl,
    options = flattenText(items).reduce(function (prev, curr) {
      return prev + '<option>' + curr + '</option>';
    }, '');

  optionsEl = dom.create(`
    <label>
      <select>
        ${ options }
      </select>
    </label>
  `);

  return optionsEl;
}

/**
 * Throw an error if missing requirements.
 * @param {string} api
 * @param {Element} existingInput
 */
function handleDevErrors(api, existingInput) {

  var missing;

  if (!api) {
    missing = 'an API';
  } else if (!existingInput) {
    missing = 'a text input';
  }

  if (missing) {
    throw new Error('Autocomplete requires ' + missing + '.');
  }

}

/**
 * get api from either the api or list args
 * @param {object} args
 * @param {string} [args.api]
 * @param {string} [args.list]
 * @returns {string|null}
 */
function getApi(args) {
  if (args.api) {
    return args.api;
  } else if (args.list) {
    return site.get('prefix') + '/lists/' + args.list;
  } else {
    return null;
  }
}

/**
 * Append a datalist element with data from API for autocomplete.
 * @param {{el: Element}} result
 * @param {{}} args
 * @param {string} [args.api]   api to point to
 * @param {string} [args.list]  list (in the current site) to point to
 * @returns {*}
 */
module.exports = function (result, args) {
  var api = getApi(args),
    existingInput = getInput(result.el),
    datalistId = 'autocomplete-' + cid(),
    datalist = document.createElement('datalist');

  // note: currently safari doesn't support datalist
  if ('options' in datalist) {
    handleDevErrors(api, existingInput);

    // Add element.
    result.el.appendChild(datalist);

    // Connect datalist to input.
    datalist.id = datalistId;
    existingInput.setAttribute('list', datalistId);

    // Todo: once lists become large, this will need to be optimized; perhaps using the 'input' event.
    existingInput.addEventListener('focus', function () {
      db.get(api)
        .then(formatOptions)
        .then(function (optionsEl) {
          dom.clearChildren(datalist);
          datalist.appendChild(optionsEl);
        });
    });
  }

  return result;
};

// Export for unit testing
module.exports.formatOptions = formatOptions;
