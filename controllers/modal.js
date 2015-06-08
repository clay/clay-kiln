'use strict';
module.exports = function () {
  var dom = require('../services/dom');

  function constructor(el) {
    var modal = dom.find(el, '.editor-modal');

    // set noscroll on the html when a modal opens
    dom.find('html').classList.add('noscroll');

    this.overlay = el;
    this.modal = modal;
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
