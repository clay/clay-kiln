/*
WYSIWYG arguments

multiline {boolean} allow or disallow multi-paragraph selection
buttons {array} array of button names (strings) for tooltip
placeholder {string} placeholder that will display in the input
 */

var keycode = require('keycode'),
  MediumEditor = require('medium-editor'),
  MediumButton = require('../services/medium-button'),
  dom = require('../services/dom');

/**
 * toggle the tiered toolbar
 * this is the action for the tieredToolbar extension
 * @param {Element} html
 * @returns {Element}
 */
function toggleTieredToolbar(html) {
  // note: this element doesn't exist before it's instantiated, so we need to grab it afterwards
  var toolbar = dom.find('.medium-editor-toolbar'),
    toolbarClasses = toolbar.classList;

  if (toolbarClasses.contains('show-none')) {
    toolbarClasses.remove('show-none');
  } else if (toolbarClasses.contains('show-all')) {
    toolbarClasses.add('show-none');
  } else {
    toolbarClasses.add('show-all');
  }
  return html;
}

/**
 * create new medium editor
 * @param {Element} field
 * @param {array} buttons
 * @param {object|false} placeholder
 * @returns {Element}
 */
function createEditor(field, buttons, placeholder) {
  return new MediumEditor(field, {
    toolbar: {
      // buttons that go in the toolbar
      buttons: buttons,
      standardizeSelectionStart: true
    },
    delay: 200, // wait a bit for the toolbar and link previews to display
    paste: {
      forcePlainText: false,
      cleanPastedHTML: true, // clean html from sources like google docs
      cleanTags: [ // remove these tags when pasting
        'meta',
        'script',
        'style',
        'img',
        'object',
        'iframe'
      ],
      cleanReplacements: [
        [/<h[2-9]>/ig, '<h1>'],
        [/<\/h[2-9]>/ig, '</h1>'] // force all headers to the same level
      ]
    },
    autoLink: true, // create links automatically when urls are entered
    imageDragging: false, // disallow dragging inline images
    targetBlank: true,
    allowMultiParagraphSelection: false,
    disableReturn: false,
    placeholder: placeholder,
    extensions: {
      tieredToolbar: new MediumButton({
        label: '&hellip;',
        action: toggleTieredToolbar
      })
    }
  });
}

module.exports = function (result, args) {
  var rivets = result.rivets,
    buttons = args.buttons,
    // add placeholder text if it's passed through, else remove the placeholder
    placeholder = args.placeholder ? { text: args.placeholder } : false,
    textInput = dom.find(result.el, 'input') || dom.find(result.el, 'textarea'),
    field = dom.create(`<div class="wysiwyg-input" data-field="${result.bindings.name}" rv-wysiwyg="data.value"></div>`);

  // if more than 5 buttons, put the rest on the second tier
  if (buttons.length > 5) {
    buttons.splice(5, 0, 'tieredToolbar'); // clicking this expands the toolbar with a second tier
  }

  // put the rich text field after the input
  dom.replaceElement(textInput, field);

  rivets.binders.wysiwyg = {
    publish: true,
    bind: function (el) {
      // this is called when the binder initializes
      var observer = this.observer,
        data = observer.value(),
        editor = createEditor(field, buttons, placeholder);

      // put the initial data into the editor
      el.innerHTML = data;

      // hide the tier2 buttons when closing the toolbar
      editor.subscribe('hideToolbar', function () {
        dom.find('.medium-editor-toolbar').classList.remove('show-all');
        dom.find('.medium-editor-toolbar').classList.remove('show-none');
      });

      // persist editor data to data model on input
      editor.subscribe('editableInput', function (e, editable) {
        observer.setValue(editable.innerHTML);
      });

      // submit form on enter keydown
      el.addEventListener('keydown', function (e) {
        var key = keycode(e);

        if (key === 'enter' || key === 'return') {
          e.preventDefault();
          e.stopPropagation();
          alert('enter pressed!');
        }
      });
    }
  };

  return result;
};
