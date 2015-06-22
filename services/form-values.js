var _ = require('lodash'),
  dom = require('./dom'),
  references = require('./references'),
  behaviors = require('./behaviors');

/**
 * get values from inputs, lists, etc
 * @param  {{}} data
 * @param  {Element} el
 * @return {{}}
 */
function getValues(data, el) {
  var binding,
    name = el.getAttribute(references.fieldAttribute),
    view = behaviors.getBinding(name),
    path, viewData;

  if (view && view.models && view.bindings) {
    binding = _.find(view.bindings, function (value) { return value.el === el; });
    path = view.models.path;
    // clear out the _rv's and getters and setters
    viewData = _.cloneDeep(binding.observer.value());
    _.set(data, path, viewData);
  }

  return data;
}

/**
 * @param {Element} form
 * @returns {object}
 */
function getFormValues(form) {
  var data = {};

  _.reduce(dom.findAll(form, '[' + references.fieldAttribute + ']'), getValues, data);
  // all bound fields should have a [data-field] attribute
  return data;
}

module.exports = getFormValues;
