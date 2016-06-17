var dom = require('@nymag/dom'),
  _ = require('lodash'),
  moment = require('moment'),
  datepicker = require('../services/field-helpers/datepicker'),
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
  ],
  firefoxDateFormat = 'YYYY-MM-DD hh:mm A',
  defaultDateFormat = 'YYYY-MM-DDThh:mm';

/**
 * get attribute value of boolean fields
 * e.g. autocomplete: false should be autocomplete="off" in html
 * @param {boolean} value
 * @returns {string}
 */
function onOff(value) {
  return value ? 'on' : 'off';
}

/**
 * add autocomplete if it exists
 * @param {object} args
 * @returns {string}
 */
function addAutocomplete(args) {
  if (args.autocomplete !== undefined) {
    return `autocomplete="${onOff(args.autocomplete)}"`;
  } else {
    return '';
  }
}

/**
 * add auto-capitalize if it exists
 * @param {object} args
 * @returns {string}
 */
function addAutocapitalize(args) {
  var cap = args.autocapitalize;

  if (cap !== undefined) {
    if (_.isString(cap)) {
      return `autocapitalize="${cap}"`;
    } else {
      return `autocapitalize="${onOff(cap)}"`;
    }
  } else {
    return '';
  }
}

/**
 * add step if it exists and we're dealing with number inputs
 * @param {object} args
 * @returns {string}
 */
function addStep(args) {
  var step = args.step,
    type = args.type;

  if (type === 'number' && step) {
    return `step="${step}"`;
  } else {
    return '';
  }
}

/**
 * add datepicker binder if it's a date input
 * @param {string} name
 * @param {string} type
 * @returns {string}
 */
function addDateBinder(name, type) {
  if (_.includes(['datetime-local', 'date', 'time'], type)) {
    return `rv-datepicker="${name}.data.value"`;
  }
}

/**
 * Replace result.el with input.
 * @param {{name: string, bindings: {}}} result
 * @param {{}} args   defined in detail below:
 * @param {string}  [args.type]           defaults to `text` if not defined
 * @param {boolean} [args.required]       set input required (blocking)
 * @param {RegExp}  [args.pattern]        required input pattern (blocking)
 * @param {number}  [args.minLength]      minimum number of characters required (blocking)
 * @param {number}  [args.maxLength]      maximum number of characters allowed (blocking)
 * @param {string}  [args.placeholder]    placeholder that will display in the input
 * @param {boolean}  [args.autocomplete]  enable/disable autocomplete on field (defaults to true)
 * @param {number} [args.step]            define step increments (for number type)
 * @param {boolean|string}  [args.autocapitalize] enable/disable auto-capitalize on field (defaults to true). if set to "words" it will capitalize the first letter of each word
 * (note: on recent mobile browsers, certain input types will have auto-capitalize disabled, e.g. emails)
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
          ${addDateBinder(name, type)}
          ${addStep(args)}
          ${addAutocomplete(args)}
          ${addAutocapitalize(args)}
          rv-required="${name}.required"
          rv-pattern="${name}.pattern"
          rv-minLength="${name}.minLength"
          rv-maxLength="${name}.maxLength"
          rv-placeholder="${name}.placeholder"
          rv-value="${name}.data.value" />
      </label>
    `);

  // if it's a date input, init datepicker for non-native browsers
  if (_.includes(['datetime-local', 'date', 'time'], type)) {
    result.binders.datepicker = {
      publish: true,
      bind: function (el) {
        var observer = this.observer;

        // when instantiating, convert from the ISO format (what we save) to firefox's format (what the datepicker needs)
        if (!datepicker.hasNativePicker()) {
          el.value = moment(observer.value()).format(firefoxDateFormat);
          datepicker.init(el, { onChange: function (date) {
            // when the datepicker changes, convert it back to ISO format
            observer.setValue(moment(date).toISOString());
          }});
        } else {
          // use iso format
          el.value = moment(observer.value()).format(defaultDateFormat);
        }
      },
      routine: function (el, value) {
        // every time the data updates, display the NEW data in firefox's format
        if (!datepicker.hasNativePicker()) {
          el.value = moment(value).format(firefoxDateFormat);
        } else {
          el.value = moment(value).format(defaultDateFormat);
        }
      }
    };
  }

  result.el = textField;

  return result;
};
