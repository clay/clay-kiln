var _ = require('lodash'),
  dom = require('./dom'),
  behaviors = require('./behaviors');

/**
 * get values from inputs, lists, etc
 * @param  {{}} data
 * @param  {Element} el
 * @return {{}}
 */
function getValues(data, el) {
  var binding,
    name = el.getAttribute('name'),
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

  _.reduce(dom.findAll(form, 'input,select,textarea'), getValues, data);
  _.reduce(dom.findAll(form, '.simple-list'), getValues, data);
  // todo: re-add more exotic behaviors: lists, contenteditable, etc
  return data;
}

module.exports = getFormValues;
