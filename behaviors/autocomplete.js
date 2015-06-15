var dom = require('../services/dom'),
  db = require('../services/db'),
  lists = {};

/**
 * Find the first child that is a text input.
 * @param {object} el
 * @returns {object|undefined}
 */
function findFirstTextInput(el) {

  var inputs, l, i, type, textInput;

  inputs = el.querySelectorAll('input');

  for (i = 0, l = inputs.length; i < l; i++) {
    type = inputs[i].getAttribute('type');
    if (!type || type === 'text') {
      textInput = inputs[i];
      break;
    }
  }

  return textInput;
}

/**
 * Get the list values from the API and store in memory.
 * @param {string} apiUrl   The endpoint for the list, e.g. '/lists/authors'
 * @returns {promise}
 */
function getListValues(apiUrl) {
  if (lists[apiUrl]) {
    return Promise.resolve(lists[apiUrl]);
  } else {
    return db.getComponentJSONFromReference(apiUrl);
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


module.exports = function (result, args) {

  var api = args.api,
    existingInput = findFirstTextInput(result.el),
    listName = createListName(),
    optionsParent,
    datalist,
    options;

  // Requirements.
  if (!api) {
    console.warn('Autocomplete requires an API.');
    return result;
  }
  if (!existingInput) {
    console.warn('Autocomplete requires a text input.');
    return result;
  }

  getListValues(api);

  // Add elements.
  datalist = document.createElement('datalist');
  options = dom.create(`
    <label>
      <select>
        <option value="">
      </select>
    </label>
  `);
  datalist.appendChild(options);
  optionsParent = options.querySelector('select');

  // Set attributes.
  existingInput.setAttribute('list', listName);
  datalist.id = listName;

  // Listen.
  existingInput.addEventListener('input', function () {

    getListValues(api).then(function (results) {
      options = results.reduce(function (prev, curr) {
          return prev + '<option>' + curr;
        }, '<option value="">');

      options = dom.create(`${ options }`);
      dom.clearChildren(optionsParent);
      optionsParent.appendChild(options);

      existingInput.focus();
    });

  });

  // Add it back to the result element.
  result.el.appendChild(datalist);

  return result;

};
