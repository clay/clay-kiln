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
    var firstTab = dom.find(el, '.pane-tab'),
      firstContent = dom.find(el, '.pane-content');

    dom.onRemove(el, enableScroll);
    setTimeout(function () {
      disableScroll();
      // this needs to happen AFTER any onRemove event fires from a previous pane
      // since we're switching between panes very quickly
    }, 0);

    // set first tab + content active
    firstTab.classList.add('active');
    firstContent.classList.add('active');

    this.el = el;
  }

  constructor.prototype = {
    events: {
      click: 'close',
      '.pane-tab click': 'switchTab',
      '.pane-tab-dynamic click': 'switchTab'
    },

    close: function (e) {
      var el = this.el;

      if (e.target === e.currentTarget || e.currentTarget.classList.contains('close')) {
        // we clicked on the overlay itself
        dom.removeElement(el);
      }
    },

    switchTab: function (e) {
      var el = this.el,
        activeTab = e.target,
        id = activeTab.getAttribute('data-content-id'),
        activeContent = dom.find(el, `#${id}`),
        oldTab = dom.find(el, '.pane-tab.active') || dom.find(el, '.pane-tab-dynamic.active'),
        oldContent = dom.find(el, '.pane-content.active') || dom.find(el, '.pane-content-dynamic.active');

      e.stopPropagation();
      // unset currently active tabs/contents
      if (oldTab) {
        oldTab.classList.remove('active');
      }

      if (oldContent) {
        oldContent.classList.remove('active');
      }

      // set new tab + content active
      activeTab.classList.add('active');
      activeContent.classList.add('active');
    }
  };
  return constructor;
};
