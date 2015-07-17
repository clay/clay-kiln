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
