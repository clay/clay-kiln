'use strict';
module.exports = function () {
  var dom = require('../services/dom');
  
  function constructor(el) {
    this.overlay = el;
    this.modal = dom.find(el, '.editor-modal');
  }

  constructor.prototype = {
    events: {
      'click': 'close'
    },

    close: function (e) {
      var overlay = this.overlay;

      if (e.target === e.currentTarget) {
        // we clicked on the overlay itself
        dom.removeElement(overlay);
        dom.find('html').classList.remove('noscroll');
      }
    }
  };
  return constructor;
};