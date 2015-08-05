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
  if (args.selector) {
    result.bindings.data.value = _.map(document.querySelectorAll(args.selector), function (el) {
      return el.getAttribute(references.referenceAttribute);
    });
    result.el.appendChild(dom.create(`<input type="hidden" class="input-text" data-field="${result.bindings.name}" rv-value="data.value" />`));
  }
  return result;
};
