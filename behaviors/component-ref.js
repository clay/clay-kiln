/*
Component Ref is used to append hidden fields that allow component instances
to affect other component instances, e.g. article affecting the page title

Component-Ref arguments

selector {string} a query selector that matches the components you want to grab
 */
var _ = require('lodash'),
  dom = require('../services/dom'),
  references = require('../services/references');

module.exports = function (result, args) {
  var hiddenInput, name = result.name;

  if (args.selector) {
    console.log(args.selector);
    console.log(document.querySelectorAll(args.selector));
    result.bindings.data.value = _.map(document.querySelectorAll(args.selector), function (el) {
      return el.getAttribute(references.referenceAttribute);
    });
    console.log(result.bindings.data.value);
    hiddenInput = dom.create(`<input type="hidden" class="input-text" rv-field="${name}" rv-value="${name}.data.value">`);
    console.log(hiddenInput);
    result.el.appendChild(hiddenInput);
    console.log(result.el);
  }
  return result;
};
