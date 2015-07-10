module.exports = function () {
  var _ = require('lodash'),
    dom = require('../services/dom'),
    focus = require('../decorators/focus'),
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

  /**
   * Add a mutation observer to detect when the overlay is removed from the dom.
   * @param {Element} el    Element to observe.
   * @param {Function} fn   Function to execute when element is removed.
   */
  function onRemove(el, fn) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (_.contains(mutation.removedNodes, el)) {
          fn();
          observer.disconnect();
        }
      });
    });

    observer.observe(el.parentNode, {childList: true});
  }

  function constructor(el) {
    disableScroll();
    onRemove(el, enableScroll);
  }

  constructor.prototype = {
    events: {
      'click': 'close'
    },

    close: function (e) {
      if (e.target === e.currentTarget) {
        // we clicked on the overlay itself
        focus.unfocus();
      }
    }
  };
  return constructor;
};
