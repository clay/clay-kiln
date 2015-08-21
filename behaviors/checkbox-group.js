/*
Checkbox-Group arguments:

{array} options each has name and value (strings)
 */

var dom = require('../services/dom');

function createOptions(name, options) {
  return options.map(function (option) {
    var optName = option.name,
      optValue = option.value,
      id = name + '-' + optValue + '-' + optName;

    return `
      <div class="checkbox-group-item">
        <input name="${name}" rv-field="${name}" type="checkbox" id="${id}" rv-checked="${name}.data.${optValue}" value="${optValue}" />
        <label for="${id}">${optName}</label>
      </div>
    `;
  }).join('\n');
}

module.exports = function (result, args) {
  var name = result.name,
    options = args.options,
    field;

  field = dom.create(`
    <div class="input-label">
      <div class="checkbox-group">
        ${ createOptions(name, options) }
      </div>
    </div>
  `);

  result.el = field;

  return result;
};
