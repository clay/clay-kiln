var _ = require('lodash'),
  dom = require('./dom'),
  references = require('./references'),
  behaviors = require('./behaviors');

/**
 * get values from inputs, lists, etc
 * @param  {{}} data
 * @param  {Element} el
 * @this ref
 * @return {{}}
 */
function getValues(data, el) {
  var binding,
    name = el.getAttribute(references.fieldAttribute),
    view = behaviors.getBinding(name),
    path, viewData;

  if (view && view.models && view.bindings) {
    binding = _.find(view.bindings, function (value) { return value.el === el; });
    path = view.models.path.replace(references.getComponentNameFromReference(this) + '.', ''); // chop off component name from meta fields
    // clear out the _rv's and getters and setters
    viewData = _.cloneDeep(binding.observer.value());
    _.set(data, path, viewData);
  }

  return data;
}

/**
 * @param {string} ref
 * @param {Element} form
 * @returns {object}
 */
function getFormValues(ref, form) {
  var data = {};

  _.reduce(dom.findAll(form, '[' + references.fieldAttribute + ']'), getValues.bind(ref), data);
  // all bound fields should have a [data-field] attribute
  return data;
}

module.exports = getFormValues;
