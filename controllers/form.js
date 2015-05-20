'use strict';
module.exports = function () {
  var dom = require('../services/dom'),
    edit = require('../services/edit');
    
  function constructor(el, ref, path) {
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
        newData = null; //formCreator.getFormValues(form);

      // prevent default form submit
      dom.preventDefault(e);

      if (form.checkValidity()) {
        edit.update(ref, newData, path);
      }
    }
  };

  return constructor;
};