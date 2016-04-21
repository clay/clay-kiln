var Codemirror = require('codemirror'),
  dom = require('@nymag/dom');

// scss mode
require('codemirror/mode/css/css');
// show selections
require('codemirror/addon/selection/active-line.js');

function initCodemirror() {
  return {
    publish: true,
    bind: function (el) {
      // this is called when the binder initializes
      var mode = el.getAttribute('data-codemirror-mode'),
        observer = this.observer,
        data = observer.value() || '', // don't print 'undefined' if there's no data
        editor = Codemirror.fromTextArea(el, {
          value: data,
          mode: mode,
          lint: true,
          styleActiveLine: true,
          lineNumbers: true
        });

      // refresh the codemirror instance after it instantiates
      // wait until it gets redrawn in the dom first
      setTimeout(function () {
        editor.refresh();
      }, 0);

      editor.on('change', function (instance) {
        observer.setValue(instance.getValue());
      });
    }
  };
}

/**
 * Create WYSIWYG text editor.
 * @param {{name: string, el: Element, binders: {}}} result
 * @param {object} args  Described in detail below:
 * @param {string} args.mode  language to display (e.g. scss, javascript, etc)
 * @returns {object}
 */
module.exports = function (result, args) {
  var name = result.name,
    binders = result.binders,
    mode = args.mode,
    field = dom.create(`<label class="input-label">
      <textarea class="codemirror" rv-field="${name}" rv-codemirror="${name}.data.value" data-codemirror-mode="${mode}" rv-value="${name}.data.value"></textarea>
    </label>`);

  // add the input to the field
  result.el = field;

  // add the binder
  binders.codemirror = initCodemirror();

  return result;
};
