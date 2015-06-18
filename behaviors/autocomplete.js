var dom = require('../services/dom'),
  db = require('../services/db');

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
 * Create a unique name for the list. Does not need to be too unique because specific to one form.
 * @returns {string}      Name to be used for the list
 */
function createListName() {

  var somewhatUnique = '' + Math.floor(Math.random() * 100) + (new Date()).getTime();

  return 'autocomplete-' + somewhatUnique;
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


module.exports = function (result, args) {

  var api = args.api,
    existingInput = findFirstTextInput(result.el),
    listName = createListName(),
    datalist;

  // Requirements.
  if (!api) {
    console.warn('Autocomplete requires an API.');
    return result;
  }
  if (!existingInput) {
    console.warn('Autocomplete requires a text input.');
    return result;
  }

  // Add element.
  datalist = document.createElement('datalist');
  result.el.appendChild(datalist);

  // Connect datalist to input.
  datalist.id = listName;
  existingInput.setAttribute('list', listName);

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
