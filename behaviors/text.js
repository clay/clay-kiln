'use strict';
var h = require('hyperscript'),
  label = require('../services/label');

module.exports = function (el, args, data, name) {
  var textField = h('label',
    h('span.input-label', label(name)),
    args.minLength ? h('span.label-min', args.minLength + ' chars min'): '',
    args.minLength && args.maxLength ? ', ' : '',
    args.maxLength ? h('span.label-max', args.maxLength + ' chars max'): '',
    h('input', {
      name: name,
      type: 'text',
      required: args.required ? 'true' : 'false',
      placeholder: args.placeholder ? args.placeholder : '',
      value: data
    })
  );

  el.appendChild(textField);
  return el;
};