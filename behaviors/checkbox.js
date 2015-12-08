var dom = require('../services/dom');

/**
 * Replace result.el with checkbox.
 * @param {{name: string}} result
 * @param {{label: string}} args
 * @returns {{}}
 */
module.exports = function (result, args) {
  var name = result.name,
    label = args.label,
    tpl = `
      <label class="input-label">
        <input class="input-checkbox" rv-field="${name}" type="checkbox" rv-checked="${name}.data.value" /><span class="checkbox-label">${label}</span>
      </label>
    `,
    checkbox = dom.create(tpl);

  result.el = checkbox;

  return result;
};
