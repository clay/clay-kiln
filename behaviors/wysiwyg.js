'use strict';
var keycode = require('keycode'),
  dom = require('../services/dom');

module.exports = function (result, args) {
  var rivets = result.rivets,
    textInput = dom.find(result.el, 'input');

  var tpl = `<span class="wysiwyg-input" contenteditable="true" rv-wysiwyg="data"></span>`,
    wysiwygField = dom.create(tpl);

  // hide the original input, while preserving html validation
  textInput.classList.add('hidden-input');

  // put the rich text field after the input
  dom.insertAfter(textInput, wysiwygField);

  rivets.binders.wysiwyg = {
    publish: true,
    bind: function (el) {
        // this is called when the binder initializes
        var adapter = result.rivets.adapters[result.rivets.rootInterface], // use default adapter
          model = this.model,
          keypath = this.keypath,
          initialText = adapter.get(model, keypath);

        el.innerHTML = initialText;

        el.addEventListener('keyup', function () {
          var text = el.innerHTML;
          adapter.set(model, keypath, text);
        });

        // submit form on enter keydown
        el.addEventListener('keydown', function (e) {
          var key = keycode(e);

          if (key === 'enter' || key === 'return') {
            e.preventDefault();
            dom.find(dom.closest(el, 'form'), '.save').dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
          }
        });

        el.addEventListener('click', function (e) {
          e.preventDefault();
        });
    }
  };

  return result;
};