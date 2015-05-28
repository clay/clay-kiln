'use strict';
var dom = require('../services/dom');

module.exports = function (result) {
  var name = result.bindings.name,
    tpl = `
      <label class="input-label"><span class="label-inner">{ label }</span> 
        <input class="input-checkbox" name="${name}" type="checkbox" rv-checked="data" />
      </label>
    `,
    checkbox = dom.create(tpl);

  result.el = checkbox;

  return result;
};