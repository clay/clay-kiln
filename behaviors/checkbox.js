/*
Checkbox has no arguments!
 */

var dom = require('../services/dom');

/**
 * Replace result.el with checkbox.
 * @param {{name: string}} result
 * @returns {{}}
 */
module.exports = function (result) {
  var name = result.name,
    tpl = `
      <label class="input-label">
        <input class="input-checkbox" rv-field="${name}" type="checkbox" rv-checked="${name}.data.value" />
      </label>
    `,
    checkbox = dom.create(tpl);

  result.el = checkbox;

  return result;
};
