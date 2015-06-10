var keycode = require('keycode'),
  MediumEditor = require('medium-editor'),
  MediumButton = require('../services/medium-button'),
  dom = require('../services/dom');

module.exports = function (result, args) {
  var rivets = result.rivets,
    isMultiline = !!args.multiline,
    buttons = args.buttons,
    textInput = dom.find(result.el, 'input'),
    wysiwygField = dom.create(`<div class="wysiwyg-input" data-field="${result.bindings.name}" rv-wysiwyg="data.value"></div>`);

  // if more than 5 buttons, put the rest on the second tier
  if (buttons.length > 5) {
    buttons = buttons.splice(5, 0, 'tieredToolbar'); // clicking this expands the toolbar with a second tier
  }

  // hide the original input, while preserving html validation
  // textInput.classList.add('hidden-input');

  // put the rich text field after the input
  dom.replaceElement(textInput, wysiwygField);

  // init medium-editor
  function createEditor() {
    return new MediumEditor(wysiwygField, {
      toolbar: {
        // buttons that go in the toolbar
        buttons: buttons,
        standardizeSelectionStart: true
      },
      paste: { forcePlainText: true }, // todo: clean pasted content
      autoLink: true, // create links automatically when urls are entered
      imageDragging: false, // disallow dragging inline images
      targetBlank: true,
      placeholder: '',
      allowMultiParagraphSelection: isMultiline,
      disableReturn: !isMultiline,
      extensions: {
        tieredToolbar: new MediumButton({
          label: '&hellip;',
          action: function (html) {
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
        })
      }
    });
  }

  rivets.binders.wysiwyg = {
    publish: true,
    bind: function (el) {
      // this is called when the binder initializes
      var observer = this.observer,
        data = observer.value(),
        editor = createEditor();

      console.log('initial data', data);

      // put the initial data into the editor
      el.innerHTML = data;

      // hide the tier2 buttons when closing the toolbar
      editor.subscribe('hideToolbar', function () {
        dom.find('.medium-editor-toolbar').classList.remove('show-all');
        dom.find('.medium-editor-toolbar').classList.remove('show-none');
      });

      // persist editor data to data model on blur and enter
      editor.subscribe('editableInput', function (e, editable) {
        observer.setValue(editable.innerHTML);
        console.log(observer.value());
      });

      // el.addEventListener('keyup', function () {
      //   var text = el.innerHTML;
      //   adapter.set(model, keypath, text);
      // });

      // submit form on enter keydown
      // el.addEventListener('keydown', function (e) {
      //   var key = keycode(e);

      //   if (key === 'enter' || key === 'return') {
      //     e.preventDefault();
      //     dom.find(dom.closest(el, 'form'), '.save').dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
      //   }
      // });

      // todo: clicking this seems to focus() the actual input. this stops it, but I don't know why it's happening
      // el.addEventListener('click', function (e) {
      //   e.preventDefault();
      // });
    }
  };

  return result;
};
