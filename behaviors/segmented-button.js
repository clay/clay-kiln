/*
Segmented Button arguments

options {array} which buttons to have.
  each is an object with [icon] {string}, [text] {string}, and value {string}
 */

var dom = require('../services/dom');

function getLabel(id, option) {
  if (option.icon) {
    return `<label for="${id}"><img src="${ option.icon }" alt="${ option.text || option.value }" /></label>`;
  } else {
    return `<label for="${id}">${ option.text || option.value }</label>`;
  }
}

function createOptions(name, options) {
  return options.map(function (option, index) {
    var id = name + '-' + option.value + '-' + index;

    return `<input name="${name}" data-field="${name}" type="radio" id="${id}" rv-checked="data.value" value="${option.value}" />${ getLabel(id, option) }`;
  }).join('\n');
}

module.exports = function (result, args) {
  var bindings = result.bindings,
    options = args.options,
    field;

  field = dom.create(`
    <div class="input-label">
      <div class="segmented-button">
        ${ createOptions(bindings.name, options) }
      </div>
    </div>
  `);

  result.el = field;

  return result;
};
