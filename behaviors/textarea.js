/*
Textarea arguments

required {boolean} set input required (blocking)
placeholder {string} placeholder that will display in the textarea
 */

var dom = require('../services/dom');

module.exports = function (result, args) {
  var name = result.name,
    bindings = result.bindings,
    textArea;

  // add some stuff to the bindings
  bindings.required = !!args.required;
  bindings.placeholder = args.placeholder || '';

  textArea = dom.create(`
    <label class="input-label">
      <textarea class="editor-textarea" rv-field="${name}" rv-required="${name}.required" rv-placeholder="${name}.placeholder" rv-value="${name}.data.value"></textarea>
    </label>
  `);

  result.el = textArea;

  return result;
};
