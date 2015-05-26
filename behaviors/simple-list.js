'use strict';
var dom = require('../services/dom');

module.exports = function (result, args) {
  var min = args.min,
    max = args.max,
    listTpl = `
    <section tabindex="-1" contenteditable="true" class="simple-list">
      <span tabindex="0" rv-each-item="data" class="simple-list-item" rv-class-primary="item.primary">{ item.text }</span>
    </section>`,
    el = dom.create(listTpl);

  result.el = el;

  return result;
};