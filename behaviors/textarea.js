var dom = require('../services/dom');

/**
 * Create textarea.
 * @param {{name: string, bindings: {}}} result
 * @param {required: boolean, placeholder: string} args  described in detail below:
 * @param {boolean} args.required     set input required (blocking)
 * @param {string}  args.placeholder  placeholder that will display in the textarea
 * @returns {{}}
 */
module.exports = function (result, args) {
  var name = result.name,
    bindings = result.bindings,
    textArea;

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
