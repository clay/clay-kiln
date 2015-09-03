var _ = require('lodash'),
  dom = require('./dom'),
  references = require('./references'),
  formCreator = require('./form-creator');

/**
 * recursively remove any metadata that behaviors use
 * metadata is added as _<property> in the bindings
 * @param {*} value
 * @returns {*}
 */
function removeBehaviorMeta(value) {
  if (_.isArray(value)) {
    return _.map(value, removeBehaviorMeta);
  } else if (_.isObject(value)) {
    return _.omit(value, function (val, key) {
      return key !== '_schema' && _.contains(key, '_');
    });
  } else {
    return value;
  }
}

/**
 * Removes non-breaking spaces and trims the string.
 * @param {string} str
 * @returns {string}
 */
function cleanTextField(str) {
  return str.replace(/(\u00a0|&nbsp;|&#160;)/g, ' ').trim();
}

/**
 * get values from inputs, lists, etc
 * @param {array} bindings
 * @param  {{}} data
 * @param  {Element} el
 * @return {{}}
 */
function getValues(bindings, data, el) {
  var name = el.getAttribute(references.fieldAttribute),
    binding, viewData;

  if (bindings && bindings.length) {
    binding = _.find(bindings, function (value) { return value.keypath === name; });
    // clear out the _rv's and getters and setters
    viewData = _.cloneDeep(binding.observer.value().data);
    // // remove any behavior metadata from the view data
    viewData = removeBehaviorMeta(viewData);
    // // if the data is a string, trim it!
    if (viewData.value && _.isString(viewData.value)) {
      viewData.value = module.exports.cleanTextField(viewData.value);
    }
    data[name] = viewData;
  }

  return data;
}

/**
 * @param {Element} form
 * @returns {object}
 */
function getFormValues(form) {
  var data = {},
    bindings;

  if (!form || !form instanceof Element || form.tagName !== 'FORM') {
    throw new Error('Cannot get form values from non-elements!');
  }

  // get the bindings after the assertion
  bindings = formCreator.getBindings().bindings;

  _.reduce(dom.findAll(form, '[' + references.fieldAttribute + ']'), getValues.bind(null, bindings), data);
  // all bound fields should have a [rv-field] attribute
  // afterwards, clear the bindings
  formCreator.clearBindings();
  return data;
}

module.exports.get = getFormValues;
module.exports.cleanTextField = cleanTextField; // Used by forms.js for detecting data changes.
