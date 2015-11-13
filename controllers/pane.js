module.exports = function () {
  var dom = require('../services/dom'),
    noScrollClass = 'noscroll';

  /**
   * @returns {DOMTokenList}
   */
  function getHtmlClassList() {
    return dom.find('html').classList;
  }

  /**
   * Disable scrolling on the page.
   */
  function disableScroll() {
    getHtmlClassList().add(noScrollClass);
  }

  /**
   * Enable scrolling on the page.
   */
  function enableScroll() {
    getHtmlClassList().remove(noScrollClass);
  }

  function constructor(el) {
    disableScroll();
    dom.onRemove(el, enableScroll);

    this.el = el;
  }

  constructor.prototype = {
    events: {
      'click': 'close',
      '.close click': 'close'
    },

    close: function (e) {
      var el = this.el;

      if (e.target === e.currentTarget) {
        // we clicked on the overlay itself
        dom.removeElement(el);
      }
    }
  };
  return constructor;
};
