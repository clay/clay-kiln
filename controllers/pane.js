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

  /**
   * calculate pane inner height
   * @param {Element} pane
   * @param {Element} paneTabs
   * @returns {number}
   */
  function calculateHeight(pane, paneTabs) {
    return parseInt(getComputedStyle(pane).height, 10) - parseInt(getComputedStyle(paneTabs).height, 10);
  }

  /**
   * pane controller
   * note: if no active tab is passed in, the first tab will be active
   * @param {Element} el (of the pane overlay)
   * @param {object} [active] tab to make active when pane opens
   */
  function constructor(el, active) {
    var pane = dom.find(el, '.kiln-toolbar-pane'),
      paneTabs = dom.find(el, '.pane-tabs'),
      paneInner = dom.find(el, '.pane-inner');

    dom.onRemove(el, enableScroll);
    setTimeout(function () {
      disableScroll();
      // this needs to happen AFTER any onRemove event fires from a previous pane
      // since we're switching between panes very quickly
    }, 0);

    // set active tab
    if (active) {
      dom.find(el, `#${active.header}`).classList.add('active');
      dom.find(el, `#${active.content}`).classList.add('active');
    } else {
      // if no active tab passed in, first tab is activated
      dom.find(el, '.pane-tab').classList.add('active');
      dom.find(el, '.pane-content').classList.add('active');
    }

    // set the inner height so when we filter/switch tabs the pane won't jump around
    // note: we set inner height because that's what should scroll, not the whole pane.
    // the tabs stay at the top
    paneInner.style.height = calculateHeight(pane, paneTabs) + 'px';

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
        activeTab = e.currentTarget,
        id = activeTab.getAttribute('data-content-id'),
        activeContent = dom.find(el, `#${id}`),
        oldTab = dom.find(el, '.pane-tab.active') || dom.find(el, '.pane-tab-dynamic.active'),
        oldContent = dom.find(el, '.pane-content.active') || dom.find(el, '.pane-content-dynamic.active');

      // if the tab we clicked is disabled, don't switch to it
      if (activeTab.classList.contains('disabled')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

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
