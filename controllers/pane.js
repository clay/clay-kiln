module.exports = function () {
  var dom = require('@nymag/dom'),
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
    dom.onRemove(el, enableScroll);
    setTimeout(function () {
      disableScroll();
      // this needs to happen AFTER any onRemove event fires from a previous pane
      // since we're switching between panes very quickly
    }, 0);

    this.el = el;
  }

  constructor.prototype = {
    events: {
      click: 'close',
      '.close click': 'close'
    },

    close: function (e) {
      var el = this.el;

      if (e.target === e.currentTarget || e.currentTarget.classList.contains('close')) {
        // we clicked on the overlay itself
        dom.removeElement(el);
      }
    }
  };
  return constructor;
};
