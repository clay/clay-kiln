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
  var name = el.getAttribute('name'),
    view = behaviors.getBinding(name),
    path, viewData;

  if (view && view.models) {
    path = view.models.path;
    viewData = view.models.data;
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
