var dom = require('../services/dom'),
  _ = require('lodash'),
  invalidTypes = [
    'button', // use other behaviors, e.g. segmented-button
    'checkbox', // use checkbox or checkbox-group behaviors
    'file', // use custom file uploading behaviors
    'hidden', // use specific hidden behaviors, e.g. component-ref
    'image', // unsupported
    'radio', // use segmented-button, radio, etc behaviors
    'reset', // unsupported form-level input
    'search', // unsupported, not needed for input
    'submit' // unsupported form-level input (i.e. we already have submit buttons)
  ];

/**
 * Replace result.el with input.
 * @param {{name: string, bindings: {}}} result
 * @param {{}} args   defined in detail below:
 * @param {string}  [args.type]        defaults to `text` if not defined
 * @param {boolean} [args.required]    set input required (blocking)
 * @param {RegExp}  [args.pattern]     required input pattern (blocking)
 * @param {number}  [args.minLength]   minimum number of characters required (blocking)
 * @param {number}  [args.maxLength]   maximum number of characters allowed (blocking)
 * @param {string}  [args.placeholder] placeholder that will display in the input
 * @returns {*}
 */
module.exports = function (result, args) {
  var textField,
    bindings = result.bindings,
    name = result.name,
    type = args.type || 'text';

  if (_.contains(invalidTypes, type)) {
    throw new Error('Input type is invalid: ' + type);
  }

  // add some stuff to the bindings
  bindings.required = args.required;
  bindings.pattern = args.pattern;
  bindings.minLength = args.minLength;
  bindings.maxLength = args.maxLength;
  bindings.placeholder = args.placeholder;

  textField = dom.create(`
      <label class="input-label">
        <input
          class="input-text"
          rv-field="${name}"
          type="${type}"
          rv-required="${name}.required"
          rv-pattern="${name}.pattern"
          rv-minLength="${name}.minLength"
          rv-maxLength="${name}.maxLength"
          rv-placeholder="${name}.placeholder"
          rv-value="${name}.data.value" />
      </label>
    `);

  result.el = textField;

  return result;
};
