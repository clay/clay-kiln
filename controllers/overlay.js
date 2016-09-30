module.exports = function () {
  var _ = require('lodash'),
    dom = require('@nymag/dom'),
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

  function constructor(el) {
    disableScroll();
    dom.onRemove(el, enableScroll);
    setTimeout(function () {
      // fade in
      el.classList.add('on');
    }, 0);
    this.el = el;
  }

  constructor.prototype = {
    events: {
      click: 'close'
    },

    close: function (e) {
      // prevent clicks INSIDE the form from bubbling up to other stuff
      // and clicks OUTSIDE the form from causing side effects beyond unfocusing
      // prevents unselecting and such
      e.stopPropagation();

      if (e.target === e.currentTarget) {
        // we clicked on the overlay itself
        focus.unfocus().catch(_.noop);
      }
    }
  };
  return constructor;
};
