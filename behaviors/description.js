var dom = require('../services/dom');

module.exports = function (result, args) {
  var el = result.el,
    description = args.value,
    tpl = `<p class="label-description">${ description }</p>`,
    descriptionEl = dom.create(tpl);

  dom.insertBefore(dom.find(el, 'input'), descriptionEl);
  return result;
};
