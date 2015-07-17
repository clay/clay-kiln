var _ = require('lodash'),
  dom = require('../services/dom'),
  references = require('../services/references');

module.exports = function (target, args) {
  if (args.selector) {
    target.bindings.data.value = _.map(document.querySelectorAll(args.selector), function (el) {
      return el.getAttribute(references.referenceAttribute);
    });
    target.el.appendChild(dom.create(`<input type="hidden" class="input-text" data-field="${target.bindings.name}" rv-value="data.value" />`));
  }
  return target;
};
