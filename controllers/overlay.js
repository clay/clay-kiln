module.exports = function () {
  var dom = require('../services/dom'),
    focus = require('../services/focus');

  function constructor() {
    // set noscroll on the html when an overlay opens
    dom.find('html').classList.add('noscroll');
  }

  constructor.prototype = {
    events: {
      'click': 'close'
    },

    close: function (e) {
      if (e.target === e.currentTarget) {
        // we clicked on the overlay itself
        console.log('overlay');
        focus.unfocus();
        dom.find('html').classList.remove('noscroll');
      }
    }
  };
  return constructor;
};
