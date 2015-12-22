var dom = require('../services/dom');

function setRequired(isReq) {
  return isReq ? 'required="true"' : '';
}

/**
 * Create textarea.
 * @param {{name: string, bindings: {}}} result
 * @param {{required: boolean, placeholder: string}} args  described in detail below:
 * @param {boolean} args.required     set input required (blocking)
 * @param {string}  args.placeholder  placeholder that will display in the textarea
 * @returns {{}}
 */
module.exports = function (result, args) {
  var name = result.name,
    bindings = result.bindings,
    textArea;

  args = args || {};
  bindings.placeholder = args.placeholder || '';

  textArea = dom.create(`
    <label class="input-label">
      <textarea class="editor-textarea" rv-field="${name}" ${setRequired(args.required)} rv-placeholder="${name}.placeholder" rv-value="${name}.data.value"></textarea>
    </label>
  `);

  result.el = textArea;

  return result;
};
