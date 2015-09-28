var _ = require('lodash'),
  dom = require('../services/dom'),
  references = require('../services/references');

/**
 * Append hidden field to enable component instances to affect other component instances
 * e.g. article affecting the page title
 * @param {{name: string, bindings: {}, el: Element}} result
 * @param {{selector: string}} args     args.selector is the query selector that matches the components to affect.
 * @returns {{}}
 */
module.exports = function (result, args) {
  var hiddenInput,
    name = result.name;

  if (args.selector) {
    result.bindings.data.value = _.map(document.querySelectorAll(args.selector), function (el) {
      return el.getAttribute(references.referenceAttribute);
    });
    hiddenInput = dom.create(`<input type="hidden" class="input-text" rv-field="${name}" rv-value="${name}.data.value">`);
    result.el.appendChild(hiddenInput);
  }
  return result;
};
