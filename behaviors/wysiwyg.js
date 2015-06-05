'use strict';
var keycode = require('keycode'),
  MediumEditor = require('medium-editor'),
  MediumButton = require('../services/medium-button'),
  dom = require('../services/dom');

module.exports = function (result, args) {
  var rivets = result.rivets,
    textInput = dom.find(result.el, 'input'),
    isMultiline = args.multiline,
    editor;

  var tpl = `<div class="wysiwyg-input" rv-wysiwyg="data">${result.bindings.data}</div>`,
    wysiwygField = dom.create(tpl);

  // hide the original input, while preserving html validation
  textInput.classList.add('hidden-input');

  // put the rich text field after the input
  dom.insertAfter(textInput, wysiwygField);

  // init medium-editor
  editor = new MediumEditor(wysiwygField, {
    toolbar: {
      // buttons that go in the toolbar
      buttons: [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'anchor',
        'tieredToolbar', // clicking this expands the toolbar with a second tier
        'header1',
        'quote',
        'unorderedList',
        'orderedList'
      ],
      standardizeSelectionStart: true
    },
    paste: { forcePlainText: true }, // todo: clean pasted content
    autoLink: true, // create links automatically when urls are entered
    imageDragging: false, // disallow dragging inline images
    targetBlank: true,
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

  // hide the tier2 buttons when closing the toolbar
  editor.subscribe('hideToolbar', function () {
      dom.find('.medium-editor-toolbar').classList.remove('show-all');
      dom.find('.medium-editor-toolbar').classList.remove('show-none');
  });

  rivets.binders.wysiwyg = {
    publish: true,
    bind: function (el) {
        // this is called when the binder initializes
        var adapter = result.rivets.adapters[result.rivets.rootInterface], // use default adapter
          model = this.model,
          keypath = this.keypath;

        // persist editor data to data model on blur and enter
        editor.subscribe('editableBlur editableKeydownEnter', function (e) {
          console.log(e)
          var text = editor.serialize();
          console.log(text);
          adapter.set(model, keypath, text);
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
        el.addEventListener('click', function (e) {
          e.preventDefault();
        });
    }
  };

  return result;
};