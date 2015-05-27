'use strict';
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
    binding = behaviors.getBinding(name),
    path, viewData;

  if (binding && binding.models) {
    path = binding.models.path;
    viewData = binding.models.data;
    _.deepSet(data, path, viewData);
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
  console.log(data)
  return data;
}

module.exports = getFormValues;