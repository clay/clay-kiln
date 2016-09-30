const _ = require('lodash'),
  dom = require('@nymag/dom'),
  ds = require('dollar-slice'),
  tpl = require('../tpl'),
  paneController = require('../../controllers/pane');

/**
 * add a disabled class to disabled tabs
 * @param {boolean} isDisabled
 * @returns {string}
 */
function setDisabled(isDisabled) {
  return isDisabled ? 'disabled' : '';
}

/**
 * create pane
 * @param {array} tabs
 * @param {object} [dynamicTab]
 * @returns {Element}
 */
function createPane(tabs, dynamicTab) {
  var el = tpl.get('.kiln-pane-template'),
    tabsEl = dom.find(el, '.pane-tabs'),
    tabsInnerEl = dom.find(el, '.pane-tabs-inner'),
    innerEl = dom.find(el, '.pane-inner');

  // loop through the tabs, adding the tab and contents
  _.each(tabs, function (tab, index) {
    var index1 = index + 1, // 1-indexed, for easier debugging
      contentWrapper = dom.create(`<div id="pane-content-${index1}" class="pane-content ${setDisabled(tab.disabled)}"></div>`);

    tabsInnerEl.appendChild(dom.create(`<span id="pane-tab-${index1}" data-content-id="pane-content-${index1}" class="pane-tab ${setDisabled(tab.disabled)}">${tab.header}</span>`));
    contentWrapper.appendChild(tab.content);
    innerEl.appendChild(contentWrapper);
  });

  // lastly, add the dynamic tab if it exists
  if (dynamicTab) {
    let contentWrapper = dom.create(`<div id="pane-content-dynamic" class="pane-content ${setDisabled(dynamicTab.disabled)}"></div>`);

    tabsEl.appendChild(dom.create(`<span id="pane-tab-dynamic" data-content-id="pane-content-dynamic" class="pane-tab-dynamic ${setDisabled(dynamicTab.disabled)}">${dynamicTab.header}</span>`));
    contentWrapper.appendChild(dynamicTab.content);
    innerEl.appendChild(contentWrapper);
  }

  return el;
}

/**
 * close an open pane
 */
function close() {
  var pane = dom.find('.kiln-toolbar-pane-background');

  if (pane) {
    // Remove pane element
    dom.removeElement(pane);
    // Fire close event
    window.kiln.trigger('pane:close', pane);
  }
}

function findActiveTab(el, tabs, dynamicTab) {
  // it's faster to check the dynamic tab first, then iterate through the tabs
  if (dynamicTab && dynamicTab.active) {
    return {
      header: 'pane-tab-dynamic',
      content: 'pane-content-dynamic'
    };
  } else if (_.find(tabs, (tab) => tab.active)) {
    let active = _.findIndex(tabs, (tab) => tab.active) + 1; // 1-indexed

    return {
      header: `pane-tab-${active}`,
      content: `pane-content-${active}`
    };
  }
}

/**
 * open a pane
 * @param {array} tabs with `tab` and `content`
 * @param {object} dynamicTab will display at the right of the tabs
 * @returns {Element} pane
 */
function open(tabs, dynamicTab) {
  var toolbar = dom.find('.kiln-toolbar'),
    el = createPane(tabs, dynamicTab),
    active = findActiveTab(el, tabs, dynamicTab), // find active tab, if any
    pane, paneWrapper;

  close(); // close any other panes before opening a new one
  dom.insertBefore(toolbar, el);
  paneWrapper = toolbar.previousElementSibling; // now grab a reference to the dom
  // init controller for pane background, setting active tab if it exists
  ds.controller('paneWrapper', paneController);
  ds.get('paneWrapper', paneWrapper, active);
  // Fire an event for pane open, pass along the content of the pane
  window.kiln.trigger('pane:open', paneWrapper, active);
  // trick browser into doing a repaint, to force the animation
  setTimeout(function () {
    pane = dom.find(paneWrapper, '.kiln-toolbar-pane');
    pane.classList.add('on');
  }, 0);
  return paneWrapper;
}

module.exports.close = close;
module.exports.open = open;
_.set(window, 'kiln.services.pane', module.exports); // export for plugins
