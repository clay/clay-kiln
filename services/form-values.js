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
      return _.contains(key, '_');
    });
  } else {
    return value;
  }
}

/**
 * get values from inputs, lists, etc
 * @param  {{}} data
 * @param  {Element} el
 * @return {{}}
 */
function getValues(data, el) {
  var name = el.getAttribute(references.fieldAttribute),
    view = formCreator.getBindings(),
    binding, viewData;

  if (view && view.bindings && view.bindings.length) {
    binding = _.find(view.bindings, function (value) { return value.el === el; });
    // clear out the _rv's and getters and setters
    viewData = _.cloneDeep(binding.observer.value());
    // remove any behavior metadata from the view data
    viewData = removeBehaviorMeta(viewData);
    // if the data is a string, trim it!
    if (_.isString(viewData)) {
      viewData = viewData.replace(/(\u00a0|&nbsp;|&#160;)/g, ' '); // remove &nbsp;
      viewData = viewData.trim();
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
  var data = {};

  if (!form || !form instanceof Element || form.tagName !== 'FORM') {
    throw new Error('Cannot get form values from non-elements!');
  }

  _.reduce(dom.findAll(form, '[' + references.fieldAttribute + ']'), getValues, data);
  // all bound fields should have a [data-field] attribute
  // afterwards, clear the bindings
  formCreator.clearBindings();
  return data;
}

module.exports.get = getFormValues;
