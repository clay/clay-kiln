var dom = require('../services/dom');

module.exports = function (result, args) {
  var bindings = result.bindings,
    textArea;

  // add some stuff to the bindings
  bindings.required = !!args.required;
  bindings.placeholder = args.placeholder || '';

  textArea = dom.create(`
    <label class="input-label"><span class="label-inner">{ label }</span>
      <textarea class="editor-textarea" data-field="${bindings.name}" rv-required="required" rv-placeholder="placeholder" rv-value="data.value"></textarea>
    </label>
  `);

  result.el = textArea;

  return result;
};
