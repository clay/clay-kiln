'use strict';
var dom = require('../services/dom');

module.exports = function (result, args) {
  var el = result.el,
    tooltip = args.value,
    tpl = `<p class="label-tooltip">${ tooltip }</p>`,
    tooltipEl = dom.create(tpl);

  dom.insertBefore(dom.find(el, 'input'), tooltipEl);
  return result;
};