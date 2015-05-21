'use strict';
module.exports = function () {
  var dom = require('../services/dom'),
    edit = require('../services/edit'),
    formvalues = require('../services/formvalues');
    
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
      e.preventDefault();

      var form = this.form,
        ref = this.ref,
        path = this.path,
        newData = formvalues(form);

      if (form.checkValidity()) {
        edit.update(ref, newData, path);
      }
    }
  };

  return constructor;
};