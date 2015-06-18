var dom = require('../services/dom'),
  db = require('../services/db'),
  cid = require('../services/cid');

/**
 * Find the first child that is a text input.
 * @param {object} el
 * @returns {object|undefined}
 */
function findFirstTextInput(el) {

  var inputs, l, i, type, isTextInput;

  inputs = el.querySelectorAll('input');

  for (i = 0, l = inputs.length; i < l; i++) {
    type = inputs[i].getAttribute('type');
    isTextInput = !type || type === 'text';
    if (isTextInput) {
      return inputs[i];
    }
  }
}

/**
 * Converts array of strings to option elements.
 * @param {array} options
 * @returns {object}
 */
function formatOptions(options) {
  options = options.reduce(function (prev, curr) {
    return prev + '<option>' + curr + '</option>';
  }, '');

  options = dom.create(`
    <label>
      <select>
        ${ options }
      </select>
    </label>
  `);

  return options;
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

module.exports = function (result, args) {

  var api = args.api,
    existingInput = findFirstTextInput(result.el),
    datalistId = 'autocomplete-' + cid(),
    datalist;

  handleDevErrors(api, existingInput);

  // Add element.
  datalist = document.createElement('datalist');
  result.el.appendChild(datalist);

  // Connect datalist to input.
  datalist.id = datalistId;
  existingInput.setAttribute('list', datalistId);

  // Adding options async, so using onload event to keep behavior synchronous for form-creator.
  datalist.onload = db.getComponentJSONFromReference(api)
    .then(formatOptions)
    .then(function (options) {
      datalist.appendChild(options);
    });

  return result;
};

// Export for unit testing
module.exports.formatOptions = formatOptions;
