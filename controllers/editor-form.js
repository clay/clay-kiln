'use strict';
module.exports = function () {
  var dom = require('../services/dom'),
    formCreator = require('../services/formcreator'),
    edit = require('../services/edit');
    
  function constructor(el, ref, path) {
    var height, parentHeight;

    // change height to auto if the editor doesn't need to scroll
    if (
      (el.parentNode.classList.contains('editor') ||
      el.parentNode.classList.contains('editor-modal')) &&
      el.parentNode.parentNode) {
      height = parseInt(getComputedStyle(dom.find(el, '.input-container')).height);
      parentHeight = parseInt(getComputedStyle(el.parentNode).height);

      if (height < parentHeight) {
        el.parentNode.parentNode.style.height = 'auto';
      }
    }

    this.el = el;
    this.ref = ref;
    this.path = path;
    this.form = el.tagName.toLowerCase() === 'form' ? el : dom.find(el, 'form');
  }

  constructor.prototype = {
    events: {
      'submit': 'saveData',
      '.save click': 'saveData'
    },

    saveData: function (e) {
      var form = this.form,
        ref = this.ref,
        path = this.path,
        newData = formCreator.getFormValues(form);

      // prevent default form submit
      dom.preventDefault(e);

      if (form.checkValidity()) {
        edit.update(ref, newData, path);
      }
    }
  };

  return constructor;
};